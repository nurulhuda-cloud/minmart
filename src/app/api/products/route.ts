import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const where: Record<string, unknown> = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const orderBy: Record<string, string> = {}
    switch (sort) {
      case 'price_asc':
        orderBy.sellPrice = 'asc'
        break
      case 'price_desc':
        orderBy.sellPrice = 'desc'
        break
      case 'promo':
        where.discountPrice = { not: null }
        orderBy.createdAt = 'desc'
        break
      default:
        orderBy.createdAt = 'desc'
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { category: true },
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      items: products.map((p) => ({
        ...p,
        images: JSON.parse(p.images),
        category: p.category
          ? {
              ...p.category,
              createdAt: p.category.createdAt.toISOString(),
              updatedAt: p.category.updatedAt.toISOString(),
            }
          : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
