import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveIpos, syncIposToDatabase } from '@/lib/api-fetcher';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'primeipo_cron_secret_key';

    // Verify secret for scheduled cron invocations
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PrimeIPO Autonomous Engine] Syncing IPO data from verified sources: Chittorgarh (GMP), ipopremium (Subscription), NSE/BSE (Listings)...');

    const liveIpos = await fetchLiveIpos();

    // Persist verified updates to NeonDB
    await syncIposToDatabase(liveIpos);

    return NextResponse.json({
      success: true,
      message: 'Autonomous data sync completed successfully.',
      timestamp: new Date().toISOString(),
      syncedCount: liveIpos.length,
      sources: {
        gmp: 'Chittorgarh.com',
        subscription: 'ipopremium.com',
        filing: 'NSE / BSE Official',
        prosCons: 'Groww Official',
      },
    });
  } catch (error: any) {
    console.error('[PrimeIPO Autonomous Engine] Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Data sync failed' },
      { status: 500 }
    );
  }
}
