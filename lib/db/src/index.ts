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
 * إعداد حوض الاتصال (Pool)
 * تم إضافة ssl: true لضمان استقرار الاتصال مع قواعد البيانات السحابية
 */
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // يسمح بالاتصال الآمن حتى لو كانت الشهادة ذاتية التوقيع
  }
});

/**
 * فتح "الماسورة" وربطها بالـ Schema
 * الآن أصبح المتغير db قادراً على رؤية جداول (users, rooms, restaurants) وكل ما أضفته
 */
export const db = drizzle(pool, { schema });

// تصدير كل الجداول من ملف الـ schema لسهولة الوصول إليها في السيرفر
export * from "./schema";
