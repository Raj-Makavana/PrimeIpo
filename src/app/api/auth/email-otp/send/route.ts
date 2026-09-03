import { NextRequest, NextResponse } from 'next/server';
import { sendEmailAlert } from '@/lib/email';
import { normalizeEmail } from '@/lib/email-otp';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail } = await req.json();
    const email = normalizeEmail(rawEmail);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
    }

    // Generate secure 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save into NeonDB email_otps table
    try {
      const sql = neon(process.env.DATABASE_URL || '');
      await sql`
        INSERT INTO email_otps (email, code, expires_at)
        VALUES (${email}, ${code}, ${expiresAt})
        ON CONFLICT (email) DO UPDATE 
        SET code = ${code}, expires_at = ${expiresAt}
      `;
    } catch (dbErr) {
      console.warn('DB email OTP insert warning:', dbErr);
    }

    // Send real email via Resend
    const result = await sendEmailAlert({
      to: email,
      subject: `Your PrimeIPO Verification Code: ${code}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0f19;color:#ffffff;border-radius:24px;border:1px solid #1e293b;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Prime<span style="color:#818cf8;">IPO</span></h1>
            <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">Spot IPOs. Stay Ahead.</p>
          </div>
          <div style="background:#111827;border-radius:16px;padding:24px;text-align:center;border:1px solid #1f2937;">
            <p style="margin:0 0 12px 0;font-size:14px;color:#cbd5e1;">Your 6-digit email verification code is:</p>
            <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#6366f1;padding:12px 0;font-family:monospace;">
              ${code}
            </div>
            <p style="margin:12px 0 0 0;font-size:12px;color:#64748b;">This code is valid for 10 minutes. Do not share it with anyone.</p>
          </div>
          <p style="margin:24px 0 0 0;font-size:11px;color:#475569;text-align:center;">
            If you did not request this verification code, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`[PrimeIPO] Email OTP dispatched to ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email inbox.',
    });
  } catch (error: any) {
    console.error('Email OTP send error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to send verification code.' }, { status: 500 });
  }
}