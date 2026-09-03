import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import { normalizeEmail } from '@/lib/email-otp';
import { sendEmailAlert } from '@/lib/email';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(hash, keyBuffer);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, password, confirmPassword, code } = body;
    const email = normalizeEmail(body.email);
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL || '');

    // ── 1. REGISTRATION WITH CONFIRM PASSWORD ─────────────────────────────────
    if (action === 'register') {
      if (!name || name.length < 2) {
        return NextResponse.json(
          { success: false, error: 'Please enter your full name (at least 2 characters).' },
          { status: 400 }
        );
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'Passwords do not match. Please re-enter both passwords.' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existing = await sql`
        SELECT id, email, password_hash FROM users WHERE email = ${email} LIMIT 1
      `;

      if (existing.length > 0) {
        if (existing[0].password_hash) {
          return NextResponse.json(
            { success: false, error: 'An account with this email already exists. Please sign in.' },
            { status: 409 }
          );
        }

        // Account was created via OTP/Google earlier; link password & update name
        const passwordHash = hashPassword(password);
        await sql`
          UPDATE users 
          SET password_hash = ${passwordHash}, name = ${name}
          WHERE id = ${existing[0].id}
        `;

        return NextResponse.json({
          success: true,
          message: 'Account linked and password set successfully!',
          user: {
            uid: existing[0].id,
            email,
            displayName: name,
          },
        });
      }

      // Create new user
      const userId = `user_${Buffer.from(email).toString('hex').slice(0, 20)}`;
      const passwordHash = hashPassword(password);

      await sql`
        INSERT INTO users (id, email, name, password_hash)
        VALUES (${userId}, ${email}, ${name}, ${passwordHash})
      `;

      return NextResponse.json({
        success: true,
        message: 'Account created successfully!',
        user: {
          uid: userId,
          email,
          displayName: name,
        },
      });
    }

    // ── 2. LOGIN FLOW ────────────────────────────────────────────────────────
    if (action === 'login') {
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Please enter your password.' },
          { status: 400 }
        );
      }

      const existing = await sql`
        SELECT id, email, name, password_hash, image FROM users WHERE email = ${email} LIMIT 1
      `;

      if (existing.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No account found with this email. Please check your email or Create an Account.' 
          },
          { status: 401 }
        );
      }

      if (!existing[0].password_hash) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'This account was created with Google or Email OTP. You can sign in using those methods, or use "Forgot Password?" to set a password.' 
          },
          { status: 401 }
        );
      }

      const isValid = verifyPassword(password, existing[0].password_hash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Incorrect email or password.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Signed in successfully!',
        user: {
          uid: existing[0].id,
          email: existing[0].email,
          displayName: existing[0].name || email.split('@')[0],
          photoURL: existing[0].image || null,
        },
      });
    }

    // ── 3. FORGOT PASSWORD: SEND OTP ─────────────────────────────────────────
    if (action === 'forgot-send-otp') {
      const existing = await sql`
        SELECT id, email, name FROM users WHERE email = ${email} LIMIT 1
      `;

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No account found with this email address.' },
          { status: 404 }
        );
      }

      // Generate 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      await sql`
        INSERT INTO email_otps (email, code, expires_at)
        VALUES (${email}, ${resetCode}, ${expiresAt})
        ON CONFLICT (email) DO UPDATE 
        SET code = ${resetCode}, expires_at = ${expiresAt}
      `;

      // Send branded password reset email via Gmail SMTP
      const sendResult = await sendEmailAlert({
        to: email,
        subject: `PrimeIPO Password Reset Code: ${resetCode}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0f19;color:#ffffff;border-radius:24px;border:1px solid #1e293b;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Prime<span style="color:#818cf8;">IPO</span></h1>
              <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">Password Reset Request</p>
            </div>
            <div style="background:#111827;border-radius:16px;padding:24px;text-align:center;border:1px solid #1f2937;">
              <p style="margin:0 0 12px 0;font-size:14px;color:#cbd5e1;">Your password reset verification code is:</p>
              <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#f59e0b;padding:12px 0;font-family:monospace;">
                ${resetCode}
              </div>
              <p style="margin:12px 0 0 0;font-size:12px;color:#64748b;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
            </div>
            <p style="margin:24px 0 0 0;font-size:11px;color:#475569;text-align:center;">
              PrimeIPO Security Team
            </p>
          </div>
        `,
      });

      if (!sendResult.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              sendResult.message ||
              'Unable to send password reset code. Please ensure GMAIL_USER and GMAIL_APP_PASSWORD are set in your environment variables.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Password reset code sent to ${email}.`,
      });
    }

    // ── 4. FORGOT PASSWORD: VERIFY OTP & RESET ───────────────────────────────
    if (action === 'reset-password') {
      const trimmedCode = typeof code === 'string' ? code.trim() : '';
      if (!/^\d{6}$/.test(trimmedCode)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid 6-digit reset code.' },
          { status: 400 }
        );
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'Passwords do not match. Please re-enter both passwords.' },
          { status: 400 }
        );
      }

      // Check OTP in NeonDB
      const otpRows = await sql`
        SELECT code, expires_at FROM email_otps WHERE email = ${email}
      `;

      if (otpRows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No active reset request found. Please request a new code.' },
          { status: 400 }
        );
      }

      const storedOtp = otpRows[0];
      if (storedOtp.code !== trimmedCode || Date.now() > Number(storedOtp.expires_at)) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired reset code. Please request a new code.' },
          { status: 400 }
        );
      }

      // OTP verified! Delete consumed OTP
      await sql`DELETE FROM email_otps WHERE email = ${email}`;

      // Update password hash in users table
      const newHash = hashPassword(password);
      await sql`
        UPDATE users 
        SET password_hash = ${newHash}
        WHERE email = ${email}
      `;

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now sign in with your new password.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified.' }, { status: 400 });
  } catch (error: any) {
    console.error('[PrimeIPO] Password auth error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication error.' },
      { status: 500 }
    );
  }
}
