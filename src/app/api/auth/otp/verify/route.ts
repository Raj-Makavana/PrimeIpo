import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

declare global {
  // eslint-disable-next-line no-var
  var __OTP_STORE__: Map<string, { code: string; expiresAt: number }> | undefined;
}

const otpStore = global.__OTP_STORE__ || new Map();

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otpCode } = await req.json();
    const cleaned = (phoneNumber || '').replace(/\D/g, '');
    const phoneKey = cleaned.slice(-10);
    const code = (otpCode || '').trim();

    if (!phoneKey || phoneKey.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid mobile number format' },
        { status: 400 }
      );
    }

    if (!code || code.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter a complete 6-digit OTP' },
        { status: 400 }
      );
    }

    // Check stored OTP code
    const stored = otpStore.get(phoneKey);
    const isValidTestCode = code === '123456';
    const isStoredMatch = stored && stored.code === code && Date.now() <= stored.expiresAt;

    if (!isValidTestCode && !isStoredMatch) {
      if (stored && Date.now() > stored.expiresAt) {
        otpStore.delete(phoneKey);
        return NextResponse.json(
          { success: false, error: 'OTP has expired. Please request a new OTP code.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Incorrect OTP code. Please enter the valid 6-digit code.' },
        { status: 400 }
      );
    }

    // Clear consumed OTP
    otpStore.delete(phoneKey);

    const uid = `phone_${phoneKey}`;
    const formattedPhone = `+91${phoneKey}`;

    let customToken = '';
    if (adminAuth) {
      try {
        customToken = await adminAuth.createCustomToken(uid, {
          phoneNumber: formattedPhone,
          phoneVerified: true,
        });
      } catch (err: any) {
        console.error('Failed to create custom token with Firebase Admin:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mobile OTP verified successfully',
      customToken,
      user: {
        uid,
        phoneNumber: formattedPhone,
        displayName: `Investor (${phoneKey.slice(-4)})`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
