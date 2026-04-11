import { pgTable, text, serial, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";

// 0. جدول رموز OTP لإعادة تعيين كلمة المرور
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otpCode: text("otp_code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 0b. رموز إعادة التعيين المؤقتة (بعد التحقق من OTP)
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 1. جدول المستخدمين (بيانات كاملة)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number").notNull().unique(),
  age: integer("age"),
  image: text("image"),
  bio: text("bio"),
  accountType: text("account_type").default("public"), // public | private
  pushToken: text("push_token"),
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

// 5. الدردشات الخاصة
export const privateChats = pgTable("private_chats", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id),
  user2Id: integer("user2_id").references(() => users.id),
  lastActivity: timestamp("last_activity").defaultNow(),
});

// 6. رسائل الدردشة الخاصة - مع دعم الوسائط الكاملة
export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => privateChats.id),
  senderId: integer("sender_id").references(() => users.id),
  content: text("content"),
  mediaUrl: text("media_url"),
  type: text("type").default("text"), // text | image | video | audio | audio_call | video_call
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

// 8. جدول الإعجابات على الريلز
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  reelId: integer("reel_id").references(() => reels.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 9. جدول التعليقات على الريلز
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  reelId: integer("reel_id").references(() => reels.id),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 10. جدول المنشورات (Posts)
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => users.id),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type").default("none"), // none | image | video
  createdAt: timestamp("created_at").defaultNow(),
});

// 11. إعجابات المنشورات
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 12. تعليقات المنشورات
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 13. جدول القصص (Stories) - تختفي بعد 24 ساعة
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => users.id),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").default("image"), // image | video
  caption: text("caption"),
  filter: text("filter").default("none"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 14. مشاهدات القصص
export const storyViews = pgTable("story_views", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").references(() => stories.id),
  viewerId: integer("viewer_id").references(() => users.id),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// 15. جدول المتابعة (Follows)
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => users.id),
  followingId: integer("following_id").references(() => users.id),
  status: text("status").default("accepted"), // accepted | pending
  createdAt: timestamp("created_at").defaultNow(),
});

// 16. جدول الإشعارات (Notifications)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id").references(() => users.id),
  senderId: integer("sender_id").references(() => users.id),
  type: text("type").notNull(), // follow_request | follow_accept | like | comment | post | story | message
  referenceId: text("reference_id"),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
