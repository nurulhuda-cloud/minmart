import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerAddress,
      deliveryMethod,
      shippingCost,
      shippingDistance,
      items,
      notes,
    } = body

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name, phone, and items are required' },
        { status: 400 }
      )
    }

    const orderNumber = `INV-${Date.now()}`

    // Calculate subtotal and discount
    let subtotal = 0
    let totalDiscount = 0

    const orderItemsData = []

    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId } })
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 400 }
        )
      }

      const price = product.sellPrice
      const quantity = item.quantity || 1
      const discount = product.discountPrice
        ? (product.sellPrice - product.discountPrice) * quantity
        : 0
      const itemSubtotal = price * quantity - discount

      subtotal += price * quantity
      totalDiscount += discount

      orderItemsData.push({
        productId: item.productId,
        name: product.name,
        price,
        quantity,
        discount,
        subtotal: itemSubtotal,
      })
    }

    const shipping = shippingCost ?? 0
    const total = subtotal - totalDiscount + shipping

    // Create order with order items
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerAddress,
        deliveryMethod: deliveryMethod ?? 'pickup',
        shippingCost: shipping,
        shippingDistance: shippingDistance ?? null,
        subtotal,
        totalDiscount,
        total,
        notes,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: { orderItems: true },
    })

    // Reduce product stock
    for (const item of items) {
      const quantity = item.quantity || 1
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: quantity } },
      })
    }

    return NextResponse.json(
      {
        ...order,
        orderItems: order.orderItems.map((oi) => ({
          ...oi,
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
