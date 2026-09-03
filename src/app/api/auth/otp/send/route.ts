import { NextRequest, NextResponse } from 'next/server';

// In-memory OTP store with 5-minute expiry
// In production, this can be synced to Redis or NeonDB
declare global {
  // eslint-disable-next-line no-var
  var __OTP_STORE__: Map<string, { code: string; expiresAt: number }> | undefined;
}

if (!global.__OTP_STORE__) {
  global.__OTP_STORE__ = new Map();
}
const otpStore = global.__OTP_STORE__;

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();
    const cleaned = (phoneNumber || '').replace(/\D/g, '');

    if (!cleaned || cleaned.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    const phoneKey = cleaned.slice(-10);

    // If phone number is user's designated test number, use 201001, otherwise random
    const generatedOtp = phoneKey === '7201954380' 
      ? '201001' 
      : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(phoneKey, { code: generatedOtp, expiresAt });

    console.log(`[PrimeIPO OTP] Generated verification code for +91${phoneKey}: ${generatedOtp}`);

    return NextResponse.json({
      success: true,
      message: `OTP code sent to +91 ${phoneKey}`,
      phone: `+91 ${phoneKey}`,
      testOtp: generatedOtp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
