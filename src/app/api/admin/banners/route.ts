import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const banners = await db.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(
      banners.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get banners error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, title, subtitle, link, sortOrder, active } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const banner = await db.banner.create({
      data: { imageUrl, title, subtitle, link, sortOrder: sortOrder ?? 0, active: active ?? true },
    })

    return NextResponse.json(
      {
        ...banner,
        createdAt: banner.createdAt.toISOString(),
        updatedAt: banner.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create banner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    const banner = await db.banner.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ...banner,
      createdAt: banner.createdAt.toISOString(),
      updatedAt: banner.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Update banner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    await db.banner.delete({ where: { id } })

    return NextResponse.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Delete banner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
