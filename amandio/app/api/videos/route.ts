import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    const videosDir = join(process.cwd(), "public", "videos")
    
    let files: string[] = []
    try {
      files = await readdir(videosDir)
    } catch {
      // Directory might not exist or be empty
      files = []
    }
    
    const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv"]
    const videos = []
    
    for (const file of files) {
      const ext = file.toLowerCase().slice(file.lastIndexOf("."))
      if (videoExtensions.includes(ext)) {
        try {
          const filePath = join(videosDir, file)
          const stats = await stat(filePath)
          videos.push({
            name: file,
            path: `/videos/${file}`,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          })
        } catch {
          // Skip files that can't be read
        }
      }
    }
    
    return NextResponse.json({
      videos,
      count: videos.length,
      directory: "/public/videos",
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list videos", details: String(error) },
      { status: 500 }
    )
  }
}
