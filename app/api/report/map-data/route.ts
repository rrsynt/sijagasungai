import { NextResponse } from 'next/server';
import { getReportsGeoJSON } from '@/lib/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid days parameter' }, { status: 400 });
    }

    const geoData = await getReportsGeoJSON();

    return NextResponse.json({ success: true, data: geoData }, { status: 200 });
  } catch (error: any) {
    console.error('[Map Data API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch map data', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
