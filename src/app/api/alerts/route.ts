import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userAlerts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'guest_user';

    const records = await db.select().from(userAlerts).where(eq(userAlerts.userId, userId));

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          email: '',
          emailAlerts: true,
          pushAlerts: true,
          gmpSurgeAlerts: true,
          allotmentAlerts: true,
          newIpoAlerts: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: records[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'guest_user',
      email = '',
      emailAlerts = true,
      pushAlerts = true,
      gmpSurgeAlerts = true,
      allotmentAlerts = true,
      newIpoAlerts = true,
    } = body;

    const existing = await db.select().from(userAlerts).where(eq(userAlerts.userId, userId));

    if (existing.length > 0) {
      const [updated] = await db
        .update(userAlerts)
        .set({
          email,
          emailAlerts,
          pushAlerts,
          gmpSurgeAlerts,
          allotmentAlerts,
          newIpoAlerts,
          updatedAt: new Date(),
        })
        .where(eq(userAlerts.userId, userId))
        .returning();

      return NextResponse.json({ success: true, data: updated });
    } else {
      const [inserted] = await db
        .insert(userAlerts)
        .values({
          userId,
          email,
          emailAlerts,
          pushAlerts,
          gmpSurgeAlerts,
          allotmentAlerts,
          newIpoAlerts,
        })
        .returning();

      return NextResponse.json({ success: true, data: inserted });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
