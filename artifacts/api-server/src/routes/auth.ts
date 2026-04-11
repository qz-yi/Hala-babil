import { Router } from "express";
import crypto from "node:crypto";
import { db, otps, passwordResetTokens } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { sendOtpEmail } from "../lib/email.js";
import { logger } from "../lib/logger.js";

const router = Router();

function generateOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// POST /api/auth/send-otp
// body: { email: string }
router.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "البريد الإلكتروني غير صالح" });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    await db.delete(otps).where(eq(otps.email, normalizedEmail));

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.insert(otps).values({
      email: normalizedEmail,
      otpCode,
      expiresAt,
      used: false,
    });

    await sendOtpEmail(email, otpCode);

    logger.info({ email: normalizedEmail }, "OTP sent");
    return res.json({ success: true, message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني" });
  } catch (err) {
    logger.error({ err, email: normalizedEmail }, "Failed to send OTP");
    return res.status(500).json({ error: "فشل إرسال رمز التحقق. حاول مرة أخرى." });
  }
});

// POST /api/auth/verify-otp
// body: { email: string, otpCode: string }
// Returns: { success: true, resetToken: string }
router.post("/auth/verify-otp", async (req, res) => {
  const { email, otpCode } = req.body as { email?: string; otpCode?: string };

  if (!email || !otpCode) {
    return res.status(400).json({ error: "البريد الإلكتروني والرمز مطلوبان" });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    const now = new Date();

    const [record] = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.email, normalizedEmail),
          eq(otps.otpCode, otpCode.trim()),
          eq(otps.used, false),
          gt(otps.expiresAt, now),
        ),
      )
      .limit(1);

    if (!record) {
      return res.status(400).json({ error: "الرمز غير صحيح أو انتهت صلاحيته" });
    }

    await db.update(otps).set({ used: true }).where(eq(otps.id, record.id));

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, normalizedEmail));

    const token = generateResetToken();
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      email: normalizedEmail,
      token,
      expiresAt: tokenExpiresAt,
      used: false,
    });

    logger.info({ email: normalizedEmail }, "OTP verified — reset token issued");
    return res.json({ success: true, resetToken: token });
  } catch (err) {
    logger.error({ err, email: normalizedEmail }, "OTP verification failed");
    return res.status(500).json({ error: "حدث خطأ أثناء التحقق. حاول مرة أخرى." });
  }
});

// POST /api/auth/validate-reset-token
// body: { resetToken: string }
// Returns: { valid: true, email: string }
router.post("/auth/validate-reset-token", async (req, res) => {
  const { resetToken } = req.body as { resetToken?: string };

  if (!resetToken) {
    return res.status(400).json({ error: "رمز إعادة التعيين مطلوب" });
  }

  try {
    const now = new Date();

    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, resetToken),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!record) {
      return res.status(400).json({ error: "رمز إعادة التعيين غير صالح أو منتهي الصلاحية" });
    }

    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, record.id));

    logger.info({ email: record.email }, "Reset token validated");
    return res.json({ valid: true, email: record.email });
  } catch (err) {
    logger.error({ err }, "Reset token validation failed");
    return res.status(500).json({ error: "حدث خطأ. حاول مرة أخرى." });
  }
});

export default router;
