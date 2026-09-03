import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveIpos } from '@/lib/api-fetcher';
import { analyzeIpoWithLangGraph } from '@/lib/ai/langgraph-analyzer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ipoId = (searchParams.get('ipoId') || searchParams.get('id') || '').toLowerCase();

    if (!ipoId) {
      return NextResponse.json(
        { success: false, error: 'Please provide an IPO symbol or id (e.g. ?id=perniaspop)' },
        { status: 400 }
      );
    }

    const ipos = await fetchLiveIpos();
    const ipo = ipos.find((item) => item.id === ipoId || item.symbol.toLowerCase() === ipoId);

    if (!ipo) {
      return NextResponse.json({ success: false, error: 'IPO not found' }, { status: 404 });
    }

    const analysis = await analyzeIpoWithLangGraph(ipo);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error('LangGraph IPO analysis API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate AI analysis' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipoId = (body.ipoId || body.id || '').toLowerCase();

    const ipos = await fetchLiveIpos();
    const ipo = ipos.find((item) => item.id === ipoId || item.symbol.toLowerCase() === ipoId);

    if (!ipo) {
      return NextResponse.json({ success: false, error: 'IPO not found' }, { status: 404 });
    }

    const analysis = await analyzeIpoWithLangGraph(ipo);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
