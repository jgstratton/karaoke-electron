import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import YtDlpWrap from 'yt-dlp-wrap'

export class YouTubeService {
    private ytDlpWrap: YtDlpWrap | null = null
    private binaryPath: string

    constructor() {
        const fileName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
        this.binaryPath = path.join(app.getPath('userData'), 'bin', fileName)
    }

    async initialize(): Promise<void> {
        const binDir = path.dirname(this.binaryPath)
        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true })
        }

        if (fs.existsSync(this.binaryPath)) {
            console.log('yt-dlp binary found at:', this.binaryPath)
            this.ytDlpWrap = new YtDlpWrap(this.binaryPath)
        } else {
            console.log('yt-dlp binary not found. User needs to install it.')
        }
    }

    async installBinary(): Promise<void> {
        console.log('Downloading yt-dlp binary...')
        try {
            await YtDlpWrap.downloadFromGithub(this.binaryPath)
            console.log('yt-dlp binary downloaded to:', this.binaryPath)

            // Ensure executable permissions on non-Windows
            if (process.platform !== 'win32') {
                fs.chmodSync(this.binaryPath, '755')
            }

            this.ytDlpWrap = new YtDlpWrap(this.binaryPath)
        } catch (error) {
            console.error('Failed to download yt-dlp binary:', error)
            throw error
        }
    }

    isInstalled(): boolean {
        return fs.existsSync(this.binaryPath)
    }

    getBinaryPath(): string {
        return this.binaryPath
    }

    getYtDlpWrap(): YtDlpWrap | null {
        return this.ytDlpWrap
    }
}

export const youTubeService = new YouTubeService()
