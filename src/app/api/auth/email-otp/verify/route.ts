import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { consumeEmailOtp, normalizeEmail } from '@/lib/email-otp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !/^\d{6}$/.test(code) || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Enter the 6-digit code and a password of at least 6 characters.' }, { status: 400 });
    }
    if (!adminAuth) {
      return NextResponse.json({ success: false, error: 'Email reset is not configured on the server.' }, { status: 503 });
    }

    const result = consumeEmailOtp(email, code);
    if (!result.valid) return NextResponse.json({ success: false, error: result.error }, { status: 400 });

    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(user.uid, { password });
    return NextResponse.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to reset password.' }, { status: 500 });
  }
}