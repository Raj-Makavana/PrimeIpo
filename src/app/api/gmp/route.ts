import { NextResponse } from 'next/server';

export interface GmpEntry {
  name: string;
  gmp: number;
  gmpPct: number;
  kostak: number;
  subjectToSauda: number;
  estimatedListingPrice: number;
  fireRating: string; // e.g. "🔥🔥🔥"
}

/**
 * Fetches live GMP data from InvestorGain.com — the authoritative source
 * referenced by Chittorgarh's Grey Market Premium page.
 *
 * Cache revalidates every 15 minutes (900 seconds).
 */
export async function GET() {
  try {
    const html = await fetchWithRetry('https://www.investorgain.com/report/live-ipo-gmp/331/ipo/');
    const entries = parseGmpTable(html);

    return NextResponse.json(
      { success: true, count: entries.length, data: entries, source: 'investorgain.com (Chittorgarh)' },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
  } catch (err: any) {
    console.error('[GMP API] Fetch failed:', err.message);
    return NextResponse.json(
      { success: false, error: err.message, data: [] },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 900 },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          Referer: 'https://www.chittorgarh.com/',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Parses the GMP HTML table from InvestorGain.
 * The table columns are: Company | Type | Price | GMP | Est Price | %Gain | Kostak | Subject | FireRating | Date
 */
function parseGmpTable(html: string): GmpEntry[] {
  const entries: GmpEntry[] = [];

  // Extract the main data table rows
  const tableMatch = html.match(/<table[^>]*class="[^"]*table[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    // Try alternative: extract from JSON embedded in page if table not found
    return parseFromEmbeddedJson(html);
  }

  const tableHtml = tableMatch[1];
  // Match each <tr> row
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  let isFirstRow = true;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    if (isFirstRow) { isFirstRow = false; continue; } // skip header row

    const rowHtml = rowMatch[1];
    const cells = extractCells(rowHtml);
    if (cells.length < 6) continue;

    const name = stripHtml(cells[0]).trim();
    if (!name || name.toLowerCase().includes('company')) continue;

    // Column indices based on InvestorGain table structure:
    // 0: Company Name, 1: Type, 2: Issue Price, 3: GMP (₹), 4: Est Price, 5: %Gain, 6: Kostak, 7: Sauda, 8: Fire
    const issuePrice = parseNumber(stripHtml(cells[2] || '0'));
    const gmp = parseNumber(stripHtml(cells[3] || '0'));
    const estimatedListingPrice = parseNumber(stripHtml(cells[4] || '0')) || (issuePrice + gmp);
    const gmpPct = parseNumber(stripHtml(cells[5] || '0'));
    const kostak = parseNumber(stripHtml(cells[6] || '0'));
    const subjectToSauda = parseNumber(stripHtml(cells[7] || '0'));
    const fireRating = stripHtml(cells[8] || '');

    if (name && !isNaN(gmp)) {
      entries.push({
        name: cleanCompanyName(name),
        gmp,
        gmpPct,
        kostak,
        subjectToSauda,
        estimatedListingPrice,
        fireRating: fireRating.replace(/[^🔥⭐💀📉📈]/g, '').slice(0, 5),
      });
    }
  }

  return entries;
}

function parseFromEmbeddedJson(html: string): GmpEntry[] {
  // Fallback: try to extract from window.__NEXT_DATA__ or similar embedded JSON
  try {
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      const json = JSON.parse(nextDataMatch[1]);
      const props = json?.props?.pageProps;
      const list = props?.ipoList || props?.gmpList || props?.data || [];
      return list.map((item: any) => ({
        name: cleanCompanyName(item.name || item.companyName || ''),
        gmp: Number(item.gmp || 0),
        gmpPct: Number(item.gmpPercent || item.gmpPct || 0),
        kostak: Number(item.kostak || 0),
        subjectToSauda: Number(item.subject || item.subjectToSauda || 0),
        estimatedListingPrice: Number(item.estimatedPrice || item.listingPrice || 0),
        fireRating: item.fire || item.fireRating || '',
      })).filter((e: GmpEntry) => e.name);
    }
  } catch {
    // silent fallback
  }
  return [];
}

function extractCells(rowHtml: string): string[] {
  const cells: string[] = [];
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let match;
  while ((match = cellRegex.exec(rowHtml)) !== null) {
    cells.push(match[1]);
  }
  return cells;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').trim();
}

function parseNumber(str: string): number {
  const cleaned = str.replace(/[₹,%+\s]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function cleanCompanyName(name: string): string {
  return name
    .replace(/\s+IPO$/i, '')
    .replace(/\s+Limited$/i, ' Ltd')
    .replace(/\s+Ltd\.$/i, ' Ltd')
    .trim();
}
