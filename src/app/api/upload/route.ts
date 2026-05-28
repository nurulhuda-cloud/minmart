import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get file extension
    const originalName = file.name
    const ext = path.extname(originalName) || '.jpg'

    // Generate unique filename
    const filename = `${uuidv4()}${ext}`
    const uploadDir = '/home/z/my-project/public/uploads'
    const filePath = path.join(uploadDir, filename)

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Write file
    fs.writeFileSync(filePath, buffer)

    // Return the URL path
    const url = `/uploads/${filename}`

    return NextResponse.json({ url, filename }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
