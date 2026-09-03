/**
 * PrimeIPO Email Dispatch Service
 * Uses Gmail SMTP via Nodemailer — works for any email address (no domain needed)
 */

import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// Create Gmail SMTP transporter using App Password
function createTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword, // 16-char App Password (no spaces)
    },
  });
}

export async function sendEmailAlert({
  to,
  subject,
  html,
}: SendEmailParams): Promise<{ success: boolean; message: string; provider?: string }> {
  if (!to || !to.includes('@')) {
    return { success: false, message: 'Invalid recipient email address' };
  }

  // 1. Try Gmail SMTP first (works for ALL email addresses)
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"PrimeIPO" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[PrimeIPO] Email sent via Gmail SMTP to ${to}`);
      return { success: true, message: `Email sent to ${to}`, provider: 'gmail' };
    } catch (err: any) {
      console.error('[PrimeIPO] Gmail SMTP error:', err.message || err);
    }
  }

  // 2. Fallback: Resend API (only works for account owner if no domain)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
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
        return { success: true, message: `Email sent to ${to}`, provider: 'resend' };
      }
      console.error('[PrimeIPO] Resend API error:', data);
    } catch (err: any) {
      console.error('[PrimeIPO] Resend error:', err.message || err);
    }
  }

  // 3. Dev fallback — log to console
  console.log(`\n================== [PRIMEIPO EMAIL ALERT] ==================`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`============================================================\n`);

  return {
    success: false,
    message: 'No email provider configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local',
    provider: 'none',
  };
}
