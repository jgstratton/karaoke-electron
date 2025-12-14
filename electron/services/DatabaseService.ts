import fs from 'node:fs'
import path from 'node:path'
import PouchDB from 'pouchdb'

class DatabaseService {
	private db: PouchDB.Database | null = null
	private currentMediaPath: string | null = null

	private async ensureDirectory(mediaPath: string): Promise<string> {
		const resolvedMediaPath = path.resolve(mediaPath)
		const stats = await fs.promises.stat(resolvedMediaPath).catch(() => null)
		if (!stats || !stats.isDirectory()) {
			throw new Error('Media folder path does not exist or is not a directory')
		}

		const metadataDir = path.join(resolvedMediaPath, '.karaoke-metadata')
		await fs.promises.mkdir(metadataDir, { recursive: true })
		return metadataDir
	}

	private async closeDb(): Promise<void> {
		if (!this.db) {
			return
		}

		try {
			await this.db.close()
		} catch (err) {
			console.warn('Failed to close existing database:', err)
		}
		this.db = null
	}

	public async configureMediaPath(mediaPath: string): Promise<void> {
		const cleaned = (mediaPath || '').trim()
		if (!cleaned) {
			throw new Error('Media path is required before configuring the database')
		}

		const metadataDir = await this.ensureDirectory(cleaned)
		if (this.currentMediaPath === cleaned && this.db) {
			return
		}

		await this.closeDb()
		const dbPath = path.join(metadataDir, 'karaoke-db')
		this.db = new PouchDB(dbPath)
		this.currentMediaPath = cleaned
	}

	private getDb(): PouchDB.Database {
		if (!this.db) {
			throw new Error('Database is not configured. Set the media folder first.')
		}
		return this.db
	}

	public async getDoc(docId: string): Promise<any> {
		return this.getDb().get(docId)
	}

	public async getDocOrNull(docId: string): Promise<any | null> {
		try {
			return await this.getDb().get(docId)
		} catch (err: any) {
			if (err?.status === 404) {
				return null
			}
			throw err
		}
	}

	public async putDoc(doc: any): Promise<PouchDB.Core.Response> {
		return this.getDb().put(doc)
	}

	public async removeDoc(docId: string, rev: string): Promise<PouchDB.Core.Response> {
		return this.getDb().remove(docId, rev)
	}

	public async allDocs(options?: PouchDB.Core.AllDocsOptions): Promise<PouchDB.Core.AllDocsResponse<any>> {
		return this.getDb().allDocs({ include_docs: true, ...options })
	}

	public async info(): Promise<PouchDB.Core.DatabaseInfo> {
		return this.getDb().info()
	}
}

export const databaseService = new DatabaseService()
