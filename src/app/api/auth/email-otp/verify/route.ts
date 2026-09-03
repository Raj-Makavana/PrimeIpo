import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/email-otp';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit verification code.' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL || '');
    let isValid = false;

    // Verify OTP from NeonDB
    try {
      const rows = await sql`
        SELECT code, expires_at FROM email_otps WHERE email = ${email}
      `;
      if (rows.length > 0) {
        const stored = rows[0];
        if (stored.code === code && Date.now() <= Number(stored.expires_at)) {
          isValid = true;
          // Delete consumed OTP
          await sql`DELETE FROM email_otps WHERE email = ${email}`;
        }
      }
    } catch (dbErr) {
      console.warn('[PrimeIPO] DB OTP verify error:', dbErr);
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code. Please request a new one.' },
        { status: 400 }
      );
    }

    // ── Account Identity Merging ──────────────────────────────────────────────
    // Rule: One account per email. If user already exists with this email
    // (created via Google or Username/Password), return THAT user's record.
    // Otherwise create a new one.
    // ─────────────────────────────────────────────────────────────────────────

    let userId: string;
    let displayName: string;
    let userImage: string | null = null;

    try {
      // Check if a user with this email already exists (from Google/password login)
      const existing = await sql`
        SELECT id, name, image FROM users WHERE email = ${email} LIMIT 1
      `;

      if (existing.length > 0) {
        // Reuse existing account — same data, same PAN records, same history
        userId = existing[0].id;
        displayName = existing[0].name || email.split('@')[0];
        userImage = existing[0].image || null;
      } else {
        // New user — create a stable unique ID based on email
        userId = `email_${Buffer.from(email).toString('hex').slice(0, 24)}`;
        displayName = email.split('@')[0];
        // Insert new user record
        await sql`
          INSERT INTO users (id, email, name)
          VALUES (${userId}, ${email}, ${displayName})
          ON CONFLICT (id) DO UPDATE SET email = ${email}
        `;
      }
    } catch (e) {
      console.warn('[PrimeIPO] User upsert notice:', e);
      // Fallback: use email-based ID
      userId = `email_${Buffer.from(email).toString('hex').slice(0, 24)}`;
      displayName = email.split('@')[0];
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        uid: userId,
        email,
        displayName,
        photoURL: userImage,
      },
    });
  } catch (error: any) {
    console.error('[PrimeIPO] Email OTP verify error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}