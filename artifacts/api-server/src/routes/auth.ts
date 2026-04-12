import { Router } from "express";
import crypto from "node:crypto";
import { sendOtpEmail } from "../lib/email.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── In-memory OTP store (OTPs expire in 5 min — no persistence needed) ───────
interface OtpRecord {
  otpCode: string;
  expiresAt: number; // Unix ms
  used: boolean;
}
interface ResetTokenRecord {
  email: string;
  expiresAt: number;
  used: boolean;
}

const otpStore = new Map<string, OtpRecord>();       // key: email (lower)
const resetTokenStore = new Map<string, ResetTokenRecord>(); // key: token

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Purge expired entries lazily to keep memory tidy
function purgeExpired() {
  const now = Date.now();
  for (const [k, v] of otpStore) {
    if (v.expiresAt < now) otpStore.delete(k);
  }
  for (const [k, v] of resetTokenStore) {
    if (v.expiresAt < now) resetTokenStore.delete(k);
  }
}

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
// body: { email: string }
router.post("/auth/send-otp", async (req, res) => {
  const rawEmail = (req.body as { email?: string }).email;

  logger.info({ rawEmail }, "[send-otp] received request");

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())) {
    return res.status(400).json({ error: "invalid_email", message: "البريد الإلكتروني غير صالح" });
  }

  const email = rawEmail.trim().toLowerCase();
  logger.info({ email }, "[send-otp] normalized email");

  purgeExpired();

  const otpCode = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(email, { otpCode, expiresAt, used: false });

  logger.info({ email, otpCode }, "[send-otp] OTP generated (dev log — remove in prod)");

  try {
    await sendOtpEmail(email, otpCode);
    logger.info({ email }, "[send-otp] OTP email dispatched");
    return res.json({ success: true, message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني" });
  } catch (err) {
    logger.error({ err, email }, "[send-otp] Failed to send OTP email");
    otpStore.delete(email);
    return res.status(500).json({ error: "send_failed", message: "فشل إرسال رمز التحقق. تحقق من الاتصال وحاول مرة أخرى." });
  }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
// body: { email: string, otpCode: string }
// Returns: { success: true, resetToken: string }
router.post("/auth/verify-otp", async (req, res) => {
  const { email: rawEmail, otpCode } = req.body as { email?: string; otpCode?: string };

  logger.info({ rawEmail, otpCode }, "[verify-otp] received request");

  if (!rawEmail || !otpCode) {
    return res.status(400).json({ error: "missing_fields", message: "البريد الإلكتروني والرمز مطلوبان" });
  }

  const email = rawEmail.trim().toLowerCase();
  const code = otpCode.trim();

  purgeExpired();

  const record = otpStore.get(email);

  logger.info({ email, record: record ? { used: record.used, expired: record.expiresAt < Date.now() } : null }, "[verify-otp] looked up OTP record");

  if (!record) {
    return res.status(400).json({ error: "otp_not_found", message: "لم يُرسَل رمز تحقق لهذا البريد أو انتهت صلاحيته" });
  }
  if (record.used) {
    return res.status(400).json({ error: "otp_used", message: "تم استخدام هذا الرمز بالفعل" });
  }
  if (record.expiresAt < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ error: "otp_expired", message: "انتهت صلاحية الرمز. أعد طلب رمز جديد." });
  }
  if (record.otpCode !== code) {
    return res.status(400).json({ error: "wrong_otp", message: "الرمز غير صحيح" });
  }

  // Mark as used
  otpStore.set(email, { ...record, used: true });

  // Issue a short-lived reset token
  const token = generateResetToken();
  const tokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Clean up any existing tokens for this email
  for (const [k, v] of resetTokenStore) {
    if (v.email === email) resetTokenStore.delete(k);
  }
  resetTokenStore.set(token, { email, expiresAt: tokenExpiresAt, used: false });

  logger.info({ email }, "[verify-otp] OTP verified — reset token issued");
  return res.json({ success: true, resetToken: token });
});

// ─── POST /api/auth/validate-reset-token ─────────────────────────────────────
// body: { resetToken: string }
// Returns: { valid: true, email: string }
router.post("/auth/validate-reset-token", async (req, res) => {
  const { resetToken } = req.body as { resetToken?: string };

  if (!resetToken) {
    return res.status(400).json({ error: "missing_token", message: "رمز إعادة التعيين مطلوب" });
  }

  purgeExpired();

  const record = resetTokenStore.get(resetToken);

  if (!record || record.used || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: "invalid_token", message: "رمز إعادة التعيين غير صالح أو منتهي الصلاحية" });
  }

  resetTokenStore.set(resetToken, { ...record, used: true });

  logger.info({ email: record.email }, "[validate-reset-token] token validated");
  return res.json({ valid: true, email: record.email });
});

export default router;
