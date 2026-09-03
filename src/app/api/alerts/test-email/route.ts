import { NextRequest, NextResponse } from 'next/server';
import { sendEmailAlert } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address first.' },
        { status: 400 }
      );
    }

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #818cf8; margin: 0; font-size: 24px;">PrimeIPO Instant Alerts</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Spot IPOs. Stay Ahead.</p>
        </div>
        <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #34d399; font-size: 18px; margin-top: 0;">🎉 Alert Channel Active!</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            This test email confirms that your alert notifications are configured for <strong>${email}</strong>.
          </p>
          <ul style="color: #cbd5e1; font-size: 13px; line-height: 1.8;">
            <li>✓ New IPO Filings (Mainboard & SME)</li>
            <li>✓ Allotment Finalization Reminders</li>
            <li>✓ Grey Market Premium (GMP) Surges (&gt;25%)</li>
            <li>✓ Listing Day Notifications</li>
          </ul>
        </div>
        <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} PrimeIPO India. All rights reserved.
        </p>
      </div>
    `;

    const result = await sendEmailAlert({
      to: email,
      subject: '🚀 Test Alert: PrimeIPO Notifications are Active!',
      html,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      provider: result.provider,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch test alert' },
      { status: 500 }
    );
  }
}
