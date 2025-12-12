import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as ffbinaries from 'ffbinaries'

export class FfmpegService {
    private binaryPath: string

    constructor() {
        const fileName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
        this.binaryPath = path.join(app.getPath('userData'), 'bin', fileName)
    }

    async initialize(): Promise<void> {
        const binDir = path.dirname(this.binaryPath)
        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true })
        }

        if (fs.existsSync(this.binaryPath)) {
            console.log('ffmpeg binary found at:', this.binaryPath)
        } else {
            console.log('ffmpeg binary not found. User needs to install it.')
        }
    }

    async installBinary(): Promise<void> {
        console.log('Downloading ffmpeg binary...')
        const binDir = path.dirname(this.binaryPath)

        return new Promise((resolve, reject) => {
            ffbinaries.downloadBinaries(['ffmpeg'], { destination: binDir }, (err, data) => {
                if (err) {
                    console.error('Failed to download ffmpeg:', err)
                    reject(err)
                } else {
                    console.log('ffmpeg downloaded successfully')
                    resolve()
                }
            })
        })
    }

    isInstalled(): boolean {
        return fs.existsSync(this.binaryPath)
    }

    getBinaryPath(): string {
        return this.binaryPath
    }
}

export const ffmpegService = new FfmpegService()
