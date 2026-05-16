import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  // Use dynamic property access so Next.js build doesn't inline this variable
  const keyName = 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY';
  const mapsKey = process.env[keyName] || process.env.GOOGLE_MAPS_API_KEY || '';
  
  return NextResponse.json({ mapsKey });
}

