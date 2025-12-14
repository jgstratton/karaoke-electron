import Database from '@/database'
import type { MediaFile, MediaMetadataDoc } from '@/types'

const METADATA_DOC_ID = 'media_metadata' as const

type ThumbnailKey = '0' | '1' | '2' | '3'

export type MetadataUpdateProgress = {
	current: number
	total: number
	fileName: string
	relativePath: string
	videoId: string | null
}

type UpdateResult = {
	scannedFiles: number
	skippedNoId: number
	skippedExisting: number
	updated: number
	errors: number
	cancelled: boolean
}

function stripExtension(fileName: string): string {
	return fileName.replace(/\.[^.]+$/, '')
}

function extractYouTubeId(fileNameOrPath: string): string | null {
	const fromBrackets = fileNameOrPath.match(/\[([A-Za-z0-9_-]{11})\]/)
	if (fromBrackets?.[1]) return fromBrackets[1]

	const fromParens = fileNameOrPath.match(/\(([A-Za-z0-9_-]{11})\)/)
	if (fromParens?.[1]) return fromParens[1]

	const base = stripExtension(fileNameOrPath)
	if (/^[A-Za-z0-9_-]{11}$/.test(base)) return base

	const end = base.match(/([A-Za-z0-9_-]{11})$/)
	if (end?.[1]) return end[1]

	return null
}

function inferTitleFromFileName(fileName: string, videoId: string | null): string {
	let base = stripExtension(fileName)
	if (videoId) {
		base = base.replace(`[${videoId}]`, '').replace(`(${videoId})`, '')
		base = base.replace(new RegExp(`${videoId}$`), '')
	}
	return base.trim() || stripExtension(fileName)
}

function splitArtistAndSong(rawTitle: string, fallbackArtist: string): { artist: string; songTitle: string; sourceTitle: string } {
	const sourceTitle = (rawTitle || '').trim()
	const cleaned = sourceTitle
		.replace(/\s+\((?:official\s+)?karaoke[^)]*\)\s*$/i, '')
		.replace(/\s+\[(?:official\s+)?karaoke[^\]]*\]\s*$/i, '')
		.trim()

	const parts = cleaned.split(' - ')
	if (parts.length >= 2) {
		return {
			artist: parts[0].trim(),
			songTitle: parts.slice(1).join(' - ').trim(),
			sourceTitle,
		}
	}

	return {
		artist: (fallbackArtist || '').trim(),
		songTitle: cleaned || sourceTitle,
		sourceTitle,
	}
}

function toRelativePathIfPossible(mediaPath: string, absoluteOrRelative: string): string {
	const mediaNorm = mediaPath.replace(/\//g, '\\').replace(/\\+$/, '')
	const targetNorm = absoluteOrRelative.replace(/\//g, '\\')

	if (targetNorm.toLowerCase().startsWith(mediaNorm.toLowerCase() + '\\')) {
		return targetNorm.slice(mediaNorm.length + 1)
	}
	return absoluteOrRelative
}

class MetadataMediatorClass {
	async updateDatabaseMetadata(options?: {
		onProgress?: (progress: MetadataUpdateProgress) => void
		signal?: AbortSignal
	}): Promise<UpdateResult> {
		const result: UpdateResult = {
			scannedFiles: 0,
			skippedNoId: 0,
			skippedExisting: 0,
			updated: 0,
			errors: 0,
			cancelled: false,
		}

		const settings = await Database.getSettingsDoc()
		const mediaPath = (settings?.mediaPath || '').trim()
		if (!mediaPath) throw new Error('Media folder is not configured. Go to Tools → Settings first.')
		await Database.ensureDiskDatabase({ mediaPath, requireConfigured: true })
		if (!window.fileSystem) throw new Error('File system API is not available.')

		const mediaFiles: MediaFile[] = await window.fileSystem.scanMediaFiles(mediaPath)
		result.scannedFiles = mediaFiles.length

		let doc: MediaMetadataDoc
		try {
			doc = (await Database.getDoc(METADATA_DOC_ID)) as MediaMetadataDoc
		} catch (err: any) {
			if (err?.status === 404) {
				const now = new Date().toISOString()
				doc = {
					_id: METADATA_DOC_ID,
					mediaPath,
					files: {},
					createdAt: now,
					updatedAt: now,
				}
			} else {
				throw err
			}
		}

		if (!doc.files) {
			doc.files = {}
		}

		const ytInstalled = await window.youtube
			.checkInstalled()
			.catch(() => false)

		const maybeSave = async () => {
			doc.mediaPath = mediaPath
			doc.updatedAt = new Date().toISOString()
			while (true) {
				try {
					const saved = await Database.putDoc(doc)
					doc._rev = saved.rev
					break
				} catch (err: any) {
					if (err.status === 409) {
						const latest = (await Database.getDoc(METADATA_DOC_ID)) as MediaMetadataDoc
						doc = {
							...latest,
							files: {
								...latest.files,
								...doc.files,
							},
							mediaPath: doc.mediaPath,
							updatedAt: doc.updatedAt,
							createdAt: latest.createdAt || doc.createdAt,
						}
						continue
					}
					throw err
				}
			}
		}

		for (let i = 0; i < mediaFiles.length; i++) {
			const file = mediaFiles[i]
			if (options?.signal?.aborted) {
				result.cancelled = true
				break
			}

			const videoId = extractYouTubeId(file.name) || extractYouTubeId(file.relativePath) || extractYouTubeId(file.path)
			options?.onProgress?.({
				current: i + 1,
				total: mediaFiles.length,
				fileName: file.name,
				relativePath: file.relativePath,
				videoId,
			})
			if (!videoId) {
				result.skippedNoId++
				continue
			}

			if (doc.files?.[videoId]) {
				result.skippedExisting++
				continue
			}

			try {
				let title = inferTitleFromFileName(file.name, videoId)
				let fallbackArtist = ''
				let youtubeUnavailable = false
				let youtubeCheckedAt: string | undefined

				if (ytInstalled) {
					const info = await window.youtube.getVideoInfo(videoId).catch(() => null as any)
					youtubeCheckedAt = new Date().toISOString()
					if (info?.unavailable) {
						youtubeUnavailable = true
					} else {
						if (info?.title) title = info.title
						fallbackArtist = info?.channel || info?.uploader || ''
					}
				}

				const split = splitArtistAndSong(title, fallbackArtist)

				let relThumbs: Record<ThumbnailKey, string> | undefined
				let thumbnailSource: 'youtube' | 'ffmpeg' | undefined
				let thumbsError: any = null

				if (!window.fileSystem?.generateVideoThumbnails) {
					// Older preload; thumbnails may still come from YouTube.
				}

				if (!youtubeUnavailable) {
					try {
						const thumbnails = await window.fileSystem.downloadYouTubeThumbnails(videoId, mediaPath)
						relThumbs = (Object.keys(thumbnails) as ThumbnailKey[]).reduce((acc, k) => {
							acc[k] = toRelativePathIfPossible(mediaPath, thumbnails[k])
							return acc
						}, {} as Record<ThumbnailKey, string>)
						thumbnailSource = 'youtube'
					} catch (e) {
						thumbsError = e
					}
				}

				if (!relThumbs && window.fileSystem?.generateVideoThumbnails) {
					try {
						const thumbnails = await window.fileSystem.generateVideoThumbnails(file.path, mediaPath, videoId)
						relThumbs = (Object.keys(thumbnails) as ThumbnailKey[]).reduce((acc, k) => {
							acc[k] = toRelativePathIfPossible(mediaPath, thumbnails[k])
							return acc
						}, {} as Record<ThumbnailKey, string>)
						thumbnailSource = 'ffmpeg'
						thumbsError = null
					} catch (e) {
						thumbsError = thumbsError || e
					}
				}

				const now = new Date().toISOString()
				doc.files[videoId] = {
					videoId,
					filePath: file.path,
					relativePath: file.relativePath,
					fileName: file.name,
					artist: split.artist,
					songTitle: split.songTitle,
					sourceTitle: split.sourceTitle,
					thumbnails: relThumbs,
					youtubeUnavailable,
					youtubeCheckedAt,
					thumbnailSource,
					createdAt: now,
					updatedAt: now,
				}
				if (thumbsError && youtubeUnavailable) {
					// We still persist the entry so we don't retry YouTube for unavailable videos.
					console.warn('Thumbnail generation failed (video marked unavailable):', file, thumbsError)
				} else if (thumbsError) {
					throw thumbsError
				}
				result.updated++
				await maybeSave()
			} catch (e) {
				console.error('Metadata update failed for file:', file, e)
				result.errors++
			}
		}

		// Ensure the doc exists even if nothing was added, and persist state on cancel.
		if (!doc._rev) {
			await maybeSave()
		} else if (result.cancelled && result.updated > 0) {
			await maybeSave()
		}

		return result
	}
}

const MetadataMediator = new MetadataMediatorClass()
export default MetadataMediator
