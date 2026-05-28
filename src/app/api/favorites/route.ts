import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const favorites = await db.favorite.findMany({
      where: { sessionId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      favorites.map((f) => ({
        ...f,
        product: {
          ...f.product,
          images: JSON.parse(f.product.images),
          category: f.product.category
            ? {
                ...f.product.category,
                createdAt: f.product.category.createdAt.toISOString(),
                updatedAt: f.product.category.updatedAt.toISOString(),
              }
            : null,
          createdAt: f.product.createdAt.toISOString(),
          updatedAt: f.product.updatedAt.toISOString(),
        },
        createdAt: f.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get favorites error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, sessionId } = body

    if (!productId || !sessionId) {
      return NextResponse.json(
        { error: 'Product ID and session ID are required' },
        { status: 400 }
      )
    }

    // Check if already favorited
    const existing = await db.favorite.findUnique({
      where: {
        productId_sessionId: { productId, sessionId },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Product already in favorites' },
        { status: 409 }
      )
    }

    const favorite = await db.favorite.create({
      data: { productId, sessionId },
    })

    return NextResponse.json(
      {
        ...favorite,
        createdAt: favorite.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const productId = searchParams.get('productId')
    const sessionId = searchParams.get('sessionId')

    if (!productId || !sessionId) {
      return NextResponse.json(
        { error: 'Product ID and session ID are required' },
        { status: 400 }
      )
    }

    await db.favorite.deleteMany({
      where: { productId, sessionId },
    })

    return NextResponse.json({ message: 'Removed from favorites' })
  } catch (error) {
    console.error('Delete favorite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
