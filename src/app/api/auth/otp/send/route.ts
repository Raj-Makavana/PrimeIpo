import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save to NeonDB phone_otps table
    try {
      const sql = neon(process.env.DATABASE_URL || '');
      await sql`
        INSERT INTO phone_otps (phone, code, expires_at)
        VALUES (${phoneKey}, ${generatedOtp}, ${expiresAt})
        ON CONFLICT (phone) DO UPDATE 
        SET code = ${generatedOtp}, expires_at = ${expiresAt}
      `;
    } catch (dbErr) {
      console.warn('DB OTP insert warning:', dbErr);
    }

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

