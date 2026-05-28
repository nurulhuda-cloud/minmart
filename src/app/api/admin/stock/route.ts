import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const productId = searchParams.get('productId') || ''

    const where: Record<string, unknown> = {}
    if (productId) {
      where.productId = productId
    }

    const movements = await db.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, sku: true } } },
    })

    return NextResponse.json(
      movements.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get stock movements error:', error)
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
    const { productId, type, quantity, note } = body

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        { error: 'Product ID, type, and quantity are required' },
        { status: 400 }
      )
    }

    if (!['in', 'out', 'adjustment'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be in, out, or adjustment' },
        { status: 400 }
      )
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Create stock movement
    const movement = await db.stockMovement.create({
      data: { productId, type, quantity, note },
      include: { product: { select: { id: true, name: true, sku: true } } },
    })

    // Update product stock
    let newStock = product.stock
    switch (type) {
      case 'in':
        newStock += quantity
        break
      case 'out':
        newStock -= quantity
        break
      case 'adjustment':
        newStock = quantity
        break
    }

    await db.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, newStock) },
    })

    return NextResponse.json(
      {
        ...movement,
        createdAt: movement.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create stock movement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
