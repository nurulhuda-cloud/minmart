import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    })

    return NextResponse.json(
      products.map((p) => ({
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
      }))
    )
  } catch (error) {
    console.error('Get products error:', error)
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
    const {
      name,
      description,
      categoryId,
      sku,
      basePrice,
      sellPrice,
      discountPrice,
      discountPercent,
      stock,
      minStock,
      images,
      isActive,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    let slug = generateSlug(name)

    // Ensure unique slug
    const existing = await db.product.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        sku,
        basePrice: basePrice ?? 0,
        sellPrice: sellPrice ?? 0,
        discountPrice,
        discountPercent,
        stock: stock ?? 0,
        minStock: minStock ?? 5,
        images: JSON.stringify(images ?? []),
        isActive: isActive ?? true,
      },
      include: { category: true },
    })

    return NextResponse.json(
      {
        ...product,
        images: JSON.parse(product.images),
        category: product.category
          ? {
              ...product.category,
              createdAt: product.category.createdAt.toISOString(),
              updatedAt: product.category.updatedAt.toISOString(),
            }
          : null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create product error:', error)
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
    const { id, images, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { ...data }
    if (images !== undefined) {
      updateData.images = JSON.stringify(images)
    }

    if (data.name) {
      updateData.slug = generateSlug(data.name)
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })

    return NextResponse.json({
      ...product,
      images: JSON.parse(product.images),
      category: product.category
        ? {
            ...product.category,
            createdAt: product.category.createdAt.toISOString(),
            updatedAt: product.category.updatedAt.toISOString(),
          }
        : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Update product error:', error)
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
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
