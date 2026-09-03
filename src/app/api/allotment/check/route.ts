import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { allotmentResults } from '@/db/schema';
import { hashPan, maskPan } from '@/lib/encryption';
import { eq, and } from 'drizzle-orm';
import { getRegistrarPortalInfo, getAllotmentLifecycle } from '@/lib/registrars';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ipoId,
      pan,
      panHash: passedHash,
      registrar = 'Bigshare Services',
      companyName = 'IPO',
      allotmentDate = '',
    } = body;

    let targetHash = passedHash;
    let displayPan = 'PAN';

    if (pan) {
      targetHash = hashPan(pan);
      displayPan = maskPan(pan);
    }

    if (!targetHash) {
      return NextResponse.json({ success: false, error: 'Missing PAN information' }, { status: 400 });
    }

    const registrarInfo = getRegistrarPortalInfo(registrar);
    const lifecycle = getAllotmentLifecycle(allotmentDate);

    // 1. Check if allotment is actually declared
    if (allotmentDate && !lifecycle.isDeclared) {
      return NextResponse.json({
        success: false,
        isDeclared: false,
        companyName,
        registrar: registrarInfo.name,
        portalUrl: registrarInfo.portalUrl,
        allotmentDate,
        error: `Allotment for ${companyName} has not been declared yet. Expected declaration on ${allotmentDate}.`,
        message: `Allotment will be declared by official registrar (${registrarInfo.name}) on ${allotmentDate}.`,
      });
    }

    // 2. Check if allotment is older than 15 days (delisted)
    if (lifecycle.isDelisted) {
      return NextResponse.json({
        success: false,
        isDelisted: true,
        companyName,
        allotmentDate,
        error: `Allotment for ${companyName} was declared over 15 days ago (${allotmentDate}) and has been archived. You can still check historical allotment on ${registrarInfo.name}'s official portal.`,
        portalUrl: registrarInfo.portalUrl,
      });
    }

    // 3. Check local database cache for verified records
    const cached = await db
      .select()
      .from(allotmentResults)
      .where(and(eq(allotmentResults.ipoId, ipoId), eq(allotmentResults.panHash, targetHash)));

    if (cached.length > 0) {
      const res = cached[0];
      return NextResponse.json({
        success: true,
        source: 'verified_cache',
        isDeclared: true,
        data: {
          ipoId,
          panMasked: displayPan,
          status: res.status,
          shares: res.shares,
          category: res.category,
          checkedAt: res.checkedAt,
        },
        registrarInfo,
        disclaimer: 'Verified allotment record matched with official registrar declaration.',
      });
    }

    // 4. Return official 100% accurate Registrar Portal Link & Verification Guidance
    // (No fake/simulated results: Indian registrars enforce captchas, so official portal verification is required)
    return NextResponse.json({
      success: true,
      source: 'official_portal_direct',
      isDeclared: true,
      requiresCaptcha: true,
      redirectUrl: registrarInfo.portalUrl,
      backupUrl: registrarInfo.server2Url,
      bseUrl: registrarInfo.bseUrl,
      companyName,
      registrar: registrarInfo.name,
      panMasked: displayPan,
      rawPan: pan || '',
      daysRemaining: lifecycle.daysRemaining,
      instructions: registrarInfo.instructions,
      message: `Allotment for ${companyName} is declared by ${registrarInfo.name}. Click below to verify 100% accurately on the official registrar portal.`,
      disclaimer: 'Official Registrar Verification: Solves registrar captcha to guarantee 100% authentic allotment details.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
