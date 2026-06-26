import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeStore } from "@/store/themeStore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { router } from "expo-router";
import { setSharedContent } from "@/lib/sharedContentBridge";
import { useMediaStore } from "@/store/mediaStore";
import {
  authApi,
  usersApi,
  roomsApi,
  messagesApi,
  getToken,
  type ServerUser,
} from "@/services/api";
import { getSocket, registerUserSocket } from "@/hooks/useSocket";

// ─── Helper: ServerUser → local User ─────────────────────────────────────────
// Defined after type exports — forward reference is resolved at runtime.
function serverUserToLocal(su: ServerUser): any {
  return {
    id: su.id,
    name: su.name,
    username: su.username ?? undefined,
    email: su.email,
    avatar: su.image ?? undefined,
    bio: su.bio ?? undefined,
    accountType: su.accountType ?? "public",
    primaryGovernorate: su.primaryGovernorate ?? undefined,
    role: su.role ?? undefined,
    isBanned: su.isBanned,
    isActive: su.isActive,
    createdAt: su.createdAt,
  };
}

export type Language = "ar" | "en";
export type Theme = "light" | "dark";
export type ReelFilter = "none" | "grayscale" | "warm" | "cool" | "vintage";
export type AccountType = "public" | "private";
export type PostFilter = "none" | "grayscale" | "warm" | "cool" | "vintage";
export type UserRole = "MANAGER" | "RESTAURANT_OWNER" | "MERCHANT_OWNER" | "CUSTOMER";

export type PrivacyLevel = "everyone" | "following" | "followers" | "none";

export interface UserPrivacySettings {
  stories: PrivacyLevel;
  profilePhoto: PrivacyLevel;
  groups: PrivacyLevel;
  mentions: PrivacyLevel;
}

export const DEFAULT_PRIVACY: UserPrivacySettings = {
  stories: "everyone",
  profilePhoto: "everyone",
  groups: "everyone",
  mentions: "everyone",
};

export interface User {
  id: string;
  name: string;
  username?: string;
  phone?: string;
  email: string;
  age?: number;
  address?: string;
  primaryGovernorate?: string;
  avatar?: string;
  coverUrl?: string;
  bio?: string;
  accountType: AccountType;
  isBanned?: boolean;
  role?: UserRole;
  isActive?: boolean;
  createdAt: number;
  verifiedUntil?: number;
  strikes?: number;
}

export function isUserVerified(user: User | null | undefined): boolean {
  if (!user || !user.verifiedUntil) return false;
  return Date.now() < user.verifiedUntil;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "video" | "gif" | "system" | "shared";
  mediaUrl?: string;
  timestamp: number;
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  replyToId?: string;
  replyToContent?: string;
  replyToSender?: string;
  sharedContent?: SharedContent;
}

export interface Room {
  id: string;
  roomCode: string;
  name: string;
  image?: string;
  background?: string;
  ownerId: string;
  ownerName: string;
  seats: (string | null)[];
  seatUsers: (User | null)[];
  lockedSeats: boolean[];
  chat: Message[];
  bannedUsers: string[];
  mutedUsers: string[];
  announcement?: string;
  isHidden: boolean;
  createdAt: number;
  presentUserIds?: string[];
}

export interface SharedContent {
  id: string;
  type: "post" | "reel" | "story";
  mediaUrl?: string;
  title?: string;
  creatorName?: string;
}

export interface MessageLocation {
  latitude: number;
  longitude: number;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  type: "text" | "image" | "video" | "audio" | "shared" | "location" | "system";
  duration?: number;
  timestamp: number;
  read: boolean;
  sharedContent?: SharedContent;
  storyRef?: string;
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  deletedFor?: string[];
  replyToId?: string;
  location?: MessageLocation;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantUsers: User[];
  messages?: PrivateMessage[];
  lastMessage?: PrivateMessage;
  updatedAt: number;
  archived?: boolean;
  themeColor?: string;
  wallpaper?: string;
}

export type GroupMemberRole = "owner" | "admin" | "member";

export interface GroupMember {
  userId: string;
  role: GroupMemberRole;
  isMuted?: boolean;
}

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: "text" | "image" | "system";
  mediaUrl?: string;
  timestamp: number;
  deletedForAll?: boolean;
  reactions?: Record<string, string[]>;
  replyToId?: string;
}

export interface GroupChat {
  id: string;
  name: string;
  photo?: string;
  groupId: string;
  privacy: "public" | "private";
  ownerId: string;
  members: GroupMember[];
  bannedMembers: string[];
  messages: GroupMessage[];
  lastMessage?: GroupMessage;
  updatedAt: number;
  createdAt: number;
}

export const IRAQI_GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "النجف", "كربلاء",
  "بابل", "ديالى", "الأنبار", "واسط", "ذي قار", "المثنى",
  "القادسية", "صلاح الدين", "كركوك", "السليمانية", "دهوك", "ميسان",
] as const;

export type IraqiGovernorate = typeof IRAQI_GOVERNORATES[number];

export interface GovernorateImage {
  name: string;
  image?: string;
}


export type CommerceTier = "bronze" | "silver" | "gold";
export type OrderStatus = "pending" | "accepted" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "zaincash" | "fastpay" | "dafaa";

export interface ProductVariation {
  id: string;
  label: string;
  options: string[];
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  stock: number;
  sku?: string;
  category: string;
  variations?: ProductVariation[];
  linkedReelId?: string;
  isActive: boolean;
  createdAt: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  selectedVariations?: Record<string, string>;
}

export interface Order {
  id: string;
  customerId: string;
  merchantId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalIQD: number;
  commissionAmount: number;
  affiliateUserId?: string;
  affiliateCut: number;
  platformCut: number;
  createdAt: number;
  updatedAt: number;
  address?: string;
  notes?: string;
}

export interface Merchant {
  id: string;
  name: string;
  logo?: string;
  coverPhoto?: string;
  bio?: string;
  governorate: string;
  ownerId: string;
  isActive: boolean;
  commissionRate?: number;
  monthlyDues?: number;
  monthlySales: number;
  tier: CommerceTier;
  category?: string;
  createdAt: number;
}

export interface AffiliateRecord {
  productId: string;
  influencerId: string;
  sessionId: string;
  createdAt: number;
}

export interface CommerceCartItem {
  productId: string;
  productName: string;
  productPrice: number;
  merchantId: string;
  quantity: number;
  selectedVariations?: Record<string, string>;
  productImage?: string;
}

export interface CommerceCart {
  merchantId: string;
  merchantName: string;
  items: CommerceCartItem[];
}

export interface Reel {
  id: string;
  videoUrl: string;
  title: string;
  creatorId: string;
  filter: ReelFilter;
  tags?: string[];
  linkedProductIds?: string[];
  createdAt: number;
}

export interface ReelLike {
  reelId: string;
  userId: string;
}

export interface ReelComment {
  id: string;
  reelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likedBy: string[];
  isPinned: boolean;
  createdAt: number;
}

export interface Post {
  id: string;
  creatorId: string;
  content?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaType: "none" | "image" | "video";
  filter?: PostFilter;
  isHidden?: boolean;
  createdAt: number;
}

export interface PostLike {
  postId: string;
  userId: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likedBy: string[];
  isPinned: boolean;
  createdAt: number;
}

export interface StorySharedPost {
  id: string;
  type: "post" | "reel" | "story";
  mediaUrl?: string;
  // Explicit kind of the underlying media so re-shared content (especially
  // video stories or reels) renders with the right component (<VideoView>
  // vs <Image>) instead of guessing from `type` alone.
  mediaType?: "image" | "video";
  caption?: string;
  creatorName?: string;
  creatorId?: string;
  creatorAvatar?: string;
  originalStoryId?: string;
}

export interface Story {
  id: string;
  creatorId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  filter: string;
  viewerIds: string[];
  expiresAt: number;
  createdAt: number;
  isCloseFriends?: boolean;
  mentions?: string[];
  sharedPost?: StorySharedPost;
  // Overlay metadata for unbaked stories (notably videos on native, where
  // we cannot burn text into the video file). Position fields are optional
  // so older stored stories (which only had `{ text }`) keep working.
  overlays?: {
    text: string;
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    highlight?: string;
    align?: "left" | "center" | "right";
  }[];
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  status: "accepted" | "pending";
  createdAt: number;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: "follow_request" | "follow_accept" | "like" | "comment" | "post" | "story" | "message" | "story_like" | "story_reply" | "mention" | "story_mention" | "order_update";
  referenceId?: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}

const SUPER_ADMIN_PHONE = "07719820537";
const SUPER_ADMIN_PASSWORD = "1w2q3r4eSATHA2026$";

interface AppContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  currentUser: User | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  users: User[];
  rooms: Room[];
  conversations: Conversation[];
  reels: Reel[];
  reelLikes: ReelLike[];
  reelComments: ReelComment[];
  posts: Post[];
  postLikes: PostLike[];
  postComments: PostComment[];
  stories: Story[];
  follows: Follow[];
  notifications: AppNotification[];
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    username: string,
    email: string,
    governorate: string,
    password: string
  ) => Promise<{ success: boolean; error?: "email_exists" | "username_exists" }>;
  checkUsername: (username: string) => boolean;
  checkEmail: (email: string) => boolean;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendEmailOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithOTP: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string, bio?: string, avatar?: string, accountType?: AccountType, username?: string) => Promise<{ success: boolean; error?: "username_taken" }>;
  updateCoverPhoto: (coverUrl: string) => Promise<void>;
  createRoom: (name: string, image?: string) => Promise<Room | null>;
  deleteRoom: (roomId: string) => Promise<void>;
  joinRoomSeat: (roomId: string, seatIndex: number) => void;
  leaveRoomSeat: (roomId: string) => void;
  joinRoomPresence: (roomId: string) => void;
  leaveRoomPresence: (roomId: string) => void;
  leaveRoomFull: (roomId: string) => void;
  sendRoomMessage: (roomId: string, content: string, type?: "text" | "image" | "video" | "gif" | "system" | "shared", mediaUrl?: string, replyToId?: string, replyToContent?: string, replyToSender?: string, sharedContent?: SharedContent) => void;
  deleteRoomMessage: (roomId: string, msgId: string) => void;
  pinRoomMessage: (roomId: string, msgId: string) => void;
  editRoomMessage: (roomId: string, msgId: string, newContent: string) => void;
  addRoomReaction: (roomId: string, msgId: string, emoji: string) => void;
  kickFromRoom: (roomId: string, userId: string) => void;
  banFromRoom: (roomId: string, userId: string) => void;
  muteUserInRoom: (roomId: string, userId: string) => void;
  updateRoomBackground: (roomId: string, background: string) => void;
  setRoomAnnouncement: (roomId: string, text: string) => void;
  lockSeat: (roomId: string, seatIndex: number) => void;
  unlockSeat: (roomId: string, seatIndex: number) => void;
  lockSeatsInRoom: (roomId: string, lockedStates: boolean[]) => void;
  shareRoomToDM: (roomId: string, receiverId: string) => void;
  searchRoomByCode: (code: string) => Room | null;
  getConversation: (otherUserId: string) => Conversation;
  sendPrivateMessage: (conversationId: string, receiverId: string, content: string, type?: "text" | "image" | "video" | "audio" | "shared" | "location" | "system", mediaUrl?: string, duration?: number, sharedContent?: SharedContent, storyRef?: string, replyToId?: string, location?: MessageLocation) => void;
  injectCallLog: (conversationId: string, otherUserId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string, forBoth: boolean) => void;
  pinMessage: (conversationId: string, messageId: string) => void;
  addReaction: (conversationId: string, messageId: string, emoji: string) => void;
  blockedUsers: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
  deleteConversation: (conversationId: string) => void;
  markConversationRead: (conversationId: string) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  setConversationTheme: (conversationId: string, themeColor?: string, wallpaper?: string) => void;
  governorateImages: GovernorateImage[];
  setGovernorateImage: (name: string, image: string) => void;
  isManager: boolean;
  createOwnerAccount: (name: string, email: string, governorate: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setOwnerActive: (userId: string, isActive: boolean) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  resetUserPassword: (userId: string, newPassword: string) => void;
  verifyUser: (userId: string, months: number) => void;
  revokeVerification: (userId: string) => void;
  addReel: (videoUrl: string, title: string, filter: ReelFilter, tags?: string[], linkedProductIds?: string[]) => void;
  deleteReel: (reelId: string) => void;
  likeReel: (reelId: string) => void;
  isReelLiked: (reelId: string) => boolean;
  getReelLikesCount: (reelId: string) => number;
  addReelComment: (reelId: string, content: string) => void;
  deleteReelComment: (commentId: string) => void;
  getReelComments: (reelId: string) => ReelComment[];
  likeReelComment: (commentId: string) => void;
  isReelCommentLiked: (commentId: string) => boolean;
  pinReelComment: (commentId: string) => void;
  getReelCommentLikers: (commentId: string) => User[];
  getPostCommentLikers: (commentId: string) => User[];
  shareReelToConversation: (reelId: string, receiverId: string) => void;
  sharePostToDM: (postId: string, receiverId: string) => void;
  shareStoryToDM: (storyId: string, receiverId: string) => void;
  searchUsers: (query: string) => User[];
  // Posts
  addPost: (content?: string, mediaUrl?: string, mediaType?: "none" | "image" | "video", filter?: PostFilter, mediaUrls?: string[]) => void;
  deletePost: (postId: string) => void;
  hidePost: (postId: string) => void;
  likePost: (postId: string) => void;
  isPostLiked: (postId: string) => boolean;
  getPostLikesCount: (postId: string) => number;
  addPostComment: (postId: string, content: string) => void;
  deletePostComment: (commentId: string) => void;
  likePostComment: (commentId: string) => void;
  isPostCommentLiked: (commentId: string) => boolean;
  pinPostComment: (commentId: string) => void;
  getPostComments: (postId: string) => PostComment[];
  // Stories
  addStory: (mediaUrl: string, mediaType: "image" | "video", caption?: string, filter?: string, isCloseFriends?: boolean, mentions?: string[], sharedPost?: StorySharedPost, overlays?: { text: string }[]) => Promise<void>;
  deleteStory: (storyId: string) => void;
  viewStory: (storyId: string) => void;
  likeStory: (storyId: string) => void;
  replyToStory: (storyId: string, storyCreatorId: string, replyText: string) => void;
  getActiveStories: () => Story[];
  getUserStories: (userId: string) => Story[];
  hasUnseenStory: (userId: string) => boolean;
  closeFriendsList: string[];
  updateCloseFriendsList: (ids: string[]) => void;
  shareContentToStory: (type: "post" | "reel", id: string, mediaUrl?: string, caption?: string, creatorName?: string, creatorId?: string, mediaType?: "image" | "video") => void;
  // Follows
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  acceptFollowRequest: (followerId: string) => void;
  rejectFollowRequest: (followerId: string) => void;
  isFollowing: (userId: string) => boolean;
  isFollowedBy: (userId: string) => boolean;
  getFollowStatus: (userId: string) => "none" | "pending" | "following";
  getFollowers: (userId: string) => Follow[];
  getFollowing: (userId: string) => Follow[];
  getFollowersCount: (userId: string) => number;
  getFollowingCount: (userId: string) => number;
  getFollowRequests: () => Follow[];
  getUserPosts: (userId: string) => Post[];
  getUserReels: (userId: string) => Reel[];
  // Notifications
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadNotificationsCount: () => number;
  // Feed
  getFeedPosts: () => Post[];
  getFeedReels: () => Reel[];
  // Activity
  getLikedReels: () => Reel[];
  getMyComments: () => ReelComment[];
  getMyPostComments: () => PostComment[];
  getLikedPosts: () => Post[];
  // Saved Posts
  savedPosts: string[];
  savePost: (postId: string) => void;
  unsavePost: (postId: string) => void;
  isPostSaved: (postId: string) => boolean;
  getSavedPosts: () => Post[];
  t: (key: string) => string;
  isRoomMinimized: boolean;
  minimizedRoomId: string | null;
  minimizedRoomName: string;
  minimizedRoomImage: string | undefined;
  minimizeRoom: (roomId: string, roomName: string, roomImage?: string) => void;
  expandRoom: () => void;
  // Story editor pause sync — viewer pauses while editor is open on top
  isStoryEditorOpen: boolean;
  setStoryEditorOpen: (open: boolean) => void;
  // Persistent position for the floating mini-room widget (survives navigation)
  floatingRoomPos: { x: number; y: number } | null;
  setFloatingRoomPos: (pos: { x: number; y: number }) => void;
  // Group Chats
  groups: GroupChat[];
  createGroup: (name: string, photo: string | undefined, groupId: string, privacy: "public" | "private", memberIds: string[]) => Promise<GroupChat | null>;
  sendGroupMessage: (groupChatId: string, content: string, type?: "text" | "image", mediaUrl?: string, replyToId?: string) => void;
  deleteGroupMessage: (groupChatId: string, msgId: string, forAll: boolean) => void;
  kickGroupMember: (groupChatId: string, userId: string) => void;
  banGroupMember: (groupChatId: string, userId: string) => void;
  muteGroupMember: (groupChatId: string, userId: string) => void;
  unmuteGroupMember: (groupChatId: string, userId: string) => void;
  promoteToAdmin: (groupChatId: string, userId: string) => void;
  demoteAdmin: (groupChatId: string, userId: string) => void;
  leaveGroup: (groupChatId: string) => void;
  editGroup: (groupChatId: string, name: string, photo?: string, privacy?: "public" | "private") => void;
  searchGroupByPublicId: (groupId: string) => GroupChat | null;
  getMyGroups: () => GroupChat[];
  getGroupMemberRole: (groupChatId: string, userId: string) => GroupMemberRole | null;
  isGroupMuted: (groupChatId: string) => boolean;
  joinGroup: (groupChatId: string) => void;
  addGroupReaction: (groupChatId: string, msgId: string, emoji: string) => void;
  // Privacy
  privacySettings: UserPrivacySettings;
  updatePrivacySettings: (settings: Partial<UserPrivacySettings>) => void;
  canViewStory: (viewerId: string, ownerId: string) => boolean;
  canViewProfilePhoto: (viewerId: string, ownerId: string) => boolean;
  canAddToGroup: (userId: string) => boolean;
  canMention: (viewerId: string, ownerId: string) => boolean;
  addStrike: (userId: string) => void;
  merchants: Merchant[];
  products: Product[];
  orders: Order[];
  isMerchantOwner: boolean;
  getMyMerchant: () => Merchant | null;
  addMerchant: (data: Omit<Merchant, "id" | "createdAt" | "tier" | "monthlySales">) => Merchant;
  updateMerchantProfile: (merchantId: string, data: Partial<Merchant>) => void;
  addProduct: (data: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (productId: string, data: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getCommissionTier: (monthlySales: number) => number;
  recordAffiliateLink: (productId: string, influencerId: string) => void;
  getAffiliateForProduct: (productId: string) => AffiliateRecord | null;
  createMerchantAccount: (name: string, email: string, governorate: string, password: string) => Promise<{ success: boolean; error?: string }>;
  getMerchantOrders: (merchantId: string) => Order[];
  cart: CommerceCart | null;
  addToCart: (item: CommerceCartItem, merchantName: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (paymentMethod: PaymentMethod, address?: string, notes?: string) => Promise<Order | null>;
  // Product social actions
  savedProducts: string[];
  productLikes: Record<string, string[]>;
  followedMerchants: string[];
  blockedMerchantIds: string[];
  toggleSaveProduct: (productId: string) => void;
  isProductSaved: (productId: string) => boolean;
  toggleLikeProduct: (productId: string) => void;
  isProductLiked: (productId: string) => boolean;
  getProductLikesCount: (productId: string) => number;
  toggleFollowMerchant: (merchantId: string) => void;
  isMerchantFollowed: (merchantId: string) => boolean;
  blockMerchantStore: (merchantId: string) => void;
  unblockMerchantStore: (merchantId: string) => void;
  isMerchantBlocked: (merchantId: string) => boolean;
  cancelOrder: (orderId: string) => void;
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  getMyOrders: () => Order[];
}

const AppContext = createContext<AppContextValue | null>(null);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    home: "الرئيسية",
    rooms: "الغرف",
    messages: "الرسائل",
    restaurants: "المطاعم",
    profile: "الملف",
    reels: "الريلز",
    createRoom: "إنشاء غرفة",
    roomName: "اسم الغرفة",
    joinSeat: "انضم للمقعد",
    mute: "كتم",
    unmute: "إلغاء الكتم",
    leave: "مغادرة",
    send: "إرسال",
    typeMessage: "اكتب رسالة...",
    voiceCall: "مكالمة صوتية",
    videoCall: "مكالمة مرئية",
    block: "حظر",
    deleteChat: "حذف المحادثة",
    settings: "الإعدادات",
    language: "اللغة",
    darkMode: "الوضع الليلي",
    lightMode: "الوضع النهاري",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    phone: "رقم الهاتف",
    password: "كلمة المرور",
    name: "الاسم",
    age: "العمر",
    address: "العنوان",
    email: "البريد الإلكتروني",
    forgotPassword: "نسيت كلمة المرور؟",
    contactAdmin: "تواصل مع الإدارة",
    welcome: "مرحباً بك",
    hillaConnect: "Zentram",
    appName: "Zentram",
    welcomeToApp: "مرحباً بك في Zentram",
    joinApp: "انضم إلى Zentram",
    myRestaurant: "مطعمي",
    marketplace: "سوق",
    myMerchant: "متجري",
    merchants: "المتاجر",
    orders: "الطلبات",
    noRooms: "لا توجد غرف حتى الآن",
    createFirst: "أنشئ أول غرفة!",
    seat: "مقعد",
    empty: "فارغ",
    owner: "المالك",
    admin: "الإدارة",
    superAdmin: "المدير الأعلى",
    king: "الملك",
    royal: "دخول ملكي",
    deleteRoom: "حذف الغرفة",
    banUser: "حظر المستخدم",
    unbanUser: "رفع الحظر",
    kickUser: "طرد",
    restaurant: "المطعم",
    menu: "القائمة",
    addRestaurant: "إضافة مطعم",
    editRestaurant: "تعديل المطعم",
    deleteRestaurant: "حذف المطعم",
    whatsapp: "واتساب",
    call: "اتصال",
    addItem: "إضافة صنف",
    price: "السعر",
    description: "الوصف",
    category: "الفئة",
    noRestaurants: "لا توجد مطاعم",
    noMessages: "لا توجد رسائل",
    startChat: "ابدأ محادثة",
    online: "متصل",
    offline: "غير متصل",
    adminPanel: "لوحة التحكم",
    allUsers: "جميع المستخدمين",
    banned: "محظور",
    active: "نشط",
    confirmLogout: "هل تريد تسجيل الخروج؟",
    yes: "نعم",
    cancel: "إلغاء",
    save: "حفظ",
    close: "إغلاق",
    error: "خطأ",
    success: "نجح",
    invalidCredentials: "اسم المستخدم أو البريد أو كلمة المرور غير صحيحة",
    phoneExists: "رقم الهاتف مسجل مسبقاً",
    emailExists: "البريد الإلكتروني مسجل مسبقاً",
    fillAll: "يرجى ملء جميع الحقول",
    governorate: "المحافظة",
    selectGovernorate: "اختر محافظتك",
    usernameOrEmail: "اسم المستخدم أو البريد الإلكتروني",
    changePassword: "تغيير كلمة المرور",
    oldPassword: "كلمة المرور الحالية",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    wrongPassword: "كلمة المرور الحالية غير صحيحة",
    passwordChanged: "تم تغيير كلمة المرور بنجاح",
    passwordMismatch: "كلمة المرور الجديدة غير متطابقة",
    sendOTP: "إرسال رمز التحقق",
    otpSent: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
    enterOTP: "أدخل رمز التحقق",
    verifyOTP: "تحقق من الرمز",
    otpInvalid: "رمز التحقق غير صحيح أو منتهي الصلاحية",
    emailNotFound: "البريد الإلكتروني غير مسجل",
    tryAnotherWay: "جرّب طريقة أخرى",
    whatsappRecovery: "تواصل مع المشرف عبر واتساب",
    invalidEmail: "البريد الإلكتروني غير صالح",
    userBanned: "تم حظر هذا الحساب",
    noRoomSlot: "يمكنك إنشاء غرفة واحدة فقط. لديك غرفة بالفعل!",
    myRoom: "غرفتي",
    publicRooms: "الغرف العامة",
    mic: "الميكروفون",
    chat: "الدردشة",
    users: "المستخدمون",
    sendMessage: "مراسلة",
    resetPassword: "إعادة تعيين كلمة المرور",
    newPassword: "كلمة المرور الجديدة",
    resetPasswordTitle: "إعادة تعيين كلمة المرور",
    resetPasswordSuccess: "تم تغيير كلمة المرور بنجاح",
    presenceCount: "متصل الآن",
    roomMembers: "أعضاء الغرفة",
    noMembers: "لا يوجد أعضاء في المقاعد",
    userActions: "خيارات المستخدم",
    kickFromRoom: "طرد من الغرفة",
    muteInRoom: "كتم الصوت",
    unmuteInRoom: "رفع الكتم",
    noReels: "لا توجد مقاطع بعد",
    beFirst: "كن أول من ينشر مقطعاً!",
    publishReel: "نشر مقطع",
    reelTitle: "وصف المقطع...",
    pickVideo: "اختر مقطعاً",
    filters: "الفلاتر",
    filterNone: "بدون",
    filterGrayscale: "أبيض وأسود",
    filterWarm: "دافئ",
    filterCool: "بارد",
    filterVintage: "كلاسيكي",
    publish: "نشر",
    like: "إعجاب",
    comment: "تعليق",
    share: "مشاركة",
    comments: "التعليقات",
    noComments: "لا توجد تعليقات بعد",
    addComment: "أضف تعليقاً...",
    shareReel: "مشاركة المقطع",
    selectUser: "اختر مستخدماً",
    reelShared: "تم مشاركة المقطع",
    deleteReel: "حذف المقطع",
    myReels: "مقاطعي",
    searchUsers: "ابحث بالاسم أو الرقم...",
    search: "بحث",
    noResults: "لا توجد نتائج",
    userProfile: "الملف الشخصي",
    joinedAt: "انضم في",
    follow: "متابعة",
    following: "يتابع",
    unfollow: "إلغاء المتابعة",
    followers: "متابع",
    followingCount: "يتابعون",
    posts: "منشور",
    pendingRequest: "طلب إرسال",
    privateAccount: "حساب خاص",
    publicAccount: "حساب عام",
    accountType: "نوع الحساب",
    activity: "نشاطك",
    likedReels: "المقاطع المعجب بها",
    myComments: "تعليقاتي الأخيرة",
    notifications: "الإشعارات",
    noNotifications: "لا توجد إشعارات",
    followRequest: "طلب متابعة",
    sentFollowRequest: "أرسل طلب متابعة",
    acceptedFollow: "قبل طلب متابعتك",
    likedYourPost: "أعجب بمنشورك",
    commentedOnPost: "علّق على منشورك",
    stories: "القصص",
    addStory: "إضافة قصة",
    storyExpired: "انتهت صلاحية القصة",
    views: "مشاهدة",
    reply: "رد",
    createPost: "إنشاء منشور",
    addCaption: "أضف وصفاً...",
    bio: "السيرة الذاتية",
    editProfile: "تعديل الملف",
    acceptRequest: "قبول",
    rejectRequest: "رفض",
    followRequests: "طلبات المتابعة",
    noFollowRequests: "لا توجد طلبات متابعة",
    typeCaption: "اكتب وصفاً...",
    myPosts: "منشوراتي",
    noPosts: "لا توجد منشورات بعد",
    grid: "شبكة",
    list: "قائمة",
    deletePost: "حذف المنشور",
    hidePost: "إخفاء المنشور",
    postHidden: "تم إخفاء المنشور",
    postDeleted: "تم حذف المنشور",
    hidden: "مخفي",
    pinComment: "تثبيت التعليق",
    unpinComment: "إلغاء التثبيت",
    deleteComment: "حذف التعليق",
    pinned: "مثبّت",
    mentionedYou: "ذكرك في تعليق",
    usernameLabel: "اسم المستخدم",
    usernamePlaceholder: "@اسم_المستخدم",
    usernameExists: "اسم المستخدم مستخدم بالفعل",
    usernameRequired: "اسم المستخدم مطلوب",
    likedBy: "أعجب بالتعليق",
    noLikesYet: "لا يوجد إعجابات بعد",
    sharedPost: "منشور مشارك",
    sharedReel: "مقطع مشارك",
    sharedStory: "قصة مشاركة",
    tapToView: "اضغط للعرض",
    replyToStory: "رد على القصة...",
    likedYourStory: "أعجب بقصتك",
    repliedToStory: "رد على قصتك",
    storyReply: "رد على القصة",
    roomCode: "كود الغرفة",
    searchByCode: "ابحث بكود الغرفة أو اسم مستخدم...",
    roomCodeNotFound: "لم يتم العثور على غرفة بهذا الكود",
    changeBackground: "تغيير الخلفية",
    backgroundChanged: "تم تغيير الخلفية",
    announcement: "إعلان",
    editAnnouncement: "تعديل الإعلان",
    announcementPlaceholder: "اكتب إعلانك هنا...",
    lockSeat: "قفل المقعد",
    unlockSeat: "فتح المقعد",
    seatLocked: "المقعد مقفل",
    shareRoom: "مشاركة الغرفة",
    roomInvite: "دعوة لغرفة",
    joinNow: "دخول مباشر",
    selectFriend: "اختر صديقاً",
    inviteSent: "تم إرسال الدعوة",
    enteredRoom: "دخل الغرفة",
    leftRoom: "غادر الغرفة",
    seatNo: "مقعد رقم",
    allGovernorates: "الكل",
    governorateImages: "صور المحافظات",
    uploadGovernorateImage: "رفع صورة",
    sendOrder: "إرسال طلب",
    orderItem: "طلب",
    selectItem: "اختر صنفاً للطلب",
    orderSent: "تم إرسال الطلب",
    noRestaurantsInGovernorate: "لا توجد مطاعم في هذه المحافظة",
  },
  en: {
    home: "Home",
    rooms: "Rooms",
    messages: "Messages",
    restaurants: "Restaurants",
    profile: "Profile",
    reels: "Reels",
    createRoom: "Create Room",
    roomName: "Room Name",
    joinSeat: "Join Seat",
    mute: "Mute",
    unmute: "Unmute",
    leave: "Leave",
    send: "Send",
    typeMessage: "Type a message...",
    voiceCall: "Voice Call",
    videoCall: "Video Call",
    block: "Block",
    deleteChat: "Delete Chat",
    settings: "Settings",
    language: "Language",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    logout: "Logout",
    login: "Login",
    register: "Register",
    phone: "Phone",
    password: "Password",
    name: "Name",
    age: "Age",
    address: "Address",
    email: "Email",
    forgotPassword: "Forgot Password?",
    contactAdmin: "Contact Admin",
    welcome: "Welcome",
    hillaConnect: "Zentram",
    appName: "Zentram",
    welcomeToApp: "Welcome to Zentram",
    joinApp: "Join Zentram",
    myRestaurant: "My Restaurant",
    marketplace: "Marketplace",
    myMerchant: "My Store",
    merchants: "Merchants",
    orders: "Orders",
    noRooms: "No rooms yet",
    createFirst: "Create the first room!",
    seat: "Seat",
    empty: "Empty",
    owner: "Owner",
    admin: "Admin",
    superAdmin: "Super Admin",
    king: "King",
    royal: "Royal Entrance",
    deleteRoom: "Delete Room",
    banUser: "Ban User",
    unbanUser: "Unban User",
    kickUser: "Kick",
    restaurant: "Restaurant",
    menu: "Menu",
    addRestaurant: "Add Restaurant",
    editRestaurant: "Edit Restaurant",
    deleteRestaurant: "Delete Restaurant",
    whatsapp: "WhatsApp",
    call: "Call",
    addItem: "Add Item",
    price: "Price",
    description: "Description",
    category: "Category",
    noRestaurants: "No restaurants",
    noMessages: "No messages",
    startChat: "Start a chat",
    online: "Online",
    offline: "Offline",
    adminPanel: "Admin Panel",
    allUsers: "All Users",
    banned: "Banned",
    active: "Active",
    confirmLogout: "Do you want to logout?",
    yes: "Yes",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    error: "Error",
    success: "Success",
    invalidCredentials: "Invalid username, email or password",
    phoneExists: "Phone number already registered",
    emailExists: "Email already registered",
    fillAll: "Please fill all fields",
    governorate: "Governorate",
    selectGovernorate: "Select your governorate",
    usernameOrEmail: "Username or Email",
    changePassword: "Change Password",
    oldPassword: "Current Password",
    confirmPassword: "Confirm New Password",
    wrongPassword: "Current password is incorrect",
    passwordChanged: "Password changed successfully",
    passwordMismatch: "New passwords do not match",
    sendOTP: "Send Verification Code",
    otpSent: "Verification code sent to your email",
    enterOTP: "Enter verification code",
    verifyOTP: "Verify Code",
    otpInvalid: "Invalid or expired verification code",
    emailNotFound: "Email not registered",
    tryAnotherWay: "Try another way",
    whatsappRecovery: "Contact admin via WhatsApp",
    invalidEmail: "Invalid email address",
    userBanned: "This account is banned",
    noRoomSlot: "You can only create one room. You already have one!",
    myRoom: "My Room",
    publicRooms: "Public Rooms",
    mic: "Microphone",
    chat: "Chat",
    users: "Users",
    sendMessage: "Message",
    resetPassword: "Reset Password",
    newPassword: "New Password",
    resetPasswordTitle: "Reset Password",
    resetPasswordSuccess: "Password changed successfully",
    presenceCount: "Online Now",
    roomMembers: "Room Members",
    noMembers: "No members in seats",
    userActions: "User Actions",
    kickFromRoom: "Kick from Room",
    muteInRoom: "Mute User",
    unmuteInRoom: "Unmute User",
    noReels: "No reels yet",
    beFirst: "Be the first to post!",
    publishReel: "Publish Reel",
    reelTitle: "Describe your reel...",
    pickVideo: "Pick a video",
    filters: "Filters",
    filterNone: "None",
    filterGrayscale: "B&W",
    filterWarm: "Warm",
    filterCool: "Cool",
    filterVintage: "Vintage",
    publish: "Publish",
    like: "Like",
    comment: "Comment",
    share: "Share",
    comments: "Comments",
    noComments: "No comments yet",
    addComment: "Add a comment...",
    shareReel: "Share Reel",
    selectUser: "Select user",
    reelShared: "Reel shared",
    deleteReel: "Delete Reel",
    myReels: "My Reels",
    searchUsers: "Search by name or phone...",
    search: "Search",
    noResults: "No results found",
    userProfile: "User Profile",
    joinedAt: "Joined",
    follow: "Follow",
    following: "Following",
    unfollow: "Unfollow",
    followers: "Followers",
    followingCount: "Following",
    posts: "Posts",
    pendingRequest: "Requested",
    privateAccount: "Private Account",
    publicAccount: "Public Account",
    accountType: "Account Type",
    activity: "Your Activity",
    likedReels: "Liked Reels",
    myComments: "My Recent Comments",
    notifications: "Notifications",
    noNotifications: "No notifications",
    followRequest: "Follow Request",
    sentFollowRequest: "sent you a follow request",
    acceptedFollow: "accepted your follow request",
    likedYourPost: "liked your post",
    commentedOnPost: "commented on your post",
    stories: "Stories",
    addStory: "Add Story",
    storyExpired: "Story expired",
    views: "views",
    reply: "Reply",
    createPost: "Create Post",
    addCaption: "Add a caption...",
    bio: "Bio",
    editProfile: "Edit Profile",
    acceptRequest: "Accept",
    rejectRequest: "Reject",
    followRequests: "Follow Requests",
    noFollowRequests: "No follow requests",
    typeCaption: "Write a caption...",
    myPosts: "My Posts",
    noPosts: "No posts yet",
    grid: "Grid",
    list: "List",
    deletePost: "Delete Post",
    hidePost: "Hide Post",
    postHidden: "Post hidden",
    postDeleted: "Post deleted",
    hidden: "Hidden",
    pinComment: "Pin Comment",
    unpinComment: "Unpin Comment",
    deleteComment: "Delete Comment",
    pinned: "Pinned",
    mentionedYou: "mentioned you in a comment",
    usernameLabel: "Username",
    usernamePlaceholder: "@username",
    usernameExists: "Username already taken",
    usernameRequired: "Username is required",
    likedBy: "Liked by",
    noLikesYet: "No likes yet",
    sharedPost: "Shared Post",
    sharedReel: "Shared Reel",
    sharedStory: "Shared Story",
    tapToView: "Tap to view",
    replyToStory: "Reply to story...",
    likedYourStory: "liked your story",
    repliedToStory: "replied to your story",
    storyReply: "Story Reply",
    roomCode: "Room Code",
    searchByCode: "Search by room code or username...",
    roomCodeNotFound: "No room found with that code",
    changeBackground: "Change Background",
    backgroundChanged: "Background changed",
    announcement: "Announcement",
    editAnnouncement: "Edit Announcement",
    announcementPlaceholder: "Write your announcement here...",
    lockSeat: "Lock Seat",
    unlockSeat: "Unlock Seat",
    seatLocked: "Seat Locked",
    shareRoom: "Share Room",
    roomInvite: "Room Invitation",
    joinNow: "Join Now",
    selectFriend: "Select a Friend",
    inviteSent: "Invitation sent",
    enteredRoom: "entered the room",
    leftRoom: "left the room",
    seatNo: "Seat No.",
    allGovernorates: "All",
    governorateImages: "Governorate Images",
    uploadGovernorateImage: "Upload Image",
    sendOrder: "Send Order",
    orderItem: "Order",
    selectItem: "Select an item to order",
    orderSent: "Order Sent",
    noRestaurantsInGovernorate: "No restaurants in this governorate",
  },
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateRoomCode(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function parseMentions(content: string, allUsers: User[]): User[] {
  const regex = /@([\w\u0600-\u06FF]+)/g;
  const mentioned: User[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const handle = match[1];
    const user = allUsers.find(
      (u) =>
        (u.username && u.username.toLowerCase() === handle.toLowerCase()) ||
        u.email.toLowerCase() === handle.toLowerCase()
    );
    if (user && !mentioned.find((m) => m.id === user.id)) {
      mentioned.push(user);
    }
  }
  return mentioned;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");
  const [theme, setTheme] = useState<Theme>("dark");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [reelLikes, setReelLikes] = useState<ReelLike[]>([]);
  const [reelComments, setReelComments] = useState<ReelComment[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLikes, setPostLikes] = useState<PostLike[]>([]);
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [closeFriendsLists, setCloseFriendsLists] = useState<Record<string, string[]>>({});
  const [follows, setFollows] = useState<Follow[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [savedPosts, setSavedPostsState] = useState<string[]>([]);
  const [governorateImages, setGovernorateImagesState] = useState<GovernorateImage[]>([]);
  const [cart, setCart] = useState<CommerceCart | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [minimizedRoomId, setMinimizedRoomId] = useState<string | null>(null);
  const [minimizedRoomName, setMinimizedRoomName] = useState<string>("");
  const [minimizedRoomImage, setMinimizedRoomImage] = useState<string | undefined>(undefined);
  const [isStoryEditorOpen, setStoryEditorOpen] = useState(false);
  const [floatingRoomPos, setFloatingRoomPos] = useState<{ x: number; y: number } | null>(null);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [privacySettingsMap, setPrivacySettingsMap] = useState<Record<string, UserPrivacySettings>>({});
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateRecord[]>([]);
  const [savedProducts, setSavedProductsState] = useState<string[]>([]);
  const [productLikes, setProductLikesState] = useState<Record<string, string[]>>({});
  const [followedMerchants, setFollowedMerchantsState] = useState<string[]>([]);
  const [blockedMerchantIds, setBlockedMerchantIdsState] = useState<string[]>([]);

  const minimizeRoom = useCallback((roomId: string, roomName: string, roomImage?: string) => {
    setIsRoomMinimized(true);
    setMinimizedRoomId(roomId);
    setMinimizedRoomName(roomName);
    setMinimizedRoomImage(roomImage);
  }, []);

  const expandRoom = useCallback(() => {
    setIsRoomMinimized(false);
    setMinimizedRoomId(null);
    setMinimizedRoomName("");
    setMinimizedRoomImage(undefined);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // ── Re-register socket + load cloud data whenever currentUser changes ─────
  useEffect(() => {
    if (!currentUser) return;

    // Register this device's socket with the server
    registerUserSocket(currentUser.id);

    const socket = getSocket();

    // Helper: convert a ServerRoom to the local Room shape
    const serverRoomToLocal = (cr: any): Room => ({
      id: cr.id,
      roomCode: cr.roomCode ?? "",
      name: cr.name,
      image: cr.image ?? undefined,
      ownerId: cr.ownerId,
      ownerName: cr.ownerName ?? "",
      seats: cr.seats ?? Array(8).fill(null),
      seatUsers: Array(8).fill(null),
      lockedSeats: Array(8).fill(false),
      chat: cr.chat ?? [],
      bannedUsers: cr.bannedUsers ?? [],
      mutedUsers: cr.mutedUsers ?? [],
      isHidden: cr.isHidden ?? false,
      createdAt: cr.createdAt ?? Date.now(),
    });

    // ── Initial full load from REST API (replaces local state entirely) ────
    roomsApi.listRooms().then((cloudRooms) => {
      console.log(`📋 [APP] Loaded ${cloudRooms.length} rooms from server`);
      setRooms(cloudRooms.map(serverRoomToLocal));
    }).catch(() => {});

    // ── Socket: rooms_update — server broadcasts full list on any change ───
    const handleRoomsUpdate = (serverRooms: any[]) => {
      console.log(`🔄 [APP] rooms_update received — ${serverRooms.length} rooms`);
      setRooms(serverRooms.map(serverRoomToLocal));
    };

    // ── Socket: room:created — single new room ─────────────────────────────
    const handleRoomCreated = (cr: any) => {
      console.log(`➕ [APP] room:created — roomId: ${cr.id}`);
      setRooms((prev) => {
        if (prev.find((r) => r.id === cr.id)) return prev;
        return [...prev, serverRoomToLocal(cr)];
      });
    };

    // ── Socket: room:deleted — remove room from list ───────────────────────
    const handleRoomDeleted = ({ roomId }: { roomId: string }) => {
      console.log(`🗑️  [APP] room:deleted — roomId: ${roomId}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    };

    // ── Socket: room:message — append message to room chat ────────────────
    const handleRoomMessage = ({ roomId, message }: { roomId: string; message: any }) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId ? { ...r, chat: [...(r.chat ?? []), message] } : r
        )
      );
    };

    socket.on("rooms_update", handleRoomsUpdate);
    socket.on("room:created", handleRoomCreated);
    socket.on("room:deleted", handleRoomDeleted);
    socket.on("room:message", handleRoomMessage);

    // ── Socket: room seat changes (real-time participant sync) ─────────────
    const handleParticipantJoined = ({ roomId, userId: uid, userName: uName, userImage: uImg, seatIndex }: any) => {
      console.log(`👤 [APP] user_joined room ${roomId} seat ${seatIndex} — userId: ${uid}`);
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          const seats = [...(r.seats ?? Array(8).fill(null))];
          const seatUsers = [...(r.seatUsers ?? Array(8).fill(null))];
          if (seatIndex >= 0 && seatIndex < 8) {
            // Remove user from any current seat first
            for (let i = 0; i < 8; i++) {
              if (seats[i] === uid) { seats[i] = null; seatUsers[i] = null; }
            }
            seats[seatIndex] = uid;
            seatUsers[seatIndex] = { id: uid, name: uName ?? "", image: uImg } as any;
          }
          const presentUserIds = Array.from(new Set([...(r.presentUserIds ?? []), uid]));
          return { ...r, seats, seatUsers, presentUserIds };
        })
      );
    };

    const handleParticipantLeft = ({ roomId, userId: uid }: any) => {
      console.log(`🚪 [APP] user_left room ${roomId} — userId: ${uid}`);
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          const seats = (r.seats ?? Array(8).fill(null)).map((s: string | null) => (s === uid ? null : s));
          const seatUsers = (r.seatUsers ?? Array(8).fill(null)).map((u: any) => (u?.id === uid ? null : u));
          const presentUserIds = (r.presentUserIds ?? []).filter((id: string) => id !== uid);
          return { ...r, seats, seatUsers, presentUserIds };
        })
      );
    };

    // ── Socket: room:state — server sends full participant snapshot on subscribe ─
    const handleRoomState = ({ roomId, participants, seats: serverSeats }: {
      roomId: string;
      participants: { userId: string; userName: string | null; userImage: string | null; seatIndex: number }[];
      seats: (string | null)[];
    }) => {
      console.log(`🏠 [APP] room:state snapshot — room: ${roomId} participants: ${participants.length}`);
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          const seats = Array(8).fill(null) as (string | null)[];
          const seatUsers = Array(8).fill(null) as any[];
          const presentUserIds: string[] = [];
          for (const p of participants) {
            presentUserIds.push(p.userId);
            if (p.seatIndex >= 0 && p.seatIndex < 8) {
              seats[p.seatIndex] = p.userId;
              seatUsers[p.seatIndex] = { id: p.userId, name: p.userName ?? "", avatar: p.userImage } as any;
            }
          }
          return { ...r, seats, seatUsers, presentUserIds };
        })
      );
    };

    socket.on("room:state", handleRoomState);
    socket.on("room:participant-joined", handleParticipantJoined);
    socket.on("user_joined", handleParticipantJoined);
    socket.on("room:participant-left", handleParticipantLeft);

    // ── Socket: live feed updates ──────────────────────────────────────────
    const handlePostNew = (serverPost: any) => {
      if (!serverPost?.id) return;
      console.log(`📰 [APP] global_feed_update — new post: ${serverPost.id} by ${serverPost.creatorId}`);
      setPosts((prev) => {
        if (prev.find((p) => p.id === serverPost.id)) return prev;
        const newPost: any = {
          ...serverPost,
          likedBy: [],
          comments: [],
          likeCount: serverPost.likesCount ?? 0,
          commentCount: serverPost.commentsCount ?? 0,
        };
        return [newPost, ...prev];
      });
    };

    const handlePostLiked = ({ postId, userId: likerId, liked, likesCount }: any) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const likedBy: string[] = liked
            ? Array.from(new Set([...(p.likedBy ?? []), likerId]))
            : (p.likedBy ?? []).filter((id: string) => id !== likerId);
          return { ...p, likedBy, likeCount: likesCount };
        })
      );
    };

    const handlePostComment = ({ postId }: any) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentCount: (p.commentCount ?? p.comments?.length ?? 0) + 1 }
            : p
        )
      );
    };

    socket.on("post:new", handlePostNew);
    socket.on("global_feed_update", ({ post }: any) => { if (post) handlePostNew(post); });
    socket.on("post:liked", handlePostLiked);
    socket.on("post:comment", handlePostComment);

    // ── Socket: DM from REST API path (new-message) ────────────────────────
    const handleNewMessage = ({ chatId, message: msg }: { chatId: number; message: any }) => {
      if (!msg) return;
      setConversations((prev) =>
        prev.map((c) => {
          const match = (c as any).chatId === chatId ||
            c.participants?.includes(msg.senderId);
          if (!match) return c;
          const newMsg: any = {
            id: String(msg.id),
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            type: msg.type ?? "text",
            mediaUrl: msg.mediaUrl,
            timestamp: msg.timestamp ?? Date.now(),
            read: false,
          };
          return { ...c, messages: [...(c.messages ?? []), newMsg], lastMessage: newMsg, updatedAt: Date.now() };
        })
      );
    };

    socket.on("new-message", handleNewMessage);

    // ── Socket: incoming private message ──────────────────────────────────
    const handlePrivateMessage = (payload: {
      conversationId: string;
      message: {
        id: string;
        senderId: string;
        senderName: string;
        content: string;
        type: string;
        mediaUrl?: string;
        timestamp: number;
      };
    }) => {
      if (!payload?.conversationId || !payload?.message) return;
      const incoming = payload.message;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === payload.conversationId);
        const newMsg: any = {
          id: incoming.id,
          senderId: incoming.senderId,
          receiverId: currentUser.id,
          content: incoming.content,
          type: incoming.type as any,
          mediaUrl: incoming.mediaUrl,
          timestamp: incoming.timestamp,
          read: false,
        };
        if (exists) {
          return prev.map((c) =>
            c.id === payload.conversationId
              ? { ...c, messages: [...(c.messages ?? []), newMsg], lastMessage: newMsg, updatedAt: Date.now() }
              : c
          );
        }
        // New conversation — create a shell
        const otherUser = prev
          .flatMap((c) => c.participantUsers ?? [])
          .find((u: any) => u?.id === incoming.senderId);
        const newConvo: any = {
          id: payload.conversationId,
          participants: [incoming.senderId, currentUser.id],
          participantUsers: otherUser ? [otherUser] : [],
          messages: [newMsg],
          lastMessage: newMsg,
          updatedAt: Date.now(),
        };
        return [...prev, newConvo];
      });
    };

    socket.on("private-message", handlePrivateMessage);
    return () => {
      socket.off("rooms_update", handleRoomsUpdate);
      socket.off("room:created", handleRoomCreated);
      socket.off("room:deleted", handleRoomDeleted);
      socket.off("room:message", handleRoomMessage);
      socket.off("room:state", handleRoomState);
      socket.off("room:participant-joined", handleParticipantJoined);
      socket.off("user_joined", handleParticipantJoined);
      socket.off("room:participant-left", handleParticipantLeft);
      socket.off("post:new", handlePostNew);
      socket.off("global_feed_update");
      socket.off("post:liked", handlePostLiked);
      socket.off("post:comment", handlePostComment);
      socket.off("new-message", handleNewMessage);
      socket.off("private-message", handlePrivateMessage);
    };
  }, [currentUser?.id]);

  const loadData = async () => {
    try {
      const keys = [
        "language", "theme", "currentUser", "users", "conversations",
        "passwords", "blockedUsers", "reels", "reelLikes",
        "reelComments", "posts", "postLikes", "postComments", "stories",
        "closeFriendsLists", "follows", "notifications", "savedPosts", "governorateImages",
        "groupChats", "privacySettings",
        "merchants", "products", "orders", "cart",
        "savedProducts", "productLikes", "followedMerchants", "blockedMerchantIds",
      ];
      const values = await AsyncStorage.multiGet(keys);
      const data = Object.fromEntries(values.map(([k, v]) => [k, v]));

      if (data.language) setLanguageState(data.language as Language);
      if (data.theme) setTheme(data.theme as Theme);
      if (data.currentUser) setCurrentUser(JSON.parse(data.currentUser));
      if (data.users) setUsers(JSON.parse(data.users));
      // rooms are NOT loaded from AsyncStorage — server is the only source of truth
      if (data.conversations) setConversations(JSON.parse(data.conversations));
      if (data.passwords) setPasswords(JSON.parse(data.passwords));
      if (data.blockedUsers) setBlockedUsers(JSON.parse(data.blockedUsers));
      if (data.reels) setReels(JSON.parse(data.reels));
      if (data.reelLikes) setReelLikes(JSON.parse(data.reelLikes));
      if (data.reelComments) {
        const parsedRC: ReelComment[] = JSON.parse(data.reelComments);
        const migratedRC = parsedRC.map((c) => ({
          ...c,
          likedBy: (c as any).likedBy ?? [],
          isPinned: (c as any).isPinned ?? false,
        }));
        setReelComments(migratedRC);
      }
      if (data.posts) {
        const parsed: Post[] = JSON.parse(data.posts);
        setPosts(parsed);
      }
      if (data.postLikes) setPostLikes(JSON.parse(data.postLikes));
      if (data.postComments) {
        const parsed: PostComment[] = JSON.parse(data.postComments);
        // Migrate old comments that don't have likedBy/isPinned
        const migrated = parsed.map((c) => ({
          ...c,
          likedBy: c.likedBy ?? [],
          isPinned: c.isPinned ?? false,
        }));
        setPostComments(migrated);
      }
      if (data.stories) setStories(JSON.parse(data.stories));
      if (data.closeFriendsLists) setCloseFriendsLists(JSON.parse(data.closeFriendsLists));
      if (data.follows) setFollows(JSON.parse(data.follows));
      if (data.notifications) setNotifications(JSON.parse(data.notifications));
      if (data.savedPosts) setSavedPostsState(JSON.parse(data.savedPosts));
      if (data.governorateImages) setGovernorateImagesState(JSON.parse(data.governorateImages));
      if (data.groupChats) setGroups(JSON.parse(data.groupChats));
      if (data.privacySettings) setPrivacySettingsMap(JSON.parse(data.privacySettings));
      if (data.merchants) setMerchants(JSON.parse(data.merchants));
      if (data.products) setProducts(JSON.parse(data.products));
      if (data.orders) setOrders(JSON.parse(data.orders));
      if (data.cart) setCart(JSON.parse(data.cart));
      if (data.savedProducts) setSavedProductsState(JSON.parse(data.savedProducts));
      if (data.productLikes) setProductLikesState(JSON.parse(data.productLikes));
      if (data.followedMerchants) setFollowedMerchantsState(JSON.parse(data.followedMerchants));
      if (data.blockedMerchantIds) setBlockedMerchantIdsState(JSON.parse(data.blockedMerchantIds));
    } catch (e) {}
  };

  const saveUsers = (u: User[]) => { setUsers(u); AsyncStorage.setItem("users", JSON.stringify(u)); };
  // Rooms are server-only — never persisted to AsyncStorage
  const saveRooms = (r: Room[]) => { setRooms(r); };
  const saveConversations = (c: Conversation[]) => { setConversations(c); AsyncStorage.setItem("conversations", JSON.stringify(c)); };
  const saveReels = (r: Reel[]) => { setReels(r); AsyncStorage.setItem("reels", JSON.stringify(r)); };
  const saveLikes = (l: ReelLike[]) => { setReelLikes(l); AsyncStorage.setItem("reelLikes", JSON.stringify(l)); };
  const saveComments = (c: ReelComment[]) => { setReelComments(c); AsyncStorage.setItem("reelComments", JSON.stringify(c)); };
  const savePosts = (p: Post[]) => { setPosts(p); AsyncStorage.setItem("posts", JSON.stringify(p)); };
  const savePostLikes = (l: PostLike[]) => { setPostLikes(l); AsyncStorage.setItem("postLikes", JSON.stringify(l)); };
  const savePostComments = (c: PostComment[]) => { setPostComments(c); AsyncStorage.setItem("postComments", JSON.stringify(c)); };
  const saveStories = (s: Story[]) => { setStories(s); AsyncStorage.setItem("stories", JSON.stringify(s)); };
  const saveCloseFriendsLists = (m: Record<string, string[]>) => { setCloseFriendsLists(m); AsyncStorage.setItem("closeFriendsLists", JSON.stringify(m)); };
  const saveFollows = (f: Follow[]) => { setFollows(f); AsyncStorage.setItem("follows", JSON.stringify(f)); };
  const saveNotifications = (n: AppNotification[]) => { setNotifications(n); AsyncStorage.setItem("notifications", JSON.stringify(n)); };
  const saveSavedPostsData = (s: string[]) => { setSavedPostsState(s); AsyncStorage.setItem("savedPosts", JSON.stringify(s)); };
  const saveGovernorateImagesData = (g: GovernorateImage[]) => { setGovernorateImagesState(g); AsyncStorage.setItem("governorateImages", JSON.stringify(g)); };
  const saveGroups = (g: GroupChat[]) => { setGroups(g); AsyncStorage.setItem("groupChats", JSON.stringify(g)); };
  const savePrivacySettingsMap = (m: Record<string, UserPrivacySettings>) => { setPrivacySettingsMap(m); AsyncStorage.setItem("privacySettings", JSON.stringify(m)); };
  const saveMerchants = (m: Merchant[]) => { setMerchants(m); AsyncStorage.setItem("merchants", JSON.stringify(m)); };
  const saveProducts = (p: Product[]) => { setProducts(p); AsyncStorage.setItem("products", JSON.stringify(p)); };
  const saveOrders = (o: Order[]) => { setOrders(o); AsyncStorage.setItem("orders", JSON.stringify(o)); };
  const saveCart = (c: CommerceCart | null) => { setCart(c); AsyncStorage.setItem("cart", JSON.stringify(c)); };
  const saveSavedProducts = (s: string[]) => { setSavedProductsState(s); AsyncStorage.setItem("savedProducts", JSON.stringify(s)); };
  const saveProductLikes = (l: Record<string, string[]>) => { setProductLikesState(l); AsyncStorage.setItem("productLikes", JSON.stringify(l)); };
  const saveFollowedMerchants = (f: string[]) => { setFollowedMerchantsState(f); AsyncStorage.setItem("followedMerchants", JSON.stringify(f)); };
  const saveBlockedMerchantIds = (b: string[]) => { setBlockedMerchantIdsState(b); AsyncStorage.setItem("blockedMerchantIds", JSON.stringify(b)); };

  const savePost = useCallback((postId: string) => {
    setSavedPostsState((prev) => {
      if (prev.includes(postId)) return prev;
      const next = [...prev, postId];
      AsyncStorage.setItem("savedPosts", JSON.stringify(next));
      return next;
    });
  }, []);

  const unsavePost = useCallback((postId: string) => {
    setSavedPostsState((prev) => {
      const next = prev.filter((id) => id !== postId);
      AsyncStorage.setItem("savedPosts", JSON.stringify(next));
      return next;
    });
  }, []);

  const isPostSaved = useCallback((postId: string) => savedPosts.includes(postId), [savedPosts]);

  const getSavedPosts = useCallback(() => posts.filter((p) => savedPosts.includes(p.id)), [posts, savedPosts]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem("language", lang);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem("theme", next);
      const store = useThemeStore.getState();
      const current = store.activeTheme;
      if (current === "classicDark" || current === "classicLight") {
        store.setTheme(next === "dark" ? "classicDark" : "classicLight");
      }
      return next;
    });
  }, []);

  const isSuperAdmin = currentUser?.phone === SUPER_ADMIN_PHONE || currentUser?.role === "MANAGER";
  const isManager = currentUser?.phone === SUPER_ADMIN_PHONE || currentUser?.role === "MANAGER";
  const isMerchantOwner = currentUser?.role === "MERCHANT_OWNER" || currentUser?.role === "RESTAURANT_OWNER";

  const getMyMerchant = useCallback((): Merchant | null => {
    if (!currentUser) return null;
    return merchants.find((m) => m.ownerId === currentUser.id) ?? null;
  }, [currentUser, merchants]);

  const getCommissionTier = useCallback((monthlySales: number): number => {
    if (monthlySales >= 500) return 1;
    if (monthlySales > 100) return 1.5;
    return 2;
  }, []);

  const recordAffiliateLink = useCallback((productId: string, influencerId: string) => {
    const record: AffiliateRecord = { productId, influencerId, sessionId: generateId(), createdAt: Date.now() };
    setAffiliateLinks((prev) => [...prev.filter((a) => a.productId !== productId), record]);
  }, []);

  const getAffiliateForProduct = useCallback((productId: string): AffiliateRecord | null => {
    return affiliateLinks.find((a) => a.productId === productId) ?? null;
  }, [affiliateLinks]);

  const addMerchant = useCallback((data: Omit<Merchant, "id" | "createdAt" | "tier" | "monthlySales">): Merchant => {
    const m: Merchant = { ...data, id: generateId(), createdAt: Date.now(), tier: "bronze", monthlySales: 0 };
    saveMerchants([...merchants, m]);
    return m;
  }, [merchants]);

  const updateMerchantProfile = useCallback((merchantId: string, data: Partial<Merchant>) => {
    saveMerchants(merchants.map((m) => (m.id === merchantId ? { ...m, ...data } : m)));
  }, [merchants]);

  const addProduct = useCallback((data: Omit<Product, "id" | "createdAt">) => {
    const p: Product = { ...data, id: generateId(), createdAt: Date.now() };
    saveProducts([...products, p]);
  }, [products]);

  const updateProduct = useCallback((productId: string, data: Partial<Product>) => {
    saveProducts(products.map((p) => (p.id === productId ? { ...p, ...data } : p)));
  }, [products]);

  const deleteProduct = useCallback((productId: string) => {
    saveProducts(products.filter((p) => p.id !== productId));
  }, [products]);


  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    saveOrders(orders.map((o) => (o.id === orderId ? { ...o, status, updatedAt: Date.now() } : o)));
  }, [orders]);

  const getMerchantOrders = useCallback((merchantId: string): Order[] => {
    return orders.filter((o) => o.merchantId === merchantId);
  }, [orders]);

  const getMyOrders = useCallback((): Order[] => {
    if (!currentUser) return [];
    return orders.filter((o) => o.customerId === currentUser.id).sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, currentUser]);

  const _pushOrderNotification = useCallback((customerId: string, message: string, orderId: string) => {
    const notif: AppNotification = {
      id: generateId(),
      recipientId: customerId,
      senderId: "system",
      senderName: "سفرة بابل",
      type: "order_update",
      referenceId: orderId,
      message,
      isRead: false,
      createdAt: Date.now(),
    };
    setNotifications((prev) => {
      const next = [notif, ...prev];
      AsyncStorage.setItem("notifications", JSON.stringify(next));
      return next;
    });
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== "pending") return;
    saveOrders(orders.map((o) => o.id === orderId ? { ...o, status: "cancelled" as OrderStatus, updatedAt: Date.now() } : o));
  }, [orders]);

  const acceptOrder = useCallback((orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const updated = orders.map((o) => o.id === orderId ? { ...o, status: "accepted" as OrderStatus, updatedAt: Date.now() } : o);
    saveOrders(updated);
    _pushOrderNotification(order.customerId, "✅ تم قبول طلبك! سيتم شحنه قريباً.", orderId);
  }, [orders, _pushOrderNotification]);

  const rejectOrder = useCallback((orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const updated = orders.map((o) => o.id === orderId ? { ...o, status: "cancelled" as OrderStatus, updatedAt: Date.now() } : o);
    saveOrders(updated);
    _pushOrderNotification(order.customerId, "❌ تم رفض طلبك من قِبَل التاجر.", orderId);
  }, [orders, _pushOrderNotification]);

  const toggleSaveProduct = useCallback((productId: string) => {
    setSavedProductsState((prev) => {
      const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId];
      AsyncStorage.setItem("savedProducts", JSON.stringify(next));
      return next;
    });
  }, []);

  const isProductSaved = useCallback((productId: string) => savedProducts.includes(productId), [savedProducts]);

  const toggleLikeProduct = useCallback((productId: string) => {
    if (!currentUser) return;
    setProductLikesState((prev) => {
      const likers = prev[productId] ?? [];
      const next = likers.includes(currentUser.id)
        ? { ...prev, [productId]: likers.filter((id) => id !== currentUser.id) }
        : { ...prev, [productId]: [...likers, currentUser.id] };
      AsyncStorage.setItem("productLikes", JSON.stringify(next));
      return next;
    });
  }, [currentUser]);

  const isProductLiked = useCallback((productId: string): boolean => {
    if (!currentUser) return false;
    return (productLikes[productId] ?? []).includes(currentUser.id);
  }, [productLikes, currentUser]);

  const getProductLikesCount = useCallback((productId: string): number => {
    return (productLikes[productId] ?? []).length;
  }, [productLikes]);

  const toggleFollowMerchant = useCallback((merchantId: string) => {
    setFollowedMerchantsState((prev) => {
      const next = prev.includes(merchantId) ? prev.filter((id) => id !== merchantId) : [...prev, merchantId];
      AsyncStorage.setItem("followedMerchants", JSON.stringify(next));
      return next;
    });
  }, []);

  const isMerchantFollowed = useCallback((merchantId: string): boolean => followedMerchants.includes(merchantId), [followedMerchants]);

  const blockMerchantStore = useCallback((merchantId: string) => {
    setBlockedMerchantIdsState((prev) => {
      if (prev.includes(merchantId)) return prev;
      const next = [...prev, merchantId];
      AsyncStorage.setItem("blockedMerchantIds", JSON.stringify(next));
      return next;
    });
    setFollowedMerchantsState((prev) => {
      const next = prev.filter((id) => id !== merchantId);
      AsyncStorage.setItem("followedMerchants", JSON.stringify(next));
      return next;
    });
  }, []);

  const unblockMerchantStore = useCallback((merchantId: string) => {
    setBlockedMerchantIdsState((prev) => {
      const next = prev.filter((id) => id !== merchantId);
      AsyncStorage.setItem("blockedMerchantIds", JSON.stringify(next));
      return next;
    });
  }, []);

  const isMerchantBlocked = useCallback((merchantId: string): boolean => blockedMerchantIds.includes(merchantId), [blockedMerchantIds]);


  const createMerchantAccount = useCallback(
    async (name: string, email: string, governorate: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: "email_exists" };
      }
      const newUser: User = {
        id: generateId(), name,
        username: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, ""),
        email, primaryGovernorate: governorate,
        accountType: "public", role: "MERCHANT_OWNER" as UserRole, isActive: true, createdAt: Date.now(),
      };
      const newMerchant: Merchant = {
        id: generateId(), name: `متجر ${name}`, ownerId: newUser.id,
        governorate, isActive: true, commissionRate: 10, monthlyDues: 0,
        monthlySales: 0, tier: "bronze", category: "متجر", createdAt: Date.now(),
      };
      saveUsers([...users, newUser]);
      const newPasswords = { ...passwords, [newUser.id]: password };
      setPasswords(newPasswords);
      await AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
      saveMerchants([...merchants, newMerchant]);
      return { success: true };
    },
    [users, passwords, merchants]
  );

  const login = useCallback(
    async (identifier: string, password: string): Promise<boolean> => {
      // ── Super admin shortcut (local only) ────────────────────────────────
      if (identifier === SUPER_ADMIN_PHONE && password === SUPER_ADMIN_PASSWORD) {
        let adminUser = users.find((u) => u.phone === SUPER_ADMIN_PHONE);
        if (!adminUser) {
          adminUser = {
            id: generateId(),
            name: "المدير الأعلى",
            username: "admin",
            phone: SUPER_ADMIN_PHONE,
            email: "admin@zentram.app",
            primaryGovernorate: "بابل",
            accountType: "public",
            role: "MANAGER" as UserRole,
            isActive: true,
            createdAt: Date.now(),
          };
          const newUsers = [...users, adminUser];
          saveUsers(newUsers);
          const newPasswords = { ...passwords, [adminUser.id]: SUPER_ADMIN_PASSWORD };
          setPasswords(newPasswords);
          await AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
        } else if (!adminUser.role) {
          adminUser = { ...adminUser, role: "MANAGER" as UserRole, isActive: true };
          saveUsers(users.map((u) => (u.phone === SUPER_ADMIN_PHONE ? adminUser! : u)));
        }
        setCurrentUser(adminUser);
        await AsyncStorage.setItem("currentUser", JSON.stringify(adminUser));
        return true;
      }

      // ── Cloud login (API) ─────────────────────────────────────────────────
      try {
        const result = await authApi.login({ identifier, password });
        if ("token" in result && result.user) {
          const localUser = serverUserToLocal(result.user) as User;
          // Merge into users list (update if already exists)
          saveUsers([...users.filter((u) => u.id !== localUser.id), localUser]);
          setCurrentUser(localUser);
          await AsyncStorage.setItem("currentUser", JSON.stringify(localUser));
          registerUserSocket(localUser.id);
          return true;
        }
        // API says wrong credentials — don't fall through to local
        if ("error" in result && (result.error === "invalid_credentials" || result.error === "account_banned")) {
          return false;
        }
      } catch {
        // Network error — fall through to local auth
      }

      // ── Local fallback ────────────────────────────────────────────────────
      const id = identifier.trim().toLowerCase();
      const user = users.find(
        (u) =>
          (u.username && u.username.toLowerCase() === id) ||
          u.email.toLowerCase() === id
      );
      if (!user) return false;
      if (passwords[user.id] !== password) return false;
      if (user.isBanned) return false;
      setCurrentUser(user);
      await AsyncStorage.setItem("currentUser", JSON.stringify(user));
      registerUserSocket(user.id);
      return true;
    },
    [users, passwords]
  );

  const checkUsername = useCallback(
    (username: string): boolean => {
      return !users.some((u) => u.username && u.username.toLowerCase() === username.toLowerCase());
    },
    [users]
  );

  const checkEmail = useCallback(
    (email: string): boolean => {
      return !users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    },
    [users]
  );

  const register = useCallback(
    async (name: string, username: string, email: string, governorate: string, password: string): Promise<{ success: boolean; error?: "email_exists" | "username_exists" }> => {
      // ── Cloud registration (API) ──────────────────────────────────────────
      try {
        const result = await authApi.register({ name, username, email, password, governorate });
        if ("token" in result && result.user) {
          const localUser = serverUserToLocal(result.user) as User;
          saveUsers([...users.filter((u) => u.id !== localUser.id), localUser]);
          setCurrentUser(localUser);
          await AsyncStorage.setItem("currentUser", JSON.stringify(localUser));
          registerUserSocket(localUser.id);
          return { success: true };
        }
        if ("error" in result && result.error === "email_exists") return { success: false, error: "email_exists" };
        if ("error" in result && result.error === "username_exists") return { success: false, error: "username_exists" };
      } catch {
        // Network error — fall through to local registration
      }

      // ── Local fallback ────────────────────────────────────────────────────
      const emailExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) return { success: false, error: "email_exists" };
      const usernameExists = users.some((u) => u.username && u.username.toLowerCase() === username.toLowerCase());
      if (usernameExists) return { success: false, error: "username_exists" };
      const newUser: User = {
        id: generateId(),
        name,
        username,
        email,
        address: governorate,
        primaryGovernorate: governorate,
        accountType: "public",
        createdAt: Date.now(),
      };
      const newUsers = [...users, newUser];
      saveUsers(newUsers);
      const newPasswords = { ...passwords, [newUser.id]: password };
      setPasswords(newPasswords);
      await AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
      setCurrentUser(newUser);
      await AsyncStorage.setItem("currentUser", JSON.stringify(newUser));
      registerUserSocket(newUser.id);
      return { success: true };
    },
    [users, passwords]
  );

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) return { success: false, error: "not_logged_in" };
      if (passwords[currentUser.id] !== oldPassword) return { success: false, error: "wrong_password" };
      const newPasswords = { ...passwords, [currentUser.id]: newPassword };
      setPasswords(newPasswords);
      await AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
      return { success: true };
    },
    [currentUser, passwords]
  );

  const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

  // Resilient fetch: 15s timeout + retry على أخطاء الشبكة المؤقتة (EAI_AGAIN, network errors)
  const apiFetch = useCallback(
    async (url: string, init: RequestInit = {}, opts: { retries?: number; timeoutMs?: number } = {}) => {
      const { retries = 2, timeoutMs = 15_000 } = opts;
      let lastErr: unknown;
      for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { ...init, signal: controller.signal });
          clearTimeout(timer);
          // Retry على 502/503/504 (مشاكل خادم مؤقتة)
          if (attempt < retries && (res.status === 502 || res.status === 503 || res.status === 504)) {
            console.warn(`[api] HTTP ${res.status} on ${url}, retrying (${attempt + 1}/${retries})`);
            await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
            continue;
          }
          return res;
        } catch (err) {
          clearTimeout(timer);
          lastErr = err;
          const msg = String((err as Error)?.message || err);
          const isTransient =
            msg.includes("EAI_AGAIN") ||
            msg.includes("ENOTFOUND") ||
            msg.includes("ECONNRESET") ||
            msg.includes("ETIMEDOUT") ||
            msg.includes("Network request failed") ||
            msg.includes("Failed to fetch") ||
            msg.includes("aborted");
          if (attempt >= retries || !isTransient) throw err;
          const backoff = 500 * 2 ** attempt; // 500ms, 1000ms
          console.warn(`[api] transient network error "${msg}" → retrying in ${backoff}ms (${attempt + 1}/${retries})`);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
      throw lastErr;
    },
    [],
  );

  const loadStoriesFromServer = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/stories`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "stories_fetch_failed");
      }

      const serverStories: Story[] = (data.stories || [])
        .map((raw: any) => ({
          id: String(raw.id),
          creatorId: String(raw.creatorId),
          mediaUrl: raw.mediaUrl || raw.imageUrl || "",
          mediaType: raw.mediaType === "video" ? "video" : "image",
          caption: raw.caption ?? raw.content ?? undefined,
          filter: raw.filter || "none",
          viewerIds: Array.isArray(raw.viewerIds) ? raw.viewerIds.map(String) : [],
          expiresAt: typeof raw.expiresAt === "number" ? raw.expiresAt : new Date(raw.expiresAt).getTime(),
          createdAt: typeof raw.createdAt === "number" ? raw.createdAt : new Date(raw.createdAt).getTime(),
          isCloseFriends: Boolean(raw.isCloseFriends),
          mentions: Array.isArray(raw.mentions) ? raw.mentions.map(String) : undefined,
          sharedPost: raw.sharedPost ?? undefined,
        }))
        .filter((story: Story) => story.expiresAt > Date.now());

      setStories(serverStories);
      await AsyncStorage.setItem("stories", JSON.stringify(serverStories));
      console.log("[stories] Loaded active stories from database", { count: serverStories.length });
    } catch (err) {
      console.error("[stories] Failed to load stories from database", err);
    }
  }, [API_BASE, apiFetch]);

  useEffect(() => {
    if (currentUser) {
      void loadStoriesFromServer();
    }
  }, [currentUser?.id, loadStoriesFromServer]);

  const sendEmailOTP = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase() }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error || "send_failed" };
        return { success: true };
      } catch {
        return { success: false, error: "network_error" };
      }
    },
    [API_BASE]
  );

  const resetPasswordWithOTP = useCallback(
    async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const verifyRes = await fetch(`${API_BASE}/api/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase(), otpCode: otp.trim() }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          return { success: false, error: verifyData.error || "wrong_otp" };
        }
        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return { success: false, error: "not_found" };
        const newPasswords = { ...passwords, [user.id]: newPassword };
        setPasswords(newPasswords);
        await AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
        return { success: true };
      } catch {
        return { success: false, error: "network_error" };
      }
    },
    [API_BASE, users, passwords]
  );

  const logout = useCallback(async () => {
    setCurrentUser(null);
    setStories([]);
    await AsyncStorage.multiRemove(["currentUser", "stories"]);
    setIsRoomMinimized(false);
    setMinimizedRoomId(null);
    setMinimizedRoomName("");
    setMinimizedRoomImage(undefined);
  }, []);

  const updateProfile = useCallback(
    async (name: string, bio?: string, avatar?: string, accountType?: AccountType, username?: string): Promise<{ success: boolean; error?: "username_taken" }> => {
      if (!currentUser) return { success: false };
      if (username !== undefined && username.trim() !== "" && username !== currentUser.username) {
        const taken = users.some(
          (u) => u.id !== currentUser.id && u.username && u.username.toLowerCase() === username.toLowerCase()
        );
        if (taken) return { success: false, error: "username_taken" };
      }
      const updated: User = {
        ...currentUser,
        name,
        ...(bio !== undefined ? { bio } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
        ...(accountType !== undefined ? { accountType } : {}),
        ...(username !== undefined ? { username: username.trim() } : {}),
      };
      setCurrentUser(updated);
      await AsyncStorage.setItem("currentUser", JSON.stringify(updated));
      const updatedUsers = users.map((u) => (u.id === updated.id ? updated : u));
      saveUsers(updatedUsers);
      const updatedRooms = rooms.map((r) => ({
        ...r,
        ownerName: r.ownerId === updated.id ? updated.name : r.ownerName,
        seatUsers: r.seatUsers.map((su) => (su?.id === updated.id ? updated : su)),
      }));
      saveRooms(updatedRooms);
      const updatedConversations = conversations.map((c) => ({
        ...c,
        participantUsers: c.participantUsers.map((pu) => (pu.id === updated.id ? updated : pu)),
      }));
      saveConversations(updatedConversations);
      const updatedComments = reelComments.map((c) =>
        c.userId === updated.id ? { ...c, userName: updated.name, userAvatar: updated.avatar } : c
      );
      saveComments(updatedComments);
      return { success: true };
    },
    [currentUser, users, rooms, conversations, reelComments]
  );

  const updateCoverPhoto = useCallback(
    async (coverUrl: string) => {
      if (!currentUser) return;
      const updated: User = { ...currentUser, coverUrl };
      setCurrentUser(updated);
      await AsyncStorage.setItem("currentUser", JSON.stringify(updated));
      const updatedUsers = users.map((u) => (u.id === updated.id ? updated : u));
      saveUsers(updatedUsers);
    },
    [currentUser, users]
  );

  const createRoom = useCallback(
    async (name: string, image?: string): Promise<Room | null> => {
      if (!currentUser) return null;
      const existingRoom = rooms.find((r) => r.ownerId === currentUser.id);
      if (existingRoom) return null;
      const roomCode = generateRoomCode();

      // API-first: wait for server to create the room and return the canonical ID.
      // The server will emit rooms_update + room:created to ALL clients so the
      // room list updates on every device without any local state manipulation.
      const serverRoom = await roomsApi.createRoom({
        name,
        image,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        roomCode,
        seats: Array(8).fill(null),
      });

      if (!serverRoom) {
        console.log("❌ [APP] createRoom — server returned null, room not created");
        return null;
      }

      console.log(`✅ [APP] createRoom — server confirmed roomId: ${serverRoom.id}`);

      // Build the local Room shape from the confirmed server response
      const confirmedRoom: Room = {
        id: serverRoom.id,
        roomCode: serverRoom.roomCode ?? roomCode,
        name: serverRoom.name,
        image: serverRoom.image ?? image,
        ownerId: serverRoom.ownerId,
        ownerName: serverRoom.ownerName ?? currentUser.name,
        seats: serverRoom.seats ?? Array(8).fill(null),
        seatUsers: Array(8).fill(null),
        lockedSeats: Array(8).fill(false),
        chat: [],
        bannedUsers: [],
        mutedUsers: [],
        isHidden: serverRoom.isHidden ?? false,
        createdAt: serverRoom.createdAt ?? Date.now(),
      };

      return confirmedRoom;
    },
    [currentUser, rooms]
  );

  const deleteRoom = useCallback(
    async (roomId: string) => {
      try { await fetch(`/api/rooms/${roomId}`, { method: "DELETE" }); } catch {}
      saveRooms(rooms.filter((r) => r.id !== roomId));
      if (minimizedRoomId === roomId) {
        setIsRoomMinimized(false);
        setMinimizedRoomId(null);
        setMinimizedRoomName("");
        setMinimizedRoomImage(undefined);
      }
    },
    [rooms, minimizedRoomId]
  );

  const joinRoomSeat = useCallback(
    (roomId: string, seatIndex: number) => {
      if (!currentUser) return;
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        if (r.bannedUsers.includes(currentUser.id)) return r;
        const lockedSeats = r.lockedSeats ?? Array(8).fill(false);
        if (lockedSeats[seatIndex]) return r;
        const seats = [...r.seats];
        const seatUsers = [...r.seatUsers];
        const existingSeat = seats.indexOf(currentUser.id);
        if (existingSeat !== -1) { seats[existingSeat] = null; seatUsers[existingSeat] = null; }
        if (seats[seatIndex] === null) { seats[seatIndex] = currentUser.id; seatUsers[seatIndex] = currentUser; }
        return { ...r, seats, seatUsers };
      });
      saveRooms(updated);
    },
    [currentUser, rooms]
  );

  const leaveRoomSeat = useCallback(
    (roomId: string) => {
      if (!currentUser) return;
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const seats = [...r.seats];
        const seatUsers = [...r.seatUsers];
        const idx = seats.indexOf(currentUser.id);
        if (idx !== -1) { seats[idx] = null; seatUsers[idx] = null; }
        return { ...r, seats, seatUsers, isHidden: false };
      });
      saveRooms(updated);
    },
    [currentUser, rooms]
  );

  const joinRoomPresence = useCallback(
    (roomId: string) => {
      if (!currentUser) return;
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        if (r.bannedUsers.includes(currentUser.id)) return r;
        const presentUserIds = [...(r.presentUserIds ?? [])];
        if (!presentUserIds.includes(currentUser.id)) presentUserIds.push(currentUser.id);
        const systemMsg: Message = {
          id: generateId(),
          senderId: "system",
          senderName: "system",
          content: `${currentUser.name} دخل الغرفة 🎤`,
          type: "system",
          timestamp: Date.now(),
        };
        return { ...r, presentUserIds, chat: [...r.chat.slice(-100), systemMsg] };
      });
      saveRooms(updated);
      // Sync to cloud + subscribe to room socket channel
      roomsApi.joinRoom(roomId, {
        userId: currentUser.id,
        userName: currentUser.name,
        userImage: currentUser.avatar,
        seatIndex: -1,
      }).catch(() => {});
      try { getSocket().emit("room:subscribe", roomId); } catch {}
    },
    [currentUser, rooms]
  );

  const leaveRoomPresence = useCallback(
    (roomId: string) => {
      if (!currentUser) return;
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const presentUserIds = (r.presentUserIds ?? []).filter((id) => id !== currentUser.id);
        return { ...r, presentUserIds };
      });
      saveRooms(updated);
      // Sync to cloud
      roomsApi.leaveRoom(roomId, currentUser.id).catch(() => {});
      try { getSocket().emit("room:unsubscribe", roomId); } catch {}
    },
    [currentUser, rooms]
  );

  const leaveRoomFull = useCallback(
    (roomId: string) => {
      if (!currentUser) return;
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const presentUserIds = (r.presentUserIds ?? []).filter((uid) => uid !== currentUser.id);
        const seats = [...r.seats];
        const seatUsers = [...r.seatUsers];
        const idx = seats.indexOf(currentUser.id);
        if (idx !== -1) { seats[idx] = null; seatUsers[idx] = null; }
        const systemMsg: Message = {
          id: generateId(),
          senderId: "system",
          senderName: "system",
          content: `${currentUser.name} غادر الغرفة 👋`,
          type: "system",
          timestamp: Date.now(),
        };
        return { ...r, seats, seatUsers, presentUserIds, isHidden: false, chat: [...r.chat.slice(-100), systemMsg] };
      });
      saveRooms(updated);
      // Sync to cloud
      roomsApi.leaveRoom(roomId, currentUser.id).catch(() => {});
      try { getSocket().emit("room:unsubscribe", roomId); } catch {}
    },
    [currentUser, rooms]
  );

  const sendRoomMessage = useCallback(
    (roomId: string, content: string, type: "text" | "image" | "video" | "gif" | "system" | "shared" = "text", mediaUrl?: string, replyToId?: string, replyToContent?: string, replyToSender?: string, sharedContent?: SharedContent) => {
      if (!currentUser) return;
      const msg: Message = {
        id: generateId(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        content,
        type,
        mediaUrl,
        timestamp: Date.now(),
        replyToId,
        replyToContent,
        replyToSender,
        sharedContent,
      };
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        return { ...r, chat: [...r.chat.slice(-100), msg] };
      });
      saveRooms(updated);
    },
    [currentUser, rooms]
  );

  const deleteRoomMessage = useCallback(
    (roomId: string, msgId: string) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        return { ...r, chat: r.chat.filter((m) => m.id !== msgId) };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const pinRoomMessage = useCallback(
    (roomId: string, msgId: string) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const chat = r.chat.map((m) => ({
          ...m,
          isPinned: m.id === msgId ? !m.isPinned : false,
        }));
        return { ...r, chat };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const editRoomMessage = useCallback(
    (roomId: string, msgId: string, newContent: string) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const chat = r.chat.map((m) =>
          m.id === msgId ? { ...m, content: newContent } : m
        );
        return { ...r, chat };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const addRoomReaction = useCallback(
    (roomId: string, msgId: string, emoji: string) => {
      if (!currentUser) return;
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const chat = r.chat.map((m) => {
          if (m.id !== msgId) return m;
          const reactions = { ...(m.reactions ?? {}) };
          const users = reactions[emoji] ?? [];
          if (users.includes(currentUser.id)) {
            reactions[emoji] = users.filter((uid) => uid !== currentUser.id);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...users, currentUser.id];
          }
          return { ...m, reactions };
        });
        return { ...r, chat };
      });
      saveRooms(updated);
    },
    [currentUser, rooms]
  );

  const muteUserInRoom = useCallback(
    (roomId: string, userId: string) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const already = (r.mutedUsers ?? []).includes(userId);
        const mutedUsers = already
          ? (r.mutedUsers ?? []).filter((id) => id !== userId)
          : [...(r.mutedUsers ?? []), userId];
        return { ...r, mutedUsers };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const kickFromRoom = useCallback(
    (roomId: string, userId: string) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const seats = r.seats.map((s) => (s === userId ? null : s));
        const seatUsers = r.seatUsers.map((s) => (s?.id === userId ? null : s));
        return { ...r, seats, seatUsers };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const banFromRoom = useCallback(
    (roomId: string, userId: string) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const seats = r.seats.map((s) => (s === userId ? null : s));
        const seatUsers = r.seatUsers.map((s) => (s?.id === userId ? null : s));
        const bannedUsers = [...r.bannedUsers, userId];
        return { ...r, seats, seatUsers, bannedUsers };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const updateRoomBackground = useCallback(
    (roomId: string, background: string) => {
      const updated = rooms.map((r) => r.id !== roomId ? r : { ...r, background });
      saveRooms(updated);
    },
    [rooms]
  );

  const setRoomAnnouncement = useCallback(
    (roomId: string, text: string) => {
      const updated = rooms.map((r) => r.id !== roomId ? r : { ...r, announcement: text });
      saveRooms(updated);
    },
    [rooms]
  );

  const lockSeat = useCallback(
    (roomId: string, seatIndex: number) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const lockedSeats = [...(r.lockedSeats ?? Array(8).fill(false))];
        lockedSeats[seatIndex] = true;
        const seats = [...r.seats];
        const seatUsers = [...r.seatUsers];
        if (seats[seatIndex]) { seats[seatIndex] = null; seatUsers[seatIndex] = null; }
        return { ...r, lockedSeats, seats, seatUsers };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const unlockSeat = useCallback(
    (roomId: string, seatIndex: number) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const lockedSeats = [...(r.lockedSeats ?? Array(8).fill(false))];
        lockedSeats[seatIndex] = false;
        return { ...r, lockedSeats };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const lockSeatsInRoom = useCallback(
    (roomId: string, lockedStates: boolean[]) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const lockedSeats = [...lockedStates];
        const seats = [...r.seats];
        const seatUsers = [...r.seatUsers];
        lockedStates.forEach((shouldLock, idx) => {
          if (shouldLock && seats[idx]) {
            seats[idx] = null;
            seatUsers[idx] = null;
          }
        });
        return { ...r, lockedSeats, seats, seatUsers };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const searchRoomByCode = useCallback(
    (code: string): Room | null => {
      return rooms.find((r) => r.roomCode === code.trim()) ?? null;
    },
    [rooms]
  );

  const shareRoomToDM = useCallback(
    (roomId: string, receiverId: string) => {
      if (!currentUser) return;
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      const convo = (() => {
        const existing = conversations.find(
          (c) => c.participants.includes(currentUser.id) && c.participants.includes(receiverId)
        );
        if (existing) return existing;
        const otherUser = users.find((u) => u.id === receiverId);
        const newConvo: Conversation = {
          id: generateId(),
          participants: [currentUser.id, receiverId],
          participantUsers: [currentUser, otherUser!].filter(Boolean),
          messages: [],
          updatedAt: Date.now(),
        };
        saveConversations([...conversations, newConvo]);
        return newConvo;
      })();
      const sharedContent: SharedContent = {
        id: roomId,
        type: "post",
        title: `🎙️ ${room.name} — كود الغرفة: ${room.roomCode}`,
        creatorName: room.ownerName,
      };
      const msg: PrivateMessage = {
        id: generateId(),
        senderId: currentUser.id,
        receiverId,
        content: `دعوة للانضمام لغرفة "${room.name}"`,
        type: "shared",
        timestamp: Date.now(),
        read: false,
        sharedContent,
      };
      const updatedConvos = conversations.map((c) => {
        if (c.id !== convo.id) return c;
        const msgs = c.messages || [];
        return { ...c, messages: [...msgs, msg], lastMessage: msg, updatedAt: Date.now() };
      });
      const found = updatedConvos.find((c) => c.id === convo.id);
      if (!found) saveConversations([...updatedConvos, { ...convo, messages: [msg], lastMessage: msg }]);
      else saveConversations(updatedConvos);
    },
    [currentUser, rooms, conversations, users]
  );

  const getConversation = useCallback(
    (otherUserId: string): Conversation => {
      if (!currentUser) throw new Error("Not authenticated");
      const existing = conversations.find(
        (c) => c.participants.includes(currentUser.id) && c.participants.includes(otherUserId)
      );
      if (existing) return existing;
      const otherUser = users.find((u) => u.id === otherUserId);
      const newConvo: Conversation = {
        id: generateId(),
        participants: [currentUser.id, otherUserId],
        participantUsers: [currentUser, otherUser!].filter(Boolean),
        messages: [],
        updatedAt: Date.now(),
      };
      saveConversations([...conversations, newConvo]);
      return newConvo;
    },
    [currentUser, conversations, users]
  );

  const injectCallLog = useCallback(
    (conversationId: string, otherUserId: string, content: string) => {
      const msg: PrivateMessage = {
        id: generateId(),
        senderId: "system",
        receiverId: otherUserId,
        content,
        type: "system",
        timestamp: Date.now(),
        read: true,
      };
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = c.messages || [];
        return { ...c, messages: [...msgs, msg], lastMessage: msg, updatedAt: Date.now() };
      });
      saveConversations(updated);
    },
    [conversations],
  );

  const sendPrivateMessage = useCallback(
    (
      conversationId: string,
      receiverId: string,
      content: string,
      type: "text" | "image" | "video" | "audio" | "shared" | "location" | "system" = "text",
      mediaUrl?: string,
      duration?: number,
      sharedContent?: SharedContent,
      storyRef?: string,
      replyToId?: string,
      location?: MessageLocation
    ) => {
      if (!currentUser) return;
      const msg: PrivateMessage = {
        id: generateId(),
        senderId: currentUser.id,
        receiverId,
        content,
        mediaUrl,
        type,
        duration,
        timestamp: Date.now(),
        read: false,
        sharedContent,
        storyRef,
        replyToId,
        location,
      };

      let updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = c.messages || [];
        return { ...c, messages: [...msgs, msg], lastMessage: msg, updatedAt: Date.now() };
      });

      // If conversation wasn't found (new), add it
      const found = updated.find((c) => c.id === conversationId);
      if (!found) {
        const otherUser = users.find((u) => u.id === receiverId);
        const newConvo: Conversation = {
          id: conversationId,
          participants: [currentUser.id, receiverId],
          participantUsers: [currentUser, otherUser!].filter(Boolean),
          messages: [msg],
          lastMessage: msg,
          updatedAt: Date.now(),
        };
        updated = [...conversations, newConvo];
      }
      saveConversations(updated);

      // ── Sync to cloud via API (fire-and-forget) ───────────────────────────
      // findOrCreate a cloud chat, then persist the message
      ;(async () => {
        try {
          const chat = await messagesApi.findOrCreateChat(currentUser.id, receiverId);
          if (chat) {
            await messagesApi.sendMessage(chat.id, {
              senderId: currentUser.id,
              receiverId,
              content,
              type: type as string,
              mediaUrl,
            });
          }
        } catch {}
      })();

      // ── Broadcast over Socket so the receiver's device updates in real-time ─
      try {
        getSocket().emit("private-message", {
          conversationId,
          receiverId,
          message: {
            id: msg.id,
            senderId: msg.senderId,
            senderName: currentUser.name,
            content,
            type,
            mediaUrl,
            timestamp: msg.timestamp,
            read: false,
          },
        });
      } catch {}
    },
    [currentUser, conversations, users]
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string, forBoth: boolean) => {
      if (!currentUser) return;
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = (c.messages || []).map((m) => {
          if (m.id !== messageId) return m;
          if (forBoth) {
            return { ...m, deletedFor: [...(m.deletedFor || []), "ALL"] };
          }
          return { ...m, deletedFor: [...(m.deletedFor || []), currentUser.id] };
        });
        const lastMsg = [...msgs].reverse().find((m) => {
          if (forBoth) return !(m.deletedFor?.includes("ALL"));
          return !(m.deletedFor?.includes(currentUser.id));
        });
        return { ...c, messages: msgs, lastMessage: lastMsg, updatedAt: Date.now() };
      });
      saveConversations(updated);
    },
    [currentUser, conversations]
  );

  const pinMessage = useCallback(
    (conversationId: string, messageId: string) => {
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = (c.messages || []).map((m) => {
          if (m.id === messageId) return { ...m, isPinned: !m.isPinned };
          return { ...m, isPinned: false };
        });
        return { ...c, messages: msgs };
      });
      saveConversations(updated);
    },
    [conversations]
  );

  const addReaction = useCallback(
    (conversationId: string, messageId: string, emoji: string) => {
      if (!currentUser) return;
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = (c.messages || []).map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          const users = reactions[emoji] || [];
          if (users.includes(currentUser.id)) {
            const filtered = users.filter((id) => id !== currentUser.id);
            if (filtered.length === 0) {
              delete reactions[emoji];
            } else {
              reactions[emoji] = filtered;
            }
          } else {
            Object.keys(reactions).forEach((e) => {
              reactions[e] = reactions[e].filter((id) => id !== currentUser.id);
              if (reactions[e].length === 0) delete reactions[e];
            });
            reactions[emoji] = [...(reactions[emoji] || []), currentUser.id];
          }
          return { ...m, reactions };
        });
        return { ...c, messages: msgs };
      });
      saveConversations(updated);
    },
    [currentUser, conversations]
  );

  const blockUser = useCallback(
    (userId: string) => {
      const newBlocked = [...blockedUsers, userId];
      setBlockedUsers(newBlocked);
      AsyncStorage.setItem("blockedUsers", JSON.stringify(newBlocked));
    },
    [blockedUsers]
  );

  const unblockUser = useCallback(
    (userId: string) => {
      const newBlocked = blockedUsers.filter((id) => id !== userId);
      setBlockedUsers(newBlocked);
      AsyncStorage.setItem("blockedUsers", JSON.stringify(newBlocked));
    },
    [blockedUsers]
  );

  const isBlocked = useCallback(
    (userId: string) => blockedUsers.includes(userId),
    [blockedUsers]
  );

  const deleteConversation = useCallback(
    (conversationId: string) => {
      saveConversations(conversations.filter((c) => c.id !== conversationId));
    },
    [conversations]
  );

  const markConversationRead = useCallback(
    (conversationId: string) => {
      if (!currentUser) return;
      let changed = false;
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = (c.messages || []).map((m) => {
          if (m.receiverId === currentUser.id && !m.read) {
            changed = true;
            return { ...m, read: true };
          }
          return m;
        });
        const lastMessage = c.lastMessage && c.lastMessage.receiverId === currentUser.id && !c.lastMessage.read
          ? { ...c.lastMessage, read: true }
          : c.lastMessage;
        return { ...c, messages: msgs, lastMessage };
      });
      if (changed) saveConversations(updated);
    },
    [currentUser, conversations]
  );

  const archiveConversation = useCallback(
    (conversationId: string) => {
      const updated = conversations.map((c) =>
        c.id === conversationId ? { ...c, archived: true } : c
      );
      saveConversations(updated);
    },
    [conversations]
  );

  const unarchiveConversation = useCallback(
    (conversationId: string) => {
      const updated = conversations.map((c) =>
        c.id === conversationId ? { ...c, archived: false } : c
      );
      saveConversations(updated);
    },
    [conversations]
  );

  const setConversationTheme = useCallback(
    (conversationId: string, themeColor?: string, wallpaper?: string) => {
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const next: Conversation = { ...c };
        if (themeColor !== undefined) next.themeColor = themeColor;
        if (wallpaper !== undefined) next.wallpaper = wallpaper;
        return next;
      });
      saveConversations(updated);
    },
    [conversations]
  );

  const setGovernorateImage = useCallback(
    (name: string, image: string) => {
      const existing = governorateImages.find((g) => g.name === name);
      let updated: GovernorateImage[];
      if (existing) {
        updated = governorateImages.map((g) => g.name === name ? { ...g, image } : g);
      } else {
        updated = [...governorateImages, { name, image }];
      }
      saveGovernorateImagesData(updated);
    },
    [governorateImages]
  );

  const createOwnerAccount = useCallback(
    async (name: string, email: string, governorate: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: "email_exists" };
      }
      const newUser: User = {
        id: generateId(),
        name,
        username: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, ""),
        email,
        primaryGovernorate: governorate,
        accountType: "public",
        role: "MERCHANT_OWNER",
        isActive: true,
        createdAt: Date.now(),
      };
      const newUsers = [...users, newUser];
      saveUsers(newUsers);
      const newPasswords = { ...passwords, [newUser.id]: password };
      setPasswords(newPasswords);
      await AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
      return { success: true };
    },
    [users, passwords]
  );

  const setOwnerActive = useCallback(
    (userId: string, isActive: boolean) => {
      saveUsers(users.map((u) => (u.id === userId ? { ...u, isActive } : u)));
      if (currentUser && currentUser.id === userId) {
        const updated = { ...currentUser, isActive };
        setCurrentUser(updated);
        AsyncStorage.setItem("currentUser", JSON.stringify(updated));
      }
    },
    [users, currentUser]
  );

  const addToCart = useCallback((item: CommerceCartItem, merchantName: string) => {
    setCart((prev) => {
      if (prev && prev.merchantId !== item.merchantId) {
        const updated: CommerceCart = { merchantId: item.merchantId, merchantName, items: [item] };
        AsyncStorage.setItem("cart", JSON.stringify(updated));
        return updated;
      }
      const existing = prev?.items.find((i) => i.productId === item.productId);
      const newItems = existing
        ? prev!.items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i)
        : [...(prev?.items ?? []), item];
      const updated: CommerceCart = { merchantId: item.merchantId, merchantName, items: newItems };
      AsyncStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      if (!prev) return null;
      const newItems = prev.items.filter((i) => i.productId !== productId);
      const updated = newItems.length > 0 ? { ...prev, items: newItems } : null;
      AsyncStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart(null);
    AsyncStorage.setItem("cart", JSON.stringify(null));
  }, []);

  const placeOrder = useCallback(async (
    paymentMethod: PaymentMethod, address?: string, notes?: string
  ): Promise<Order | null> => {
    if (!currentUser || !cart) return null;
    const merchant = merchants.find((m) => m.id === cart.merchantId);
    if (!merchant) return null;
    const items: OrderItem[] = cart.items.map((ci) => ({
      productId: ci.productId,
      productName: ci.productName,
      productPrice: ci.productPrice,
      quantity: ci.quantity,
      selectedVariations: ci.selectedVariations,
    }));
    const totalIQD = items.reduce((sum, i) => sum + i.productPrice * i.quantity, 0);
    const commRate = (merchant.commissionRate != null ? merchant.commissionRate : getCommissionTier(merchant.monthlySales)) / 100;
    const affiliateRec = items.length > 0 ? affiliateLinks.find((a) => a.productId === items[0].productId) ?? null : null;
    const affiliateCut = affiliateRec ? totalIQD * 0.05 : 0;
    const commissionAmount = totalIQD * commRate;
    const platformCut = commissionAmount - affiliateCut;
    const newOrder: Order = {
      id: generateId(), customerId: currentUser.id, merchantId: merchant.id, items,
      status: "pending", paymentMethod, totalIQD, commissionAmount, affiliateCut, platformCut,
      affiliateUserId: affiliateRec?.influencerId,
      createdAt: Date.now(), updatedAt: Date.now(), address, notes,
    };
    saveOrders([...orders, newOrder]);
    const updatedSales = merchant.monthlySales + items.reduce((sum, i) => sum + i.quantity, 0);
    const newTier: CommerceTier = updatedSales >= 500 ? "gold" : updatedSales > 100 ? "silver" : "bronze";
    saveMerchants(merchants.map((m) => m.id === merchant.id ? { ...m, monthlySales: updatedSales, tier: newTier, monthlyDues: (m.monthlyDues ?? 0) + commissionAmount } : m));
    setCart(null);
    AsyncStorage.setItem("cart", JSON.stringify(null));
    return newOrder;
  }, [currentUser, cart, merchants, orders, getCommissionTier, affiliateLinks]);

  const banUser = useCallback(
    (userId: string) => { saveUsers(users.map((u) => (u.id === userId ? { ...u, isBanned: true } : u))); },
    [users]
  );

  const unbanUser = useCallback(
    (userId: string) => { saveUsers(users.map((u) => (u.id === userId ? { ...u, isBanned: false } : u))); },
    [users]
  );

  const resetUserPassword = useCallback(
    (userId: string, newPassword: string) => {
      const newPasswords = { ...passwords, [userId]: newPassword };
      setPasswords(newPasswords);
      AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
    },
    [passwords]
  );

  const verifyUser = useCallback(
    (userId: string, months: number) => {
      const ms = months * 30 * 24 * 60 * 60 * 1000;
      saveUsers(users.map((u) => (u.id === userId ? { ...u, verifiedUntil: Date.now() + ms } : u)));
    },
    [users]
  );

  const revokeVerification = useCallback(
    (userId: string) => {
      saveUsers(users.map((u) => (u.id === userId ? { ...u, verifiedUntil: undefined } : u)));
    },
    [users]
  );

  const addReel = useCallback(
    (videoUrl: string, title: string, filter: ReelFilter, tags?: string[], linkedProductIds?: string[]) => {
      if (!currentUser) return;
      const reel: Reel = { id: generateId(), videoUrl, title, creatorId: currentUser.id, filter, tags: tags ?? [], linkedProductIds: linkedProductIds ?? [], createdAt: Date.now() };
      saveReels([reel, ...reels]);
      const myFollowers = follows.filter((f) => f.followingId === currentUser.id && f.status === "accepted");
      const newNotifs: AppNotification[] = myFollowers.map((f) => ({
        id: generateId(),
        recipientId: f.followerId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        type: "post" as const,
        referenceId: reel.id,
        message: `${currentUser.name} نشر مقطعاً جديداً`,
        isRead: false,
        createdAt: Date.now(),
      }));
      if (newNotifs.length > 0) saveNotifications([...newNotifs, ...notifications]);
    },
    [currentUser, reels, follows, notifications]
  );

  const deleteReel = useCallback(
    (reelId: string) => {
      saveReels(reels.filter((r) => r.id !== reelId));
      saveLikes(reelLikes.filter((l) => l.reelId !== reelId));
      saveComments(reelComments.filter((c) => c.reelId !== reelId));
    },
    [reels, reelLikes, reelComments]
  );

  const likeReel = useCallback(
    (reelId: string) => {
      if (!currentUser) return;
      const alreadyLiked = reelLikes.some((l) => l.reelId === reelId && l.userId === currentUser.id);
      if (alreadyLiked) {
        saveLikes(reelLikes.filter((l) => !(l.reelId === reelId && l.userId === currentUser.id)));
      } else {
        saveLikes([...reelLikes, { reelId, userId: currentUser.id }]);
      }
    },
    [currentUser, reelLikes]
  );

  const isReelLiked = useCallback(
    (reelId: string) => {
      if (!currentUser) return false;
      return reelLikes.some((l) => l.reelId === reelId && l.userId === currentUser.id);
    },
    [currentUser, reelLikes]
  );

  const getReelLikesCount = useCallback(
    (reelId: string) => reelLikes.filter((l) => l.reelId === reelId).length,
    [reelLikes]
  );

  const addReelComment = useCallback(
    (reelId: string, content: string) => {
      if (!currentUser || !content.trim()) return;
      const comment: ReelComment = {
        id: generateId(),
        reelId,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: content.trim(),
        likedBy: [],
        isPinned: false,
        createdAt: Date.now(),
      };
      saveComments([...reelComments, comment]);
      const reel = reels.find((r) => r.id === reelId);
      const mentionedUsers = parseMentions(content.trim(), users);
      const mentionNotifs: AppNotification[] = mentionedUsers
        .filter((u) => u.id !== currentUser.id)
        .map((u) => ({
          id: generateId(),
          recipientId: u.id,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          type: "mention" as const,
          referenceId: reelId,
          message: `${currentUser.name} ذكرك في تعليق على مقطع`,
          isRead: false,
          createdAt: Date.now(),
        }));
      if (mentionNotifs.length > 0) saveNotifications([...mentionNotifs, ...notifications]);
    },
    [currentUser, reelComments, reels, users, notifications]
  );

  const getReelComments = useCallback(
    (reelId: string) => {
      const all = reelComments.filter((c) => c.reelId === reelId);
      return all.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.likedBy.length - a.likedBy.length || a.createdAt - b.createdAt;
      });
    },
    [reelComments]
  );

  const deleteReelComment = useCallback(
    (commentId: string) => {
      saveComments(reelComments.filter((c) => c.id !== commentId));
    },
    [reelComments]
  );

  const likeReelComment = useCallback(
    (commentId: string) => {
      if (!currentUser) return;
      const updated = reelComments.map((c) => {
        if (c.id !== commentId) return c;
        const liked = c.likedBy.includes(currentUser.id);
        return {
          ...c,
          likedBy: liked
            ? c.likedBy.filter((id) => id !== currentUser.id)
            : [...c.likedBy, currentUser.id],
        };
      });
      saveComments(updated);
    },
    [currentUser, reelComments]
  );

  const isReelCommentLiked = useCallback(
    (commentId: string) => {
      if (!currentUser) return false;
      const comment = reelComments.find((c) => c.id === commentId);
      return comment ? comment.likedBy.includes(currentUser.id) : false;
    },
    [currentUser, reelComments]
  );

  const pinReelComment = useCallback(
    (commentId: string) => {
      const updated = reelComments.map((c) => {
        if (c.id !== commentId) return { ...c, isPinned: false };
        return { ...c, isPinned: !c.isPinned };
      });
      saveComments(updated);
    },
    [reelComments]
  );

  const getReelCommentLikers = useCallback(
    (commentId: string): User[] => {
      const comment = reelComments.find((c) => c.id === commentId);
      if (!comment) return [];
      return users.filter((u) => comment.likedBy.includes(u.id));
    },
    [reelComments, users]
  );

  const getPostCommentLikers = useCallback(
    (commentId: string): User[] => {
      const comment = postComments.find((c) => c.id === commentId);
      if (!comment) return [];
      return users.filter((u) => comment.likedBy.includes(u.id));
    },
    [postComments, users]
  );

  // ─── Share reel as rich content ───
  const shareReelToConversation = useCallback(
    (reelId: string, receiverId: string) => {
      if (!currentUser) return;
      const convo = (() => {
        const existing = conversations.find(
          (c) => c.participants.includes(currentUser.id) && c.participants.includes(receiverId)
        );
        if (existing) return existing;
        const otherUser = users.find((u) => u.id === receiverId);
        const newConvo: Conversation = {
          id: generateId(),
          participants: [currentUser.id, receiverId],
          participantUsers: [currentUser, otherUser!].filter(Boolean),
          messages: [],
          updatedAt: Date.now(),
        };
        saveConversations([...conversations, newConvo]);
        return newConvo;
      })();
      const reel = reels.find((r) => r.id === reelId);
      const sharedContent: SharedContent = {
        id: reelId,
        type: "reel",
        title: reel?.title || "مقطع فيديو",
        mediaUrl: reel?.videoUrl,
        creatorName: users.find((u) => u.id === reel?.creatorId)?.name,
      };
      const msg: PrivateMessage = {
        id: generateId(),
        senderId: currentUser.id,
        receiverId,
        content: "",
        type: "shared",
        timestamp: Date.now(),
        read: false,
        sharedContent,
      };
      const updated = conversations.map((c) => {
        if (c.id !== convo.id) return c;
        const msgs = c.messages || [];
        return { ...c, messages: [...msgs, msg], lastMessage: msg, updatedAt: Date.now() };
      });
      const alreadyInList = updated.find((c) => c.id === convo.id);
      if (!alreadyInList) {
        saveConversations([...updated, { ...convo, messages: [msg], lastMessage: msg, updatedAt: Date.now() }]);
      } else {
        saveConversations(updated);
      }
    },
    [currentUser, conversations, reels, users]
  );

  // ─── Share post as rich content in DM ───
  const sharePostToDM = useCallback(
    (postId: string, receiverId: string) => {
      if (!currentUser) return;
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const convo = (() => {
        const existing = conversations.find(
          (c) => c.participants.includes(currentUser.id) && c.participants.includes(receiverId)
        );
        if (existing) return existing;
        const otherUser = users.find((u) => u.id === receiverId);
        const newConvo: Conversation = {
          id: generateId(),
          participants: [currentUser.id, receiverId],
          participantUsers: [currentUser, otherUser!].filter(Boolean),
          messages: [],
          updatedAt: Date.now(),
        };
        saveConversations([...conversations, newConvo]);
        return newConvo;
      })();
      const sharedContent: SharedContent = {
        id: postId,
        type: "post",
        title: post.content || "منشور",
        mediaUrl: post.mediaUrl,
        creatorName: users.find((u) => u.id === post.creatorId)?.name,
      };
      const msg: PrivateMessage = {
        id: generateId(),
        senderId: currentUser.id,
        receiverId,
        content: "",
        type: "shared",
        timestamp: Date.now(),
        read: false,
        sharedContent,
      };
      const updated = conversations.map((c) => {
        if (c.id !== convo.id) return c;
        const msgs = c.messages || [];
        return { ...c, messages: [...msgs, msg], lastMessage: msg, updatedAt: Date.now() };
      });
      const alreadyInList = updated.find((c) => c.id === convo.id);
      if (!alreadyInList) {
        saveConversations([...updated, { ...convo, messages: [msg], lastMessage: msg, updatedAt: Date.now() }]);
      } else {
        saveConversations(updated);
      }
    },
    [currentUser, posts, conversations, users]
  );

  // ─── Share story in DM ───
  const shareStoryToDM = useCallback(
    (storyId: string, receiverId: string) => {
      if (!currentUser) return;
      const story = stories.find((s) => s.id === storyId);
      if (!story) return;
      const convo = (() => {
        const existing = conversations.find(
          (c) => c.participants.includes(currentUser.id) && c.participants.includes(receiverId)
        );
        if (existing) return existing;
        const otherUser = users.find((u) => u.id === receiverId);
        const newConvo: Conversation = {
          id: generateId(),
          participants: [currentUser.id, receiverId],
          participantUsers: [currentUser, otherUser!].filter(Boolean),
          messages: [],
          updatedAt: Date.now(),
        };
        saveConversations([...conversations, newConvo]);
        return newConvo;
      })();
      const sharedContent: SharedContent = {
        id: storyId,
        type: "story",
        title: story.caption || "قصة",
        mediaUrl: story.mediaUrl,
        creatorName: users.find((u) => u.id === story.creatorId)?.name,
      };
      const msg: PrivateMessage = {
        id: generateId(),
        senderId: currentUser.id,
        receiverId,
        content: "",
        type: "shared",
        timestamp: Date.now(),
        read: false,
        sharedContent,
      };
      const updated = conversations.map((c) => {
        if (c.id !== convo.id) return c;
        const msgs = c.messages || [];
        return { ...c, messages: [...msgs, msg], lastMessage: msg, updatedAt: Date.now() };
      });
      const alreadyInList = updated.find((c) => c.id === convo.id);
      if (!alreadyInList) {
        saveConversations([...updated, { ...convo, messages: [msg], lastMessage: msg, updatedAt: Date.now() }]);
      } else {
        saveConversations(updated);
      }
    },
    [currentUser, stories, conversations, users]
  );

  const searchUsers = useCallback(
    (query: string): User[] => {
      if (!query.trim()) return [];
      const q = query.trim().toLowerCase();
      // Kick off async API search to refresh local cache
      usersApi.search(query).then((remoteUsers) => {
        if (!remoteUsers?.length) return;
        setUsers((prev) => {
          const byId = new Map(prev.map((u) => [u.id, u]));
          remoteUsers.forEach((ru: any) => {
            if (!byId.has(ru.id)) {
              byId.set(ru.id, serverUserToLocal(ru) as User);
            }
          });
          const next = Array.from(byId.values());
          AsyncStorage.setItem("users", JSON.stringify(next));
          return next;
        });
      }).catch(() => {});
      return users.filter(
        (u) =>
          u.id !== currentUser?.id &&
          (u.name.toLowerCase().includes(q) ||
            (u.username && u.username.toLowerCase().includes(q)) ||
            u.email.toLowerCase().includes(q))
      );
    },
    [users, currentUser]
  );

  // ============================
  // POSTS
  // ============================
  const addPost = useCallback(
    (content?: string, mediaUrl?: string, mediaType: "none" | "image" | "video" = "none", filter: PostFilter = "none", mediaUrls?: string[]) => {
      if (!currentUser) return;
      const post: Post = {
        id: generateId(),
        creatorId: currentUser.id,
        content,
        mediaUrl: mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : mediaUrl,
        mediaUrls: mediaUrls && mediaUrls.length > 0 ? mediaUrls : undefined,
        mediaType,
        filter,
        isHidden: false,
        createdAt: Date.now(),
      };
      savePosts([post, ...posts]);
      const myFollowers = follows.filter((f) => f.followingId === currentUser.id && f.status === "accepted");
      const newNotifs: AppNotification[] = myFollowers.map((f) => ({
        id: generateId(),
        recipientId: f.followerId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        type: "post" as const,
        referenceId: post.id,
        message: `${currentUser.name} نشر منشوراً جديداً`,
        isRead: false,
        createdAt: Date.now(),
      }));
      if (newNotifs.length > 0) saveNotifications([...newNotifs, ...notifications]);
    },
    [currentUser, posts, follows, notifications]
  );

  const deletePost = useCallback(
    (postId: string) => {
      savePosts(posts.filter((p) => p.id !== postId));
      savePostLikes(postLikes.filter((l) => l.postId !== postId));
      savePostComments(postComments.filter((c) => c.postId !== postId));
    },
    [posts, postLikes, postComments]
  );

  const hidePost = useCallback(
    (postId: string) => {
      savePosts(posts.map((p) => p.id === postId ? { ...p, isHidden: !p.isHidden } : p));
    },
    [posts]
  );

  const likePost = useCallback(
    (postId: string) => {
      if (!currentUser) return;
      const alreadyLiked = postLikes.some((l) => l.postId === postId && l.userId === currentUser.id);
      if (alreadyLiked) {
        savePostLikes(postLikes.filter((l) => !(l.postId === postId && l.userId === currentUser.id)));
      } else {
        savePostLikes([...postLikes, { postId, userId: currentUser.id }]);
        const post = posts.find((p) => p.id === postId);
        if (post && post.creatorId !== currentUser.id) {
          const notif: AppNotification = {
            id: generateId(),
            recipientId: post.creatorId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            type: "like",
            referenceId: postId,
            message: `${currentUser.name} أعجب بمنشورك`,
            isRead: false,
            createdAt: Date.now(),
          };
          saveNotifications([notif, ...notifications]);
        }
      }
    },
    [currentUser, postLikes, posts, notifications]
  );

  const isPostLiked = useCallback(
    (postId: string) => {
      if (!currentUser) return false;
      return postLikes.some((l) => l.postId === postId && l.userId === currentUser.id);
    },
    [currentUser, postLikes]
  );

  const getPostLikesCount = useCallback(
    (postId: string) => postLikes.filter((l) => l.postId === postId).length,
    [postLikes]
  );

  const addPostComment = useCallback(
    (postId: string, content: string) => {
      if (!currentUser || !content.trim()) return;
      const comment: PostComment = {
        id: generateId(),
        postId,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: content.trim(),
        likedBy: [],
        isPinned: false,
        createdAt: Date.now(),
      };
      savePostComments([...postComments, comment]);
      const post = posts.find((p) => p.id === postId);
      const newNotifs: AppNotification[] = [];
      if (post && post.creatorId !== currentUser.id) {
        newNotifs.push({
          id: generateId(),
          recipientId: post.creatorId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          type: "comment",
          referenceId: postId,
          message: `${currentUser.name} علّق على منشورك`,
          isRead: false,
          createdAt: Date.now(),
        });
      }
      const mentionedUsers = parseMentions(content.trim(), users);
      mentionedUsers
        .filter((u) => u.id !== currentUser.id && u.id !== post?.creatorId)
        .forEach((u) => {
          newNotifs.push({
            id: generateId(),
            recipientId: u.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            type: "mention",
            referenceId: postId,
            message: `${currentUser.name} ذكرك في تعليق`,
            isRead: false,
            createdAt: Date.now(),
          });
        });
      if (newNotifs.length > 0) saveNotifications([...newNotifs, ...notifications]);
    },
    [currentUser, postComments, posts, notifications, users]
  );

  const deletePostComment = useCallback(
    (commentId: string) => {
      savePostComments(postComments.filter((c) => c.id !== commentId));
    },
    [postComments]
  );

  const likePostComment = useCallback(
    (commentId: string) => {
      if (!currentUser) return;
      const updated = postComments.map((c) => {
        if (c.id !== commentId) return c;
        const liked = c.likedBy.includes(currentUser.id);
        return {
          ...c,
          likedBy: liked
            ? c.likedBy.filter((id) => id !== currentUser.id)
            : [...c.likedBy, currentUser.id],
        };
      });
      savePostComments(updated);
    },
    [currentUser, postComments]
  );

  const isPostCommentLiked = useCallback(
    (commentId: string) => {
      if (!currentUser) return false;
      const comment = postComments.find((c) => c.id === commentId);
      return comment ? comment.likedBy.includes(currentUser.id) : false;
    },
    [currentUser, postComments]
  );

  const pinPostComment = useCallback(
    (commentId: string) => {
      const updated = postComments.map((c) => {
        if (c.id !== commentId) return { ...c, isPinned: false };
        return { ...c, isPinned: !c.isPinned };
      });
      savePostComments(updated);
    },
    [postComments]
  );

  const getPostComments = useCallback(
    (postId: string) => {
      const all = postComments.filter((c) => c.postId === postId);
      return all.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.likedBy.length - a.likedBy.length || a.createdAt - b.createdAt;
      });
    },
    [postComments]
  );

  // ============================
  // MEDIA UPLOAD (PostgreSQL temporary storage)
  // ============================
  const uploadMediaToServer = useCallback(
    async (localUri: string, mimeType = "image/jpeg"): Promise<string> => {
      try {
        // If already an http/https URL, no upload needed
        if (localUri.startsWith("http://") || localUri.startsWith("https://")) {
          return localUri;
        }

        let base64Data: string;

        if (localUri.startsWith("data:")) {
          // Already a data URI — extract the base64 part
          base64Data = localUri.split(",")[1] || localUri;
          const match = localUri.match(/data:([^;]+);base64,/);
          if (match) mimeType = match[1];
        } else {
          // Local file URI — fetch and convert to base64
          const response = await fetch(localUri);
          const blob = await response.blob();
          mimeType = blob.type || mimeType;
          base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1] || "");
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        const res = await apiFetch(`${API_BASE}/api/media/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileData: base64Data, mimeType }),
        });

        if (!res.ok) {
          console.warn("[media] Upload failed, using original URI as fallback");
          return localUri;
        }

        const data = await res.json();
        return `${API_BASE}${data.url}`;
      } catch (err) {
        console.warn("[media] Upload error, using original URI:", err);
        return localUri;
      }
    },
    [API_BASE, apiFetch],
  );

  // ============================
  // STORIES
  // ============================
  const addStory = useCallback(
    async (mediaUrl: string, mediaType: "image" | "video", caption?: string, filter = "none", isCloseFriends = false, mentions: string[] = [], sharedPost?: StorySharedPost, overlays: { text: string }[] = []) => {
      if (!currentUser) return;
      let story: Story;

      // Upload local/base64 media to server so other devices can load it
      let finalMediaUrl = mediaUrl;
      if (mediaUrl && !mediaUrl.startsWith("http")) {
        try {
          const mimeType = mediaType === "video" ? "video/mp4" : "image/jpeg";
          finalMediaUrl = await uploadMediaToServer(mediaUrl, mimeType);
          console.log("[stories] Media uploaded to server:", finalMediaUrl);
        } catch (err) {
          console.warn("[stories] Media upload failed, proceeding with original URI:", err);
        }
      }

      try {
        const res = await apiFetch(`${API_BASE}/api/stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorId: currentUser.id,
            imageUrl: finalMediaUrl,
            content: caption,
            mediaType,
            filter,
            isCloseFriends,
            mentions: Array.isArray(mentions) ? mentions : [],
            sharedPost: sharedPost ?? null,
            overlays: Array.isArray(overlays) ? overlays : [],
          }),
        });
        const rawText = await res.text();
        let data: any = {};
        try { data = JSON.parse(rawText); } catch { /* non-json */ }
        if (!res.ok) {
          console.error("[stories] HTTP error", res.status, rawText);
          const msg = data?.message || data?.detail || data?.error || `status_${res.status}`;
          throw new Error(msg);
        }
        console.log("[stories] Database insertion result", data.story);
        const raw = data.story;
        story = {
          id: String(raw.id),
          creatorId: String(raw.creatorId),
          mediaUrl: raw.mediaUrl || raw.imageUrl || mediaUrl,
          mediaType: raw.mediaType === "video" ? "video" : "image",
          caption: raw.caption ?? raw.content ?? caption,
          filter: raw.filter || filter,
          viewerIds: Array.isArray(raw.viewerIds) ? raw.viewerIds.map(String) : [],
          expiresAt: typeof raw.expiresAt === "number" ? raw.expiresAt : new Date(raw.expiresAt).getTime(),
          createdAt: typeof raw.createdAt === "number" ? raw.createdAt : new Date(raw.createdAt).getTime(),
          isCloseFriends: Boolean(raw.isCloseFriends),
          mentions: Array.isArray(raw.mentions) && raw.mentions.length > 0 ? raw.mentions.map(String) : undefined,
          sharedPost: raw.sharedPost ?? sharedPost,
          overlays: Array.isArray(raw.overlays) ? raw.overlays : overlays,
        };
        if (story.expiresAt <= Date.now()) {
          throw new Error("story_expiration_invalid");
        }
        saveStories([story, ...stories.filter((s) => s.id !== story.id)]);
      } catch (err) {
        console.error("[stories] Failed to insert story into database", err);
        throw err;
      }
      const storyNotifications: AppNotification[] = [];
      // Notify mentioned users parsed from the story caption
      mentions.forEach((mentionedId) => {
        const mentionedUser = users.find((u) => u.id === mentionedId);
        if (!mentionedUser || mentionedId === currentUser.id) return;
        storyNotifications.push({
          id: generateId(),
          recipientId: mentionedId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          type: "story_mention",
          referenceId: story.id,
          message: `ذكرك ${currentUser.name} في قصته`,
          isRead: false,
          createdAt: Date.now(),
        });
      });
      // Notify content creator when sharing their post/reel to story
      if (sharedPost && sharedPost.creatorId && sharedPost.creatorId !== currentUser.id) {
        const contentLabel = sharedPost.type === "story" ? "قصتك" : sharedPost.type === "reel" ? "مقطعك" : "منشورك";
        storyNotifications.push({
          id: generateId(),
          recipientId: sharedPost.creatorId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          type: "story",
          referenceId: sharedPost.id,
          message: `قام ${currentUser.name} بمشاركة ${contentLabel} في قصته`,
          isRead: false,
          createdAt: Date.now(),
        });
      }
      if (storyNotifications.length > 0) saveNotifications([...storyNotifications, ...notifications]);
    },
    [API_BASE, apiFetch, currentUser, stories, users, notifications]
  );

  const deleteStory = useCallback(
    (storyId: string) => { saveStories(stories.filter((s) => s.id !== storyId)); },
    [stories]
  );

  const viewStory = useCallback(
    (storyId: string) => {
      if (!currentUser) return;
      const updated = stories.map((s) => {
        if (s.id !== storyId || s.viewerIds.includes(currentUser.id)) return s;
        return { ...s, viewerIds: [...s.viewerIds, currentUser.id] };
      });
      saveStories(updated);
    },
    [currentUser, stories]
  );

  const likeStory = useCallback(
    (storyId: string) => {
      if (!currentUser) return;
      const story = stories.find((s) => s.id === storyId);
      if (!story || story.creatorId === currentUser.id) return;
      const notif: AppNotification = {
        id: generateId(),
        recipientId: story.creatorId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        type: "story_like",
        referenceId: storyId,
        message: `${currentUser.name} أعجب بقصتك`,
        isRead: false,
        createdAt: Date.now(),
      };
      saveNotifications([notif, ...notifications]);
    },
    [currentUser, stories, notifications]
  );

  const replyToStory = useCallback(
    (storyId: string, storyCreatorId: string, replyText: string) => {
      if (!currentUser || !replyText.trim() || storyCreatorId === currentUser.id) return;
      const story = stories.find((s) => s.id === storyId);
      // Get or create conversation with story creator
      const existing = conversations.find(
        (c) => c.participants.includes(currentUser.id) && c.participants.includes(storyCreatorId)
      );
      let convoId: string;
      if (existing) {
        convoId = existing.id;
      } else {
        const otherUser = users.find((u) => u.id === storyCreatorId);
        const newConvo: Conversation = {
          id: generateId(),
          participants: [currentUser.id, storyCreatorId],
          participantUsers: [currentUser, otherUser!].filter(Boolean),
          messages: [],
          updatedAt: Date.now(),
        };
        saveConversations([...conversations, newConvo]);
        convoId = newConvo.id;
      }

      const sharedContent: SharedContent = {
        id: storyId,
        type: "story",
        title: story?.caption || "قصة",
        mediaUrl: story?.mediaUrl,
        creatorName: currentUser.name,
      };
      const msg: PrivateMessage = {
        id: generateId(),
        senderId: currentUser.id,
        receiverId: storyCreatorId,
        content: replyText.trim(),
        type: "text",
        timestamp: Date.now(),
        read: false,
        storyRef: storyId,
        sharedContent,
      };

      const updated = conversations.map((c) => {
        if (c.id !== convoId) return c;
        const msgs = c.messages || [];
        return { ...c, messages: [...msgs, msg], lastMessage: msg, updatedAt: Date.now() };
      });
      const alreadyInList = updated.find((c) => c.id === convoId);
      if (!alreadyInList) {
        const otherUser = users.find((u) => u.id === storyCreatorId);
        saveConversations([
          ...updated,
          {
            id: convoId,
            participants: [currentUser.id, storyCreatorId],
            participantUsers: [currentUser, otherUser!].filter(Boolean),
            messages: [msg],
            lastMessage: msg,
            updatedAt: Date.now(),
          },
        ]);
      } else {
        saveConversations(updated);
      }

      // إشعار صاحب القصة
      const notif: AppNotification = {
        id: generateId(),
        recipientId: storyCreatorId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        type: "story_reply",
        referenceId: storyId,
        message: `${currentUser.name} رد على قصتك: "${replyText.trim().substring(0, 30)}"`,
        isRead: false,
        createdAt: Date.now(),
      };
      saveNotifications([notif, ...notifications]);
    },
    [currentUser, stories, conversations, users, notifications]
  );

  // ──────────────────────────────────────────────
  // STORY PERMISSION ENGINE
  // ──────────────────────────────────────────────

  /** Cached admin/manager ID — may be undefined if admin has never logged in */
  const _adminId = useMemo(() => {
    return users.find((u) => u.phone === SUPER_ADMIN_PHONE || u.role === "MANAGER")?.id;
  }, [users]);

  /**
   * Type-safe admin check: works even when _adminId is undefined.
   * Uses role + phone fallback to identify admin stories by creator lookup.
   */
  const _isAdminCreator = useCallback(
    (creatorId: string): boolean => {
      const sid = String(creatorId);
      if (_adminId && String(_adminId) === sid) return true;
      const creator = users.find((u) => String(u.id) === sid);
      return creator?.role === "MANAGER" || creator?.phone === SUPER_ADMIN_PHONE;
    },
    [_adminId, users]
  );

  /**
   * Shared permission guard for a single story.
   * Returns true if `viewerId` is allowed to see this story.
   */
  const _canViewStory = useCallback(
    (s: Story, viewerId: string): boolean => {
      const now = Date.now();
      if (!s || s.expiresAt <= now) return false;

      const vid = String(viewerId);
      const cid = String(s.creatorId);

      // AUDIT LOG — remove or guard with __DEV__ in production
      // console.log('[StoryGuard]', { storyId: s.id, cid, vid, isCloseFriends: s.isCloseFriends, mentions: s.mentions });

      // ① Own story
      if (cid === vid) return true;

      // ② Blocked creator → never visible
      if (blockedUsers.map(String).includes(cid)) return false;

      // ③ Admin / Manager god-mode: always visible (no follow required)
      if (_isAdminCreator(cid)) return true;

      // ④ Strict follower gate: regular stories are visible only to followers.
      const isFollowingCreator = follows.some(
        (f) => String(f.followerId) === vid && String(f.followingId) === cid && f.status === "accepted"
      );
      if (!isFollowingCreator) return false;

      // ⑤ Close Friends: require following + in creator's CF list
      if (s.isCloseFriends) {
        const creatorCFList = (closeFriendsLists[cid] || []).map(String);
        if (!creatorCFList.includes(vid)) return false;
        return true;
      }

      return true;
    },
    [blockedUsers, closeFriendsLists, follows, users, _isAdminCreator]
  );

  /**
   * Universal Story Tray — stories visible in the home-screen horizontal tray.
   * Sorted: admin first → unseen → seen → by createdAt desc.
   */
  const getActiveStories = useCallback(
    (): Story[] => {
      if (!currentUser) return [];

      const now = Date.now();
      const vid = String(currentUser.id);

      // IDs that currentUser is accepted-following
      const followingIds = follows
        .filter((f) => String(f.followerId) === vid && f.status === "accepted")
        .map((f) => String(f.followingId));

      const filteredStories = stories.filter((s) => {
        // Must not be expired
        if (s.expiresAt <= now) return false;

        const cid = String(s.creatorId);

        // ✅ PRIORITY 1 — Admin / Manager god-mode: always visible for everyone
        if (_isAdminCreator(cid)) return true;

        // ✅ PRIORITY 2 — Own stories: always visible to the creator
        if (cid === vid) return true;

        // Block filter applied AFTER own/admin so blocked users still see their own content
        if (blockedUsers.map(String).includes(cid)) return false;

        // ✅ PRIORITY 3 — Followed users' public (non-close-friends) stories
        if (followingIds.includes(cid) && !s.isCloseFriends) return true;

        // ✅ PRIORITY 3b — Followed users' close-friends stories: viewer must be in CF list
        if (followingIds.includes(cid) && s.isCloseFriends) {
          const cfList = (closeFriendsLists[cid] || []).map(String);
          return cfList.includes(vid);
        }

        return false;
      });

      // Required debug log
      console.log("Found Stories:", filteredStories.length);
      console.log("[Zentram Story Engine]", {
        currentUserId: vid,
        role: currentUser.role ?? "none",
        adminId: String(_adminId ?? "NOT_FOUND — admin has never logged in on this device"),
        totalStoriesInDB: stories.length,
        activeStories: stories.filter((s) => s.expiresAt > now).length,
        followingCount: followingIds.length,
        visibleStories: filteredStories.length,
        storyCreators: filteredStories.map((s) => String(s.creatorId)),
      });

      // Sort: admin stories first → then most recent
      return filteredStories.sort((a, b) => {
        const aA = _isAdminCreator(String(a.creatorId)) ? 1 : 0;
        const bA = _isAdminCreator(String(b.creatorId)) ? 1 : 0;
        if (aA !== bA) return bA - aA;
        return b.createdAt - a.createdAt;
      });
    },
    [currentUser, stories, follows, closeFriendsLists, blockedUsers, _isAdminCreator, _adminId]
  );

  /**
   * Stories for a specific user's profile — respects same permission rules.
   * Sorted oldest → newest (story viewer progression order).
   */
  const getUserStories = useCallback(
    (userId: string): Story[] => {
      if (!currentUser) return [];

      const vid = String(currentUser.id);
      const uid = String(userId);

      console.log('[getUserStories] requested userId=', uid, 'viewer=', vid);

      const result = stories
        .filter((s) => String(s.creatorId) === uid && _canViewStory(s, vid))
        .sort((a, b) => a.createdAt - b.createdAt);

      console.log('[getUserStories] result count for', uid, ':', result.length);
      return result;
    },
    [currentUser, stories, _canViewStory]
  );

  /**
   * Whether a user has any story the viewer has NOT yet seen.
   */
  const hasUnseenStory = useCallback(
    (userId: string): boolean => {
      if (!currentUser) return false;
      const vid = String(currentUser.id);
      const uid = String(userId);
      return stories.some(
        (s) =>
          String(s.creatorId) === uid &&
          !s.viewerIds.map(String).includes(vid) &&
          _canViewStory(s, vid)
      );
    },
    [currentUser, stories, _canViewStory]
  );

  const updateCloseFriendsList = useCallback(
    (ids: string[]) => {
      if (!currentUser) return;
      const updated = { ...closeFriendsLists, [currentUser.id]: ids };
      saveCloseFriendsLists(updated);
    },
    [currentUser, closeFriendsLists]
  );

  const closeFriendsList = useMemo(
    () => (currentUser ? closeFriendsLists[currentUser.id] || [] : []),
    [currentUser, closeFriendsLists]
  );

  const shareContentToStory = useCallback(
    (type: "post" | "reel", id: string, mediaUrl?: string, caption?: string, creatorName?: string, creatorId?: string, mediaType?: "image" | "video") => {
      if (!currentUser) return;
      // For reels, media is always video. For posts, fallback to image unless explicitly provided.
      const inferredType = mediaType || (type === "reel" ? "video" : "image");
      // ─ Hand the payload to the editor through the in-memory bridge instead
      //   of router params. The mediaUrl can be a multi-MB `data:` URI (web
      //   bake output) or a long `file://` path (native) — neither fits
      //   reliably through Expo Router params, which serialize into a URL
      //   on web and into navigation state on native. Truncated/garbage
      //   URLs were the root cause of the "black story when sharing" bug:
      //   the editor received an empty sharedMediaUrl, rendered nothing,
      //   and on publish the story was saved with no media.
      const payload = {
        type,
        id,
        mediaUrl: mediaUrl || "",
        mediaType: inferredType,
        caption: caption || "",
        creatorName: creatorName || "",
        creatorId: creatorId || "",
      };
      // Persist in both the bridge (consumed once on editor mount) and the
      // global mediaStore (persists until explicit clear, so the Publish
      // button always has access to the original URL regardless of when it runs).
      setSharedContent(payload);
      useMediaStore.getState().setPending({
        mediaUrl: payload.mediaUrl,
        mediaType: inferredType,
        sourceType: type,
        sourceId: id,
        caption: payload.caption,
        creatorName: payload.creatorName,
        creatorId: payload.creatorId,
      });
      router.push({
        pathname: "/create-story",
        params: { sharedFromBridge: "1" },
      } as any);
    },
    [currentUser]
  );

  // ============================
  // FOLLOWS
  // ============================
  const followUser = useCallback(
    (userId: string) => {
      if (!currentUser || userId === currentUser.id) return;
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return;
      const alreadyFollowing = follows.some(
        (f) => f.followerId === currentUser.id && f.followingId === userId
      );
      if (alreadyFollowing) return;
      const status = targetUser.accountType === "private" ? "pending" : "accepted";
      const follow: Follow = {
        id: generateId(),
        followerId: currentUser.id,
        followingId: userId,
        status,
        createdAt: Date.now(),
      };
      saveFollows([...follows, follow]);
      const notif: AppNotification = {
        id: generateId(),
        recipientId: userId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        type: status === "pending" ? "follow_request" : "follow_accept",
        referenceId: currentUser.id,
        message: status === "pending"
          ? `${currentUser.name} أرسل طلب متابعة`
          : `${currentUser.name} بدأ بمتابعتك`,
        isRead: false,
        createdAt: Date.now(),
      };
      saveNotifications([notif, ...notifications]);
    },
    [currentUser, users, follows, notifications]
  );

  const unfollowUser = useCallback(
    (userId: string) => {
      if (!currentUser) return;
      saveFollows(follows.filter((f) => !(f.followerId === currentUser.id && f.followingId === userId)));
    },
    [currentUser, follows]
  );

  const acceptFollowRequest = useCallback(
    (followerId: string) => {
      if (!currentUser) return;
      const updated = follows.map((f) => {
        if (f.followerId === followerId && f.followingId === currentUser.id && f.status === "pending") {
          return { ...f, status: "accepted" as const };
        }
        return f;
      });
      saveFollows(updated);
      const notif: AppNotification = {
        id: generateId(),
        recipientId: followerId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        type: "follow_accept",
        referenceId: currentUser.id,
        message: `${currentUser.name} قبل طلب متابعتك`,
        isRead: false,
        createdAt: Date.now(),
      };
      saveNotifications([notif, ...notifications]);
    },
    [currentUser, follows, users, notifications]
  );

  const rejectFollowRequest = useCallback(
    (followerId: string) => {
      if (!currentUser) return;
      saveFollows(follows.filter((f) => !(f.followerId === followerId && f.followingId === currentUser.id)));
    },
    [currentUser, follows]
  );

  const isFollowing = useCallback(
    (userId: string) => {
      if (!currentUser) return false;
      return follows.some((f) => f.followerId === currentUser.id && f.followingId === userId && f.status === "accepted");
    },
    [currentUser, follows]
  );

  const isFollowedBy = useCallback(
    (userId: string) => {
      if (!currentUser) return false;
      return follows.some((f) => f.followerId === userId && f.followingId === currentUser.id && f.status === "accepted");
    },
    [currentUser, follows]
  );

  const getFollowStatus = useCallback(
    (userId: string): "none" | "pending" | "following" => {
      if (!currentUser) return "none";
      const follow = follows.find((f) => f.followerId === currentUser.id && f.followingId === userId);
      if (!follow) return "none";
      if (follow.status === "pending") return "pending";
      return "following";
    },
    [currentUser, follows]
  );

  const getFollowers = useCallback(
    (userId: string) => follows.filter((f) => f.followingId === userId && f.status === "accepted"),
    [follows]
  );

  const getFollowing = useCallback(
    (userId: string) => follows.filter((f) => f.followerId === userId && f.status === "accepted"),
    [follows]
  );

  const getFollowersCount = useCallback(
    (userId: string) => follows.filter((f) => f.followingId === userId && f.status === "accepted").length,
    [follows]
  );

  const getFollowingCount = useCallback(
    (userId: string) => follows.filter((f) => f.followerId === userId && f.status === "accepted").length,
    [follows]
  );

  const getUserPosts = useCallback(
    (userId: string) => posts.filter((p) => p.creatorId === userId).sort((a, b) => b.createdAt - a.createdAt),
    [posts]
  );

  const getUserReels = useCallback(
    (userId: string) => reels.filter((r) => r.creatorId === userId).sort((a, b) => b.createdAt - a.createdAt),
    [reels]
  );

  const getFollowRequests = useCallback(
    () => {
      if (!currentUser) return [];
      return follows.filter((f) => f.followingId === currentUser.id && f.status === "pending");
    },
    [currentUser, follows]
  );

  // ============================
  // NOTIFICATIONS
  // ============================
  const markNotificationRead = useCallback(
    (notificationId: string) => {
      const updated = notifications.map((n) => n.id === notificationId ? { ...n, isRead: true } : n);
      saveNotifications(updated);
    },
    [notifications]
  );

  const markAllNotificationsRead = useCallback(
    () => {
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      saveNotifications(updated);
    },
    [notifications]
  );

  const getUnreadNotificationsCount = useCallback(
    () => {
      if (!currentUser) return 0;
      return notifications.filter((n) => n.recipientId === currentUser.id && !n.isRead).length;
    },
    [currentUser, notifications]
  );

  // ============================
  // FEED
  // ============================
  const getFeedPosts = useCallback(
    () => {
      if (!currentUser) return [];
      const vid = String(currentUser.id);
      const followingIds = new Set(
        follows
          .filter((f) => String(f.followerId) === vid && f.status === "accepted")
          .map((f) => String(f.followingId))
      );
      const feedIds = new Set([vid, ...followingIds]);
      const ADMIN_BOOST = 10;
      const getPostScore = (p: Post) => {
        const isAdmin = _isAdminCreator(String(p.creatorId));
        const isBlocked = blockedUsers.map(String).includes(String(p.creatorId));
        if (isAdmin && !isBlocked) return p.createdAt * ADMIN_BOOST;
        return p.createdAt;
      };
      return posts
        .filter((p) => {
          const pid = String(p.creatorId);
          if (p.isHidden && pid !== vid) return false;
          const isAdmin = _isAdminCreator(pid);
          const isBlocked = blockedUsers.map(String).includes(pid);
          // Admin content: inject into every feed (unless blocked)
          if (isAdmin && !isBlocked) return true;
          // Own + followed
          return feedIds.has(pid);
        })
        .sort((a, b) => getPostScore(b) - getPostScore(a));
    },
    [currentUser, posts, follows, blockedUsers, _isAdminCreator]
  );

  const getFeedReels = useCallback(
    () => {
      if (!currentUser) return reels;
      const vid = String(currentUser.id);
      const followingIds = new Set(
        follows
          .filter((f) => String(f.followerId) === vid && f.status === "accepted")
          .map((f) => String(f.followingId))
      );
      const feedIds = new Set([vid, ...followingIds]);
      const ADMIN_BOOST = 10;
      const VERIFIED_BOOST = 1.2;
      const getScore = (r: Reel) => {
        const rid = String(r.creatorId);
        const isAdmin = _isAdminCreator(rid);
        const isBlocked = blockedUsers.map(String).includes(rid);
        if (isAdmin && !isBlocked) return r.createdAt * ADMIN_BOOST;
        const creator = users.find((u) => String(u.id) === rid);
        return r.createdAt * (isUserVerified(creator) ? VERIFIED_BOOST : 1);
      };
      return reels
        .filter((r) => {
          const rid = String(r.creatorId);
          const isAdmin = _isAdminCreator(rid);
          const isBlocked = blockedUsers.map(String).includes(rid);
          if (isAdmin && !isBlocked) return true;
          return feedIds.has(rid) || true;
        })
        .sort((a, b) => getScore(b) - getScore(a));
    },
    [currentUser, reels, follows, users, blockedUsers, _isAdminCreator]
  );

  // ============================
  // ACTIVITY
  // ============================
  const getLikedReels = useCallback(
    () => {
      if (!currentUser) return [];
      const likedReelIds = reelLikes.filter((l) => l.userId === currentUser.id).map((l) => l.reelId);
      return reels.filter((r) => likedReelIds.includes(r.id));
    },
    [currentUser, reels, reelLikes]
  );

  const getMyComments = useCallback(
    () => {
      if (!currentUser) return [];
      return reelComments
        .filter((c) => c.userId === currentUser.id)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20);
    },
    [currentUser, reelComments]
  );

  const getMyPostComments = useCallback(
    () => {
      if (!currentUser) return [];
      return postComments
        .filter((c) => c.userId === currentUser.id)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20);
    },
    [currentUser, postComments]
  );

  const getLikedPosts = useCallback(
    () => {
      if (!currentUser) return [];
      const likedPostIds = postLikes.filter((l) => l.userId === currentUser.id).map((l) => l.postId);
      return posts.filter((p) => likedPostIds.includes(p.id));
    },
    [currentUser, posts, postLikes]
  );

  const t = useCallback(
    (key: string) => translations[language][key] ?? key,
    [language]
  );

  // ───── Group Chat Functions ─────
  const createGroup = useCallback(
    async (name: string, photo: string | undefined, groupId: string, privacy: "public" | "private", memberIds: string[]): Promise<GroupChat | null> => {
      if (!currentUser) return null;
      const existing = groups.find((g) => g.groupId === groupId.trim());
      if (existing) return null;
      const now = Date.now();
      const newGroup: GroupChat = {
        id: generateId(),
        name: name.trim(),
        photo,
        groupId: groupId.trim(),
        privacy,
        ownerId: currentUser.id,
        members: [
          { userId: currentUser.id, role: "owner" },
          ...memberIds.map((uid) => ({ userId: uid, role: "member" as GroupMemberRole })),
        ],
        bannedMembers: [],
        messages: [],
        updatedAt: now,
        createdAt: now,
      };
      saveGroups([...groups, newGroup]);
      return newGroup;
    },
    [currentUser, groups]
  );

  const sendGroupMessage = useCallback(
    (groupChatId: string, content: string, type: "text" | "image" = "text", mediaUrl?: string, replyToId?: string) => {
      if (!currentUser) return;
      const group = groups.find((g) => g.id === groupChatId);
      if (!group) return;
      const member = group.members.find((m) => m.userId === currentUser.id);
      if (!member || member.isMuted) return;
      const msg: GroupMessage = {
        id: generateId(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        content,
        type,
        mediaUrl,
        timestamp: Date.now(),
        replyToId,
      };
      const updated = groups.map((g) =>
        g.id === groupChatId
          ? { ...g, messages: [...g.messages, msg], lastMessage: msg, updatedAt: Date.now() }
          : g
      );
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const deleteGroupMessage = useCallback(
    (groupChatId: string, msgId: string, forAll: boolean) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        const msgs = g.messages.map((m) => {
          if (m.id !== msgId) return m;
          if (forAll) return { ...m, deletedForAll: true, content: "", mediaUrl: undefined };
          return m;
        }).filter((m) => !forAll || m.id !== msgId ? true : false);
        return { ...g, messages: forAll ? g.messages.map((m) => m.id === msgId ? { ...m, deletedForAll: true, content: "" } : m) : g.messages.filter((m) => m.id !== msgId) };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const kickGroupMember = useCallback(
    (groupChatId: string, userId: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        const myRole = g.members.find((m) => m.userId === currentUser.id)?.role;
        if (myRole !== "owner" && myRole !== "admin") return g;
        return { ...g, members: g.members.filter((m) => m.userId !== userId) };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const banGroupMember = useCallback(
    (groupChatId: string, userId: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        const myRole = g.members.find((m) => m.userId === currentUser.id)?.role;
        if (myRole !== "owner" && myRole !== "admin") return g;
        return {
          ...g,
          members: g.members.filter((m) => m.userId !== userId),
          bannedMembers: [...g.bannedMembers, userId],
        };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const muteGroupMember = useCallback(
    (groupChatId: string, userId: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        const myRole = g.members.find((m) => m.userId === currentUser.id)?.role;
        if (myRole !== "owner" && myRole !== "admin") return g;
        return { ...g, members: g.members.map((m) => m.userId === userId ? { ...m, isMuted: true } : m) };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const unmuteGroupMember = useCallback(
    (groupChatId: string, userId: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        const myRole = g.members.find((m) => m.userId === currentUser.id)?.role;
        if (myRole !== "owner" && myRole !== "admin") return g;
        return { ...g, members: g.members.map((m) => m.userId === userId ? { ...m, isMuted: false } : m) };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const promoteToAdmin = useCallback(
    (groupChatId: string, userId: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        if (g.ownerId !== currentUser.id) return g;
        return { ...g, members: g.members.map((m) => m.userId === userId ? { ...m, role: "admin" as GroupMemberRole } : m) };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const demoteAdmin = useCallback(
    (groupChatId: string, userId: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        if (g.ownerId !== currentUser.id) return g;
        return { ...g, members: g.members.map((m) => m.userId === userId ? { ...m, role: "member" as GroupMemberRole } : m) };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const leaveGroup = useCallback(
    (groupChatId: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        if (g.ownerId === currentUser.id) return g;
        return { ...g, members: g.members.filter((m) => m.userId !== currentUser.id) };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const editGroup = useCallback(
    (groupChatId: string, name: string, photo?: string, privacy?: "public" | "private") => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        const myRole = g.members.find((m) => m.userId === currentUser.id)?.role;
        if (myRole !== "owner" && myRole !== "admin") return g;
        return {
          ...g,
          name: name.trim() || g.name,
          photo: photo !== undefined ? photo : g.photo,
          privacy: privacy ?? g.privacy,
        };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const searchGroupByPublicId = useCallback(
    (groupId: string): GroupChat | null => {
      return groups.find((g) => g.groupId === groupId.trim() && g.privacy === "public") ?? null;
    },
    [groups]
  );

  const getMyGroups = useCallback(
    (): GroupChat[] => {
      if (!currentUser) return [];
      return groups.filter((g) => g.members.some((m) => m.userId === currentUser.id));
    },
    [currentUser, groups]
  );

  const getGroupMemberRole = useCallback(
    (groupChatId: string, userId: string): GroupMemberRole | null => {
      const g = groups.find((gr) => gr.id === groupChatId);
      if (!g) return null;
      return g.members.find((m) => m.userId === userId)?.role ?? null;
    },
    [groups]
  );

  const isGroupMuted = useCallback(
    (groupChatId: string): boolean => {
      if (!currentUser) return false;
      const g = groups.find((gr) => gr.id === groupChatId);
      if (!g) return false;
      return g.members.find((m) => m.userId === currentUser.id)?.isMuted ?? false;
    },
    [currentUser, groups]
  );

  const joinGroup = useCallback(
    (groupChatId: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        if (g.privacy !== "public") return g;
        if (g.bannedMembers.includes(currentUser.id)) return g;
        if (g.members.some((m) => m.userId === currentUser.id)) return g;
        return { ...g, members: [...g.members, { userId: currentUser.id, role: "member" as GroupMemberRole }] };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  const addGroupReaction = useCallback(
    (groupChatId: string, msgId: string, emoji: string) => {
      if (!currentUser) return;
      const updated = groups.map((g) => {
        if (g.id !== groupChatId) return g;
        const msgs = g.messages.map((m) => {
          if (m.id !== msgId) return m;
          const reactions = { ...(m.reactions || {}) };
          const users = reactions[emoji] || [];
          if (users.includes(currentUser.id)) {
            reactions[emoji] = users.filter((u) => u !== currentUser.id);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...users, currentUser.id];
          }
          return { ...m, reactions };
        });
        return { ...g, messages: msgs };
      });
      saveGroups(updated);
    },
    [currentUser, groups]
  );

  // ───── Privacy Settings ─────
  const getMyPrivacy = useCallback((): UserPrivacySettings => {
    if (!currentUser) return DEFAULT_PRIVACY;
    return privacySettingsMap[currentUser.id] ?? DEFAULT_PRIVACY;
  }, [currentUser, privacySettingsMap]);

  const updatePrivacySettings = useCallback((settings: Partial<UserPrivacySettings>) => {
    if (!currentUser) return;
    const current = privacySettingsMap[currentUser.id] ?? DEFAULT_PRIVACY;
    const updated = { ...current, ...settings };
    savePrivacySettingsMap({ ...privacySettingsMap, [currentUser.id]: updated });
  }, [currentUser, privacySettingsMap]);

  const checkPrivacy = useCallback((level: PrivacyLevel, viewerId: string, ownerId: string): boolean => {
    if (viewerId === ownerId) return true;
    if (level === "everyone") return true;
    if (level === "none") return false;
    const ownerFollowers = follows.filter((f) => f.followingId === ownerId && f.status === "accepted").map((f) => f.followerId);
    const ownerFollowing = follows.filter((f) => f.followerId === ownerId && f.status === "accepted").map((f) => f.followingId);
    if (level === "followers") return ownerFollowers.includes(viewerId);
    if (level === "following") return ownerFollowing.includes(viewerId);
    return false;
  }, [follows]);

  const canViewStory = useCallback((viewerId: string, ownerId: string): boolean => {
    const level = (privacySettingsMap[ownerId] ?? DEFAULT_PRIVACY).stories;
    return checkPrivacy(level, viewerId, ownerId);
  }, [privacySettingsMap, checkPrivacy]);

  const canViewProfilePhoto = useCallback((viewerId: string, ownerId: string): boolean => {
    const level = (privacySettingsMap[ownerId] ?? DEFAULT_PRIVACY).profilePhoto;
    return checkPrivacy(level, viewerId, ownerId);
  }, [privacySettingsMap, checkPrivacy]);

  const canAddToGroup = useCallback((userId: string): boolean => {
    if (!currentUser) return false;
    if (userId === currentUser.id) return true;
    const level = (privacySettingsMap[userId] ?? DEFAULT_PRIVACY).groups;
    return checkPrivacy(level, currentUser.id, userId);
  }, [currentUser, privacySettingsMap, checkPrivacy]);

  const canMention = useCallback((viewerId: string, ownerId: string): boolean => {
    const level = (privacySettingsMap[ownerId] ?? DEFAULT_PRIVACY).mentions;
    return checkPrivacy(level, viewerId, ownerId);
  }, [privacySettingsMap, checkPrivacy]);

  const addStrike = useCallback((userId: string) => {
    const updatedUsers = users.map((u) => u.id === userId ? { ...u, strikes: (u.strikes ?? 0) + 1 } : u);
    saveUsers(updatedUsers);
    setCurrentUser((prev) => {
      if (!prev || prev.id !== userId) return prev;
      return { ...prev, strikes: (prev.strikes ?? 0) + 1 };
    });
  }, [users]);

  const value = useMemo(
    () => ({
      language, setLanguage, theme, toggleTheme, currentUser, isAuthenticated: !!currentUser,
      isSuperAdmin, isManager,
      users, rooms, conversations, reels, reelLikes, reelComments,
      posts, postLikes, postComments, stories, follows, notifications,
      login, register, logout, updateProfile, updateCoverPhoto, checkUsername, checkEmail,
      changePassword, sendEmailOTP, resetPasswordWithOTP,
      createRoom, deleteRoom, joinRoomSeat, leaveRoomSeat,
      joinRoomPresence, leaveRoomPresence, leaveRoomFull,
      sendRoomMessage, deleteRoomMessage, pinRoomMessage, editRoomMessage, addRoomReaction,
      kickFromRoom, banFromRoom, muteUserInRoom,
      updateRoomBackground, setRoomAnnouncement, lockSeat, unlockSeat, lockSeatsInRoom, shareRoomToDM, searchRoomByCode,
      getConversation, sendPrivateMessage, injectCallLog, deleteMessage, pinMessage, addReaction,
      blockedUsers, blockUser, unblockUser, isBlocked, deleteConversation,
      markConversationRead, archiveConversation, unarchiveConversation, setConversationTheme,
      governorateImages, setGovernorateImage,
      createOwnerAccount, setOwnerActive, banUser, unbanUser, resetUserPassword,
      verifyUser, revokeVerification,
      addReel, deleteReel, likeReel, isReelLiked, getReelLikesCount, addReelComment, deleteReelComment, getReelComments,
      likeReelComment, isReelCommentLiked, pinReelComment, getReelCommentLikers, getPostCommentLikers,
      shareReelToConversation, sharePostToDM, shareStoryToDM, searchUsers,
      addPost, deletePost, hidePost, likePost, isPostLiked, getPostLikesCount,
      addPostComment, deletePostComment, likePostComment, isPostCommentLiked, pinPostComment, getPostComments,
      addStory, deleteStory, viewStory, likeStory, replyToStory, getActiveStories, getUserStories, hasUnseenStory,
      closeFriendsList, updateCloseFriendsList, shareContentToStory,
      followUser, unfollowUser, acceptFollowRequest, rejectFollowRequest, isFollowing, isFollowedBy,
      getFollowStatus, getFollowers, getFollowing, getFollowersCount, getFollowingCount, getFollowRequests,
      markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount,
      getFeedPosts, getFeedReels, getLikedReels, getMyComments, getMyPostComments, getLikedPosts,
      getUserPosts, getUserReels,
      savedPosts, savePost, unsavePost, isPostSaved, getSavedPosts,
      t,
      isRoomMinimized, minimizedRoomId, minimizedRoomName, minimizedRoomImage, minimizeRoom, expandRoom,
      isStoryEditorOpen, setStoryEditorOpen,
      floatingRoomPos, setFloatingRoomPos,
      groups, createGroup, sendGroupMessage, deleteGroupMessage,
      kickGroupMember, banGroupMember, muteGroupMember, unmuteGroupMember,
      promoteToAdmin, demoteAdmin, leaveGroup, editGroup,
      searchGroupByPublicId, getMyGroups, getGroupMemberRole, isGroupMuted, joinGroup,
      addGroupReaction,
      privacySettings: getMyPrivacy(),
      updatePrivacySettings, canViewStory, canViewProfilePhoto, canAddToGroup, canMention, addStrike,
      merchants, products, orders, isMerchantOwner, getMyMerchant,
      addMerchant, updateMerchantProfile, addProduct, updateProduct, deleteProduct,
      updateOrderStatus, getCommissionTier, recordAffiliateLink, getAffiliateForProduct,
      createMerchantAccount, getMerchantOrders,
      cart, addToCart, removeFromCart, clearCart, placeOrder,
      savedProducts, productLikes, followedMerchants, blockedMerchantIds,
      toggleSaveProduct, isProductSaved, toggleLikeProduct, isProductLiked, getProductLikesCount,
      toggleFollowMerchant, isMerchantFollowed, blockMerchantStore, unblockMerchantStore, isMerchantBlocked,
      cancelOrder, acceptOrder, rejectOrder, getMyOrders,
    }),
    [
      language, theme, currentUser, isSuperAdmin, isManager, isMerchantOwner, getMyMerchant,
      users, rooms, conversations,
      reels, reelLikes, reelComments, posts, postLikes, postComments, stories, follows, notifications,
      login, register, logout, updateProfile, updateCoverPhoto, checkUsername, checkEmail,
      changePassword, sendEmailOTP, resetPasswordWithOTP,
      createRoom, deleteRoom, joinRoomSeat, leaveRoomSeat,
      joinRoomPresence, leaveRoomPresence, leaveRoomFull,
      sendRoomMessage, deleteRoomMessage, pinRoomMessage, editRoomMessage, addRoomReaction,
      kickFromRoom, banFromRoom, muteUserInRoom,
      updateRoomBackground, setRoomAnnouncement, lockSeat, unlockSeat, lockSeatsInRoom, shareRoomToDM, searchRoomByCode,
      getConversation, sendPrivateMessage, injectCallLog, deleteMessage, pinMessage, addReaction,
      blockedUsers, blockUser, unblockUser, isBlocked, deleteConversation,
      markConversationRead, archiveConversation, unarchiveConversation, setConversationTheme,
      governorateImages, setGovernorateImage,
      createOwnerAccount, setOwnerActive, banUser, unbanUser, resetUserPassword,
      verifyUser, revokeVerification,
      addReel, deleteReel, likeReel, isReelLiked, getReelLikesCount, addReelComment, deleteReelComment, getReelComments,
      likeReelComment, isReelCommentLiked, pinReelComment, getReelCommentLikers, getPostCommentLikers,
      shareReelToConversation, sharePostToDM, shareStoryToDM, searchUsers,
      addPost, deletePost, hidePost, likePost, isPostLiked, getPostLikesCount,
      addPostComment, deletePostComment, likePostComment, isPostCommentLiked, pinPostComment, getPostComments,
      addStory, deleteStory, viewStory, likeStory, replyToStory, getActiveStories, getUserStories, hasUnseenStory,
      closeFriendsList, updateCloseFriendsList, shareContentToStory,
      followUser, unfollowUser, acceptFollowRequest, rejectFollowRequest, isFollowing, isFollowedBy,
      getFollowStatus, getFollowers, getFollowing, getFollowersCount, getFollowingCount, getFollowRequests,
      markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount,
      getFeedPosts, getFeedReels, getLikedReels, getMyComments, getMyPostComments, getLikedPosts,
      getUserPosts, getUserReels, t,
      isRoomMinimized, minimizedRoomId, minimizedRoomName, minimizedRoomImage, minimizeRoom, expandRoom,
      isStoryEditorOpen, floatingRoomPos,
      groups, createGroup, sendGroupMessage, deleteGroupMessage,
      kickGroupMember, banGroupMember, muteGroupMember, unmuteGroupMember,
      promoteToAdmin, demoteAdmin, leaveGroup, editGroup,
      searchGroupByPublicId, getMyGroups, getGroupMemberRole, isGroupMuted, joinGroup,
      addGroupReaction,
      updatePrivacySettings, canViewStory, canViewProfilePhoto, canAddToGroup, canMention, addStrike,
      privacySettingsMap,
      merchants, products, orders, addMerchant, updateMerchantProfile, addProduct, updateProduct, deleteProduct,
      updateOrderStatus, getCommissionTier, recordAffiliateLink, getAffiliateForProduct,
      createMerchantAccount, getMerchantOrders, affiliateLinks,
      cart, addToCart, removeFromCart, clearCart, placeOrder,
      savedProducts, productLikes, followedMerchants, blockedMerchantIds,
      toggleSaveProduct, isProductSaved, toggleLikeProduct, isProductLiked, getProductLikesCount,
      toggleFollowMerchant, isMerchantFollowed, blockMerchantStore, unblockMerchantStore, isMerchantBlocked,
      cancelOrder, acceptOrder, rejectOrder, getMyOrders,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
