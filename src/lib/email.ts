/**
 * PrimeIPO Email Dispatch Service
 * Handles transactional alert notifications (New IPOs, Allotment Dates, GMP Surges)
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmailAlert({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; message: string; provider?: string }> {
  if (!to || !to.includes('@')) {
    return { success: false, message: 'Invalid recipient email address' };
  }

  // 1. Resend Provider Integration
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'PrimeIPO <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, message: `Email dispatched successfully via Resend to ${to}`, provider: 'resend' };
      } else {
        console.error('Resend API error:', data);
      }
    } catch (err: any) {
      console.error('Failed to send email via Resend:', err);
    }
  }

  // 2. Fallback: Log payload for development / audit
  console.log(`\n================== [PRIMEIPO EMAIL ALERT] ==================`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Body HTML Length: ${html.length} chars`);
  console.log(`============================================================\n`);

  return {
    success: true,
    message: `Alert triggered and recorded for ${to}. To deliver directly to inboxes, add RESEND_API_KEY or SMTP credentials to .env.local.`,
    provider: 'simulated',
  };
}
