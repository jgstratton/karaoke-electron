import PouchDB from 'pouchdb-browser'
import type { DatabaseInfo, DatabaseAllDocsRow } from '../../electron/preload-types'

const FALLBACK_DB_NAME = 'karaoke-db'
const SETTINGS_DOC_ID = 'settings'

const fallbackDb = new PouchDB(FALLBACK_DB_NAME)
let diskMediaPath: string | null = null
let configurePromise: Promise<void> | null = null

function makeNotFoundError(docId: string): any {
	const err: any = new Error('not_found: missing')
	err.status = 404
	err.error = true
	err.reason = 'missing'
	err.docId = docId
	return err
}

async function diskGetDocOrThrow(docId: string): Promise<any> {
	const doc = await window.database.getDoc(docId)
	if (doc == null) {
		throw makeNotFoundError(docId)
	}
	return doc
}

function hasDatabaseApi(): boolean {
	return !!window.database
}

async function readSettingsDoc(): Promise<{ mediaPath?: string } | null> {
	try {
		const doc = await fallbackDb.get(SETTINGS_DOC_ID)
		return doc as { mediaPath?: string }
	} catch (error: any) {
		if (error?.status === 404) {
			return null
		}
		throw error
	}
}

async function configureDiskDatabase(mediaPath: string): Promise<void> {
	if (!hasDatabaseApi()) {
		return
	}

	const normalized = (mediaPath || '').trim()
	if (!normalized) {
		throw new Error('Media folder is required before initializing the database')
	}

	if (diskMediaPath === normalized) {
		if (configurePromise) {
			await configurePromise
		}
		return
	}

	configurePromise = (async () => {
		await window.database.configureMediaPath(normalized)
		diskMediaPath = normalized
	})().finally(() => {
		configurePromise = null
	})

	await configurePromise
}

interface EnsureOptions {
	mediaPath?: string
	requireConfigured?: boolean
}

async function ensureDiskDatabase(options?: EnsureOptions): Promise<boolean> {
	if (!hasDatabaseApi()) {
		return false
	}

	let targetPath = options?.mediaPath?.trim() || null
	if (!targetPath) {
		const settings = await readSettingsDoc()
		targetPath = settings?.mediaPath?.trim() || null
	}

	if (!targetPath) {
		if (options?.requireConfigured) {
			throw new Error('Media folder is not configured. Go to Tools → Settings first.')
		}
		return false
	}

	await configureDiskDatabase(targetPath)
	return true
}

async function getSettingsDoc(): Promise<{ mediaPath?: string } | null> {
	return readSettingsDoc()
}

async function getDoc(docId: string): Promise<any> {
	if (await ensureDiskDatabase()) {
		return diskGetDocOrThrow(docId)
	}
	return fallbackDb.get(docId)
}

async function putDoc(doc: any): Promise<any> {
	if (await ensureDiskDatabase()) {
		return window.database.putDoc(doc)
	}
	return fallbackDb.put(doc)
}

async function removeDoc(docId: string, rev: string): Promise<void> {
	if (await ensureDiskDatabase()) {
		await window.database.removeDoc(docId, rev)
		return
	}
	await fallbackDb.remove(docId, rev)
}

async function allDocs(options?: { include_docs?: boolean }): Promise<{ rows: DatabaseAllDocsRow[] }> {
	if (await ensureDiskDatabase()) {
		return window.database.allDocs(options)
	}
	return fallbackDb.allDocs(options)
}

async function info(): Promise<DatabaseInfo> {
	if (await ensureDiskDatabase()) {
		return window.database.info()
	}
	return fallbackDb.info()
}

const DatabaseClient = {
	ensureDiskDatabase,
	getSettingsDoc,
	getDoc,
	putDoc,
	removeDoc,
	allDocs,
	info,
}

export default DatabaseClient
