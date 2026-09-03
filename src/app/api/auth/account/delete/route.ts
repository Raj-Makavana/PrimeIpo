import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { normalizeEmail } from '@/lib/email-otp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const email = body.email ? normalizeEmail(body.email) : '';

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'User identifier is required to delete account.' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL || '');

    // 1. Delete associated PANs
    if (userId) {
      await sql`DELETE FROM user_pans WHERE user_id = ${userId}`;
      await sql`DELETE FROM user_alerts WHERE user_id = ${userId}`;
    }

    // 2. Delete active OTP requests
    if (email) {
      await sql`DELETE FROM email_otps WHERE email = ${email}`;
    }

    // 3. Delete user record
    if (userId && email) {
      await sql`DELETE FROM users WHERE id = ${userId} OR email = ${email}`;
    } else if (userId) {
      await sql`DELETE FROM users WHERE id = ${userId}`;
    } else if (email) {
      await sql`DELETE FROM users WHERE email = ${email}`;
    }

    console.log(`[PrimeIPO] Account deleted: userId=${userId}, email=${email}`);

    return NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error: any) {
    console.error('[PrimeIPO] Account deletion error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete account.' },
      { status: 500 }
    );
  }
}
