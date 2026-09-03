import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/email-otp';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 6-digit verification code.' }, { status: 400 });
    }

    let isValid = false;

    // Check NeonDB email_otps
    try {
      const sql = neon(process.env.DATABASE_URL || '');
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
      console.warn('DB email OTP verify check error:', dbErr);
    }

    // Also support default test code for development
    if (code === '123456') {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid or expired verification code. Please request a new one.' }, { status: 400 });
    }

    const uid = `email_${Buffer.from(email).toString('hex').slice(0, 16)}`;

    // Upsert into NeonDB users table
    try {
      const sql = neon(process.env.DATABASE_URL || '');
      await sql`
        INSERT INTO users (id, email, name)
        VALUES (${uid}, ${email}, ${email.split('@')[0]})
        ON CONFLICT (id) DO UPDATE SET email = ${email}
      `;
    } catch (e) {
      console.warn('User upsert notice:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        uid,
        email,
        displayName: email.split('@')[0],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Verification failed.' }, { status: 500 });
  }
}