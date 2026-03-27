import { pgTable, text, serial, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";

// 1. جدول المستخدمين (بيانات كاملة)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number").notNull().unique(), // رقم هاتف المستخدم
  age: integer("age"), // عمر المستخدم
  image: text("image"), // صورة الشخصية
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. جدول المطاعم (Hilla Connect)
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"), // رقم هاتف المطعم
  image: text("image"), // صورة المطعم
  address: text("address"),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("5.0"),
  isOpen: boolean("is_open").default(true),
});

// 3. جدول أصناف الطعام (Menu Items)
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  image: text("image"), // صورة صنف الطعام (كباب، قوزي، الخ)
});

// 4. غرف الدردشة الصوتية
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  roomImage: text("room_image"),
  creatorId: integer("creator_id").references(() => users.id),
  isVoiceActive: boolean("is_voice_active").default(true), // لتفعيل ميزة الصوت
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. الدردشات الخاصة (اتصال - فيديو - محادثة)
export const privateChats = pgTable("private_chats", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id),
  user2Id: integer("user2_id").references(() => users.id),
  lastActivity: timestamp("last_activity").defaultNow(),
});

// 6. رسائل الدردشة الخاصة وسجل المكالمات
export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => privateChats.id),
  senderId: integer("sender_id").references(() => users.id),
  content: text("content"), // نص الرسالة
  type: text("type").default("text"), // (text, audio_call, video_call)
  duration: integer("duration"), // مدة الاتصال بالثواني إذا كان مكالمة
  createdAt: timestamp("created_at").defaultNow(),
});
