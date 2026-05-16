import { NextResponse } from 'next/server';
import { getTotalReportCount } from '@/lib/firestore';

export const revalidate = 60;

export async function GET() {
  const count = await getTotalReportCount();
  return NextResponse.json({ count });
}
