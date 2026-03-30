import { pgTable, text, serial, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";

// 1. جدول المستخدمين (بيانات كاملة)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number").notNull().unique(),
  age: integer("age"),
  image: text("image"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. جدول المطاعم (Hilla Connect)
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"),
  image: text("image"),
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
  image: text("image"),
});

// 4. غرف الدردشة الصوتية
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  roomImage: text("room_image"),
  creatorId: integer("creator_id").references(() => users.id),
  isVoiceActive: boolean("is_voice_active").default(true),
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
  content: text("content"),
  type: text("type").default("text"), // (text, audio_call, video_call)
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. جدول الريلز (مقاطع الفيديو القصيرة)
export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),
  videoUrl: text("video_url").notNull(),
  title: text("title"),
  creatorId: integer("creator_id").references(() => users.id),
  filter: text("filter").default("none"), // none, grayscale, warm, cool, vintage
  createdAt: timestamp("created_at").defaultNow(),
});

// 8. جدول الإعجابات (Likes)
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  reelId: integer("reel_id").references(() => reels.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 9. جدول التعليقات (Comments)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  reelId: integer("reel_id").references(() => reels.id),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
