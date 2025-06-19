import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, userProfiles, adminUsers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// GET all admin users
export async function GET() {
  try {
    const allUsers = await db.select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      image: adminUsers.profileImage,
      profile: {
        phone: adminUsers.phoneNumber,
      },
      role: adminUsers.role,
      status: adminUsers.status,
      address: adminUsers.address,
    })
    .from(adminUsers)
    .where(eq(adminUsers.status, 'active'))

    return NextResponse.json(allUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST new admin user
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const role = formData.get('role') as string
    const status = formData.get('status') as string
    const address = formData.get('address') as string
    const image = formData.get('image') as File | null

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Handle image upload if present
    let imagePath = null
    if (image && image instanceof File) {
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Create unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
      const filename = `${uniqueSuffix}-${image.name}`
      const uploadDir = join(process.cwd(), 'public', 'images', 'site')
      
      // Ensure directory exists
      await writeFile(join(uploadDir, filename), buffer)
      imagePath = `/images/site/${filename}`
    }

    // Create admin user
    const [adminUser] = await db.insert(adminUsers).values({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      status,
      address,
      profileImage: imagePath,
      phoneNumber,
    }).returning()

    // Return the complete user data
    const [completeUser] = await db.select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      image: adminUsers.profileImage,
      profile: {
        phone: adminUsers.phoneNumber,
      },
      role: adminUsers.role,
      status: adminUsers.status,
      address: adminUsers.address,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, adminUser.id))

    return NextResponse.json(completeUser)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PUT update admin user
export async function PUT(request: Request) {
  try {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const role = formData.get('role') as string
    const status = formData.get('status') as string
    const address = formData.get('address') as string
    const image = formData.get('image') as File | null

    // Handle image upload if present
    let imagePath = undefined
    if (image && image instanceof File) {
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Create unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
      const filename = `${uniqueSuffix}-${image.name}`
      const uploadDir = join(process.cwd(), 'public', 'images', 'site')
      
      // Ensure directory exists
      await writeFile(join(uploadDir, filename), buffer)
      imagePath = `/images/site/${filename}`
    }

    // Update admin user
    await db
      .update(adminUsers)
      .set({
        name,
        email,
        role,
        status,
        address,
        ...(imagePath && { profileImage: imagePath }),
        phoneNumber,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, id))

    // Get the complete updated user data
    const [updatedUser] = await db.select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      image: adminUsers.profileImage,
      profile: {
        phone: adminUsers.phoneNumber,
      },
      role: adminUsers.role,
      status: adminUsers.status,
      address: adminUsers.address,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE admin user (soft delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by updating the status to 'deleted' in adminUsers table
    await db
      .update(adminUsers)
      .set({
        status: 'deleted',
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 