import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { sendEmailAlert } from '@/lib/email';
import { createEmailOtp, normalizeEmail } from '@/lib/email-otp';

export async function POST(req: NextRequest) {
  try {
    const email = normalizeEmail((await req.json()).email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
    }

    if (!adminAuth) {
      return NextResponse.json({ success: false, error: 'Email reset is not configured on the server.' }, { status: 503 });
    }

    try {
      await adminAuth.getUserByEmail(email);
    } catch {
      return NextResponse.json({ success: false, error: 'No account was found for that email address.' }, { status: 404 });
    }

    const code = createEmailOtp(email);
    const result = await sendEmailAlert({
      to: email,
      subject: 'Your PrimeIPO password reset code',
      html: `<div style="font-family:Arial,sans-serif;padding:24px;color:#172033"><h2>Password reset</h2><p>Use this one-time code to reset your PrimeIPO password:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes and can be used once.</p></div>`,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Unable to send the reset email.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'A reset code was sent to your email.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to send reset code.' }, { status: 500 });
  }
}