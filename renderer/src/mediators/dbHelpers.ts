import Database from '@/database'
import { PartiesDoc } from '@/types'

interface FetchOptions {
	createIfMissing?: boolean
}

export async function fetchPartiesDoc(options?: FetchOptions): Promise<PartiesDoc> {
	await Database.ensureDiskDatabase()
	try {
		return (await Database.getDoc('parties')) as PartiesDoc
	} catch (err: any) {
		if (err?.status === 404) {
			if (options?.createIfMissing) {
				const newDoc: PartiesDoc = {
					_id: 'parties',
					parties: [],
				}
				await Database.putDoc(newDoc)
				return newDoc
			}
			throw new Error('No parties found')
		}
		throw err
	}
}
