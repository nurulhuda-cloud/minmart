import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    let settings = await db.storeSetting.findFirst()

    if (!settings) {
      settings = await db.storeSetting.create({ data: {} })
    }

    return NextResponse.json({
      ...settings,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Get settings error:', error)
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

    let settings = await db.storeSetting.findFirst()

    if (!settings) {
      settings = await db.storeSetting.create({ data: body })
    } else {
      settings = await db.storeSetting.update({
        where: { id: settings.id },
        data: body,
      })
    }

    return NextResponse.json({
      ...settings,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
