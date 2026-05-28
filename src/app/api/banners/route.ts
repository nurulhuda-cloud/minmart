import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const banners = await db.banner.findMany({
      where: { active: true },
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
