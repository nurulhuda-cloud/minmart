import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Total sales (delivered orders total)
    const completedOrders = await db.order.findMany({
      where: { status: { in: ['delivered', 'completed'] } },
    })
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)

    // Total orders
    const totalOrders = await db.order.count()
    const pendingOrders = await db.order.count({ where: { status: 'pending' } })

    // Total products
    const totalProducts = await db.product.count({ where: { isActive: true } })

    // Total products sold
    const completedOrderIds = completedOrders.map((o) => o.id)
    const orderItems = await db.orderItem.findMany({
      where: { orderId: { in: completedOrderIds } },
    })
    const totalProductsSold = orderItems.reduce((sum, oi) => sum + oi.quantity, 0)

    // Low stock products (stock <= minStock and active)
    const allActiveProducts = await db.product.findMany({
      where: { isActive: true },
    })
    const lowStockList = allActiveProducts.filter((p) => p.stock <= p.minStock)
    const lowStockProducts = lowStockList.length

    // Recent orders (last 10)
    const recentOrdersRaw = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { orderItems: true },
    })
    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerAddress: o.customerAddress,
      deliveryMethod: o.deliveryMethod,
      shippingCost: o.shippingCost,
      shippingDistance: o.shippingDistance,
      subtotal: o.subtotal,
      totalDiscount: o.totalDiscount,
      total: o.total,
      status: o.status,
      notes: o.notes,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      orderItems: o.orderItems.map((oi) => ({
        id: oi.id,
        orderId: oi.orderId,
        productId: oi.productId,
        name: oi.name,
        price: oi.price,
        quantity: oi.quantity,
        discount: oi.discount,
        subtotal: oi.subtotal,
      })),
    }))

    // Revenue chart - last 7 days
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentCompletedOrders = completedOrders.filter(
      (o) => new Date(o.createdAt) >= sevenDaysAgo
    )

    // Build chart data for last 7 days
    const revenueChart = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(day.getDate() - i)
      day.setHours(0, 0, 0, 0)
      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)

      const dayOrders = recentCompletedOrders.filter((o) => {
        const orderDate = new Date(o.createdAt)
        return orderDate >= day && orderDate < nextDay
      })

      revenueChart.push({
        date: day.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      })
    }

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      totalProducts,
      totalProductsSold,
      lowStockProducts,
      recentOrders,
      revenueChart,
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
