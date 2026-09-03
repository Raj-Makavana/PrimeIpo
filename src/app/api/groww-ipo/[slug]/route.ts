import { NextRequest, NextResponse } from 'next/server';

export interface GrowwIpoInsights {
  pros: string[];
  cons: string[];
  recommendation: string;
  source: 'groww.in';
  slug: string;
}

/**
 * Fetches Pros & Cons for an IPO from Groww's official website.
 *
 * Strategy:
 * 1. Try to parse the embedded __NEXT_DATA__ JSON from the Groww IPO page
 * 2. Fall back to regex-based HTML parsing of the pros/cons section
 *
 * Cache: 5 minutes (300s) — Groww updates these occasionally during IPO period
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Slug required' }, { status: 400 });
  }

  try {
    const growwUrl = `https://groww.in/ipo/${encodeURIComponent(slug)}`;
    const html = await fetchGrowwPage(growwUrl);

    const insights = parseGrowwInsights(html, slug);

    return NextResponse.json(
      { success: true, data: insights },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err: any) {
    console.error(`[GrowwIPO] Failed to fetch ${slug}:`, err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 502 }
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Fetch helper
// ──────────────────────────────────────────────────────────────

async function fetchGrowwPage(url: string): Promise<string> {
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-IN,en;q=0.9',
      'Cache-Control': 'no-cache',
      Referer: 'https://groww.in/ipo',
    },
  });

  if (!res.ok) {
    throw new Error(`Groww returned HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

// ──────────────────────────────────────────────────────────────
// Parser
// ──────────────────────────────────────────────────────────────

function parseGrowwInsights(html: string, slug: string): GrowwInsights {
  // Strategy 1: Parse __NEXT_DATA__ embedded JSON (most reliable)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const json = JSON.parse(nextDataMatch[1]);
      const pageProps =
        json?.props?.pageProps ||
        json?.props?.initialProps?.pageProps ||
        {};

      // Groww stores IPO details under various keys
      const ipoDetail =
        pageProps?.ipoDetail ||
        pageProps?.ipoData ||
        pageProps?.ipoInfo ||
        pageProps?.data ||
        pageProps?.ipo ||
        {};

      // Look for pros/cons at various nesting levels
      const pros = extractStringArray(
        ipoDetail?.pros ||
        ipoDetail?.strengths ||
        ipoDetail?.ipoStrengths ||
        ipoDetail?.positives ||
        pageProps?.pros ||
        []
      );

      const cons = extractStringArray(
        ipoDetail?.cons ||
        ipoDetail?.risks ||
        ipoDetail?.ipoRisks ||
        ipoDetail?.weaknesses ||
        ipoDetail?.concerns ||
        pageProps?.cons ||
        []
      );

      const recommendation =
        ipoDetail?.recommendation ||
        ipoDetail?.investmentDecision ||
        ipoDetail?.verdict ||
        pageProps?.recommendation ||
        '';

      if (pros.length > 0 || cons.length > 0) {
        return { pros, cons, recommendation, source: 'groww.in', slug };
      }
    } catch {
      // fall through to HTML parsing
    }
  }

  // Strategy 2: HTML regex parsing of pros/cons sections
  return parseGrowwHtml(html, slug);
}

function parseGrowwHtml(html: string, slug: string): GrowwIpoInsights {
  const pros: string[] = [];
  const cons: string[] = [];

  // Groww renders pros/cons in sections with specific class patterns
  // Pattern: <div class="...ipp_pros...">...</div> or similar

  // Look for a pros section
  const prosSectionMatch = html.match(
    /(?:pros|strengths|positives)[^<]{0,200}<ul[^>]*>([\s\S]*?)<\/ul>/i
  );
  if (prosSectionMatch) {
    const listItems = extractListItems(prosSectionMatch[1]);
    pros.push(...listItems);
  }

  // Look for a cons section
  const consSectionMatch = html.match(
    /(?:cons|risks|weaknesses|concerns)[^<]{0,200}<ul[^>]*>([\s\S]*?)<\/ul>/i
  );
  if (consSectionMatch) {
    const listItems = extractListItems(consSectionMatch[1]);
    cons.push(...listItems);
  }

  // Broader fallback: search all list items near "pros" keyword
  if (pros.length === 0) {
    const prosBlockMatch = html.match(
      /(?:Pros|Key Strengths|Strengths)[^<]{0,500}?(<li[^>]*>[\s\S]{20,500}?<\/li>(?:\s*<li[^>]*>[\s\S]{20,500}?<\/li>)*)/i
    );
    if (prosBlockMatch) {
      pros.push(...extractListItems(prosBlockMatch[1]));
    }
  }

  if (cons.length === 0) {
    const consBlockMatch = html.match(
      /(?:Cons|Key Risks|Risks)[^<]{0,500}?(<li[^>]*>[\s\S]{20,500}?<\/li>(?:\s*<li[^>]*>[\s\S]{20,500}?<\/li>)*)/i
    );
    if (consBlockMatch) {
      cons.push(...extractListItems(consBlockMatch[1]));
    }
  }

  const recommendation = extractRecommendation(html);

  return { pros, cons, recommendation, source: 'groww.in', slug };
}

// ──────────────────────────────────────────────────────────────
// Utility helpers
// ──────────────────────────────────────────────────────────────

function extractStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object' && item !== null) {
          return (
            (item as any).text ||
            (item as any).description ||
            (item as any).point ||
            (item as any).content ||
            ''
          ).toString().trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function extractListItems(html: string): string[] {
  const items: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liRegex.exec(html)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text.length > 15 && text.length < 500) {
      items.push(text);
    }
  }
  return items.slice(0, 8); // cap at 8 items
}

function extractRecommendation(html: string): string {
  const match = html.match(
    /(?:recommendation|verdict|subscribe)[^\w]{0,50}([\w\s,]+(?:subscribe|avoid|neutral|consider)[^<]{0,100})/i
  );
  return match ? stripHtml(match[1]).trim().slice(0, 120) : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Re-export the type with correct name (alias)
type GrowwInsights = GrowwIpoInsights;
