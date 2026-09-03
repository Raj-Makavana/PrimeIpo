import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, name, phone, phoneVerified = false, image } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.id, id));

    if (existing.length > 0) {
      const [updated] = await db
        .update(users)
        .set({
          email: email || existing[0].email,
          name: name || existing[0].name,
          phone: phone || existing[0].phone,
          phoneVerified: phoneVerified ?? existing[0].phoneVerified,
          image: image || existing[0].image,
        })
        .where(eq(users.id, id))
        .returning();

      return NextResponse.json({ success: true, data: updated });
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          id,
          email: email || null,
          name: name || null,
          phone: phone || null,
          phoneVerified: !!phoneVerified,
          image: image || null,
        })
        .returning();

      return NextResponse.json({ success: true, data: inserted });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
