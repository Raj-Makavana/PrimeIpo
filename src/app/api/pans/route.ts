import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPans } from '@/db/schema';
import { encryptPan, hashPan, maskPan, decryptPan } from '@/lib/encryption';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'guest_user';

    const records = await db.select().from(userPans).where(eq(userPans.userId, userId));

    const maskedRecords = records.map((record) => {
      let rawPan = '';
      try {
        rawPan = decryptPan(record.panEncrypted);
      } catch (e) {
        rawPan = 'ABCDE1234F';
      }
      return {
        id: record.id,
        label: record.label,
        maskedPan: maskPan(rawPan),
        panHash: record.panHash,
        createdAt: record.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: maskedRecords });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'guest_user', pan, label = 'Self' } = body;

    if (!pan || pan.trim().length !== 10) {
      return NextResponse.json({ success: false, error: 'Invalid PAN format. Must be 10 characters e.g. ABCDE1234F' }, { status: 400 });
    }

    const cleanPan = pan.trim().toUpperCase();
    const panEncrypted = encryptPan(cleanPan);
    const panHash = hashPan(cleanPan);

    // Check if PAN already saved
    const existing = await db
      .select()
      .from(userPans)
      .where(and(eq(userPans.userId, userId), eq(userPans.panHash, panHash)));

    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: 'This PAN number is already saved' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(userPans)
      .values({
        userId,
        panEncrypted,
        panHash,
        label,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: inserted.id,
        label: inserted.label,
        maskedPan: maskPan(cleanPan),
        panHash: inserted.panHash,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing PAN record ID' }, { status: 400 });
    }

    await db.delete(userPans).where(eq(userPans.id, id));
    return NextResponse.json({ success: true, message: 'PAN removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
