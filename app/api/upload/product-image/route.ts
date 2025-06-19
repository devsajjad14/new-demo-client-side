import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const styleId = formData.get('styleId') as string
    const isAlternate = formData.get('isAlternate') === 'true'
    const isVariant = formData.get('isVariant') === 'true'
    const variantId = formData.get('variantId') as string
    const color = formData.get('color') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/\.[^/.]+$/, '')
    const baseFilename = `${styleId}_${timestamp}_${originalName}`

    // Define paths
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products')
    
    // Create upload directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.error('Error creating upload directory:', error)
    }

    const mainImagePath = join(uploadDir, `${baseFilename}.jpg`)
    const mediumImagePath = join(uploadDir, `${baseFilename}_m.jpg`)
    const smallImagePath = join(uploadDir, `${baseFilename}_s.jpg`)

    // Process and save images
    await Promise.all([
      // Main image (1200px)
      sharp(buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 90 })
        .toFile(mainImagePath),

      // Medium image (600px)
      sharp(buffer)
        .resize(600, 600, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(mediumImagePath),

      // Small image (300px)
      sharp(buffer)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(smallImagePath)
    ])

    // Generate URLs
    const baseUrl = '/uploads/products'
    const mainImage = `${baseUrl}/${baseFilename}.jpg`
    const mediumImage = `${baseUrl}/${baseFilename}_m.jpg`
    const smallImage = `${baseUrl}/${baseFilename}_s.jpg`

    // Return appropriate response based on upload type
    if (isVariant) {
      return NextResponse.json({
        mainImage,
        mediumImage,
        smallImage,
        variantId,
        color
      })
    } else if (isAlternate) {
      return NextResponse.json({
        mainImage,
        mediumImage,
        smallImage
      })
    } else {
      return NextResponse.json({
        mainImage,
        mediumImage,
        smallImage
      })
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
} 