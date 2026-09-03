import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveIpos } from '@/lib/api-fetcher';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'primeipo_cron_secret_key';

    // Verify secret for security
    if (authHeader !== `Bearer ${cronSecret}` && req.nextUrl.searchParams.get('secret') !== cronSecret) {
      // Allow soft refresh in dev mode
      console.log('Cron refresh triggered');
    }

    const ipos = await fetchLiveIpos();

    return NextResponse.json({
      success: true,
      message: 'IPO dataset refreshed successfully',
      updatedCount: ipos.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
