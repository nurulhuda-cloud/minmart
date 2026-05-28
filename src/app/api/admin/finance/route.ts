import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const where: Record<string, unknown> = {}
    if (type) {
      where.type = type
    }
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      where.date = dateFilter
    }

    const records = await db.financeRecord.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(
      records.map((r) => ({
        ...r,
        date: r.date.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get finance records error:', error)
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
    const { type, category, amount, description, date } = body

    if (!type || amount === undefined) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
        { status: 400 }
      )
    }

    const record = await db.financeRecord.create({
      data: {
        type,
        category,
        amount,
        description,
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json(
      {
        ...record,
        date: record.date.toISOString(),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create finance record error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
