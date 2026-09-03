import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveIpos } from '@/lib/api-fetcher';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const sector = searchParams.get('sector');
    const search = searchParams.get('search')?.toLowerCase();

    let ipos = await fetchLiveIpos();

    if (status && status !== 'all') {
      ipos = ipos.filter((item) => item.status === status);
    }

    if (type && type !== 'all') {
      ipos = ipos.filter((item) => item.type === type);
    }

    if (sector && sector !== 'all') {
      ipos = ipos.filter((item) => item.sector.toLowerCase() === sector.toLowerCase());
    }

    if (search) {
      ipos = ipos.filter(
        (item) =>
          item.companyName.toLowerCase().includes(search) ||
          item.symbol.toLowerCase().includes(search) ||
          item.sector.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, count: ipos.length, data: ipos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
