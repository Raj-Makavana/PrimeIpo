import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, name, phone, phoneVerified = false, image } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL || '');

    // ── Account Identity Merging ──────────────────────────────────────────────
    // If a user with this email already exists (e.g., created via Email OTP)
    // but with a DIFFERENT id (e.g., email_xxx vs Google's Firebase uid),
    // we UPDATE that existing record to use the new Firebase uid so that
    // all PAN data and history carries over to the Google-signed-in user.
    // ─────────────────────────────────────────────────────────────────────────

    if (email) {
      const byEmail = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${id} LIMIT 1
      `;
      if (byEmail.length > 0) {
        const oldId = byEmail[0].id;
        // Migrate: update all references from old custom id to new Firebase uid
        try {
          await sql`UPDATE user_pans SET user_id = ${id} WHERE user_id = ${oldId}`;
          await sql`UPDATE user_alerts SET user_id = ${id} WHERE user_id = ${oldId}`;
          await sql`UPDATE allotment_results SET pan_hash = pan_hash WHERE 1=0`; // no-op, allotment uses pan_hash
          // Now update or delete the old user row
          await sql`DELETE FROM users WHERE id = ${oldId}`;
          console.log(`[PrimeIPO] Merged user ${oldId} → ${id} (same email: ${email})`);
        } catch (mergeErr) {
          console.warn('[PrimeIPO] Merge warning:', mergeErr);
        }
      }
    }

    // Upsert this user record
    const rows = await sql`
      INSERT INTO users (id, email, name, phone, phone_verified, image)
      VALUES (${id}, ${email || null}, ${name || null}, ${phone || null}, ${!!phoneVerified}, ${image || null})
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, users.email),
        name = COALESCE(EXCLUDED.name, users.name),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        phone_verified = EXCLUDED.phone_verified OR users.phone_verified,
        image = COALESCE(EXCLUDED.image, users.image)
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: rows[0] || null });
  } catch (error: any) {
    console.error('[PrimeIPO] Sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
