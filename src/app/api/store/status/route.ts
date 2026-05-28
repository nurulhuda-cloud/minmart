import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await db.storeSetting.findFirst()

    if (!settings) {
      return NextResponse.json({
        isOpen: true,
        operatingHours: '08:00 - 21:00',
        storeName: 'Toko Online',
      })
    }

    return NextResponse.json({
      isOpen: settings.isOpen,
      operatingHours: settings.operatingHours,
      storeName: settings.storeName,
      storeLatitude: settings.storeLatitude,
      storeLongitude: settings.storeLongitude,
    })
  } catch (error) {
    console.error('Get store status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
