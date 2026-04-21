import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// التحقق من وجود رابط قاعدة البيانات
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Please ensure it is set in your Environment Variables (Secrets).",
  );
}

/**
 * إعداد حوض الاتصال (Pool) — مُحسّن لاستقرار الاتصال
 * - keepAlive: يمنع انقطاع الاتصال
 * - connectionTimeoutMillis: مهلة 15 ثانية لإنشاء الاتصال
 * - idleTimeoutMillis: إعادة استخدام الاتصالات لمدة 30 ثانية
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  keepAlive: true,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
});

// التقاط أخطاء الـ Pool لمنع توقف العملية
pool.on("error", (err) => {
  console.error("[db] pool error (will be retried on next query)", err);
});

/**
 * إعادة محاولة الاستعلامات عند فشل DNS المؤقت (EAI_AGAIN/ENOTFOUND/ECONNRESET)
 * يُعيد المحاولة حتى 3 مرات مع تأخير تصاعدي.
 */
const TRANSIENT_CODES = new Set([
  "EAI_AGAIN",
  "ENOTFOUND",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
]);

const originalQuery = pool.query.bind(pool) as typeof pool.query;
// @ts-expect-error - منع pg من التحقق المبالغ في تواقيع overloads
pool.query = async (...args: unknown[]) => {
  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // @ts-expect-error - تمرير الوسائط كما هي
      return await originalQuery(...args);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      lastErr = err;
      if (!code || !TRANSIENT_CODES.has(code) || attempt === maxAttempts) {
        throw err;
      }
      const backoffMs = 250 * 2 ** (attempt - 1); // 250ms, 500ms
      console.warn(
        `[db] transient error ${code} on attempt ${attempt}/${maxAttempts}, retrying in ${backoffMs}ms`,
      );
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
};

/**
 * فتح "الماسورة" وربطها بالـ Schema
 */
export const db = drizzle(pool, { schema });

// تصدير كل الجداول من ملف الـ schema لسهولة الوصول إليها في السيرفر
export * from "./schema";
