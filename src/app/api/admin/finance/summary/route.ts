import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const income = await db.financeRecord.aggregate({
      where: { type: 'income' },
      _sum: { amount: true },
    })
    const expense = await db.financeRecord.aggregate({
      where: { type: 'expense' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      totalIncome: income._sum.amount || 0,
      totalExpense: expense._sum.amount || 0,
      balance: (income._sum.amount || 0) - (expense._sum.amount || 0),
    })
  } catch (error) {
    console.error('Get finance summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
