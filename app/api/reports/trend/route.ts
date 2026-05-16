import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore';
import * as admin from 'firebase-admin';

export const revalidate = 300; // 5 minutes

export async function GET() {
  const db = getDb();

  if (!db) {
    // Return deterministic dummy trend data for development
    const months = [];
    const now = new Date();
    const dummyCounts = [2, 4, 3, 7, 5, 9];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString('id-ID', { month: 'short', year: '2-digit' }),
        count: dummyCounts[5 - i],
      });
    }
    return NextResponse.json({ trend: months });
  }

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const snapshot = await db.collection('reports')
      .where('reportedAt', '>=', admin.firestore.Timestamp.fromDate(sixMonthsAgo))
      .orderBy('reportedAt', 'asc')
      .get();

    // Group by month
    const monthMap: Record<string, number> = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date: Date = data.reportedAt?.toDate?.() ?? new Date();
      const key = date.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
      monthMap[key] = (monthMap[key] || 0) + 1;
    });

    // Build last 6 months in order
    const trend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
      trend.push({ month: key, count: monthMap[key] || 0 });
    }

    return NextResponse.json({ trend });
  } catch (e: any) {
    console.error('[Trend API] Error:', e);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? e.message : 'Gagal memuat data tren.' },
      { status: 500 }
    );
  }
}
