import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "ar" | "en";
export type Theme = "light" | "dark";
export type ReelFilter = "none" | "grayscale" | "warm" | "cool" | "vintage";
export type AccountType = "public" | "private";
export type PostFilter = "none" | "grayscale" | "warm" | "cool" | "vintage";

export interface User {
  id: string;
  name: string;
  username?: string;
  phone: string;
  email: string;
  age: number;
  address: string;
  avatar?: string;
  coverUrl?: string;
  bio?: string;
  accountType: AccountType;
  isBanned?: boolean;
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "video" | "gif" | "system";
  mediaUrl?: string;
  timestamp: number;
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  replyToId?: string;
  replyToContent?: string;
  replyToSender?: string;
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
  type: "text" | "image" | "video" | "audio" | "shared" | "location";
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

export interface Restaurant {
  id: string;
  name: string;
  image?: string;
  phone: string;
  whatsapp?: string;
  category: string;
  governorate: string;
  menuItems: MenuItem[];
  createdAt: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

export interface Reel {
  id: string;
  videoUrl: string;
  title: string;
  creatorId: string;
  filter: ReelFilter;
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
  type: "follow_request" | "follow_accept" | "like" | "comment" | "post" | "story" | "message" | "story_like" | "story_reply" | "mention";
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
  restaurants: Restaurant[];
  reels: Reel[];
  reelLikes: ReelLike[];
  reelComments: ReelComment[];
  posts: Post[];
  postLikes: PostLike[];
  postComments: PostComment[];
  stories: Story[];
  follows: Follow[];
  notifications: AppNotification[];
  login: (phone: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    phone: string,
    email: string,
    age: number,
    address: string,
    password: string,
    username: string
  ) => Promise<{ success: boolean; error?: "phone_exists" | "username_exists" }>;
  checkUsername: (username: string) => boolean;
  logout: () => Promise<void>;
  updateProfile: (name: string, bio?: string, avatar?: string, accountType?: AccountType) => Promise<void>;
  updateCoverPhoto: (coverUrl: string) => Promise<void>;
  createRoom: (name: string, image?: string) => Promise<Room | null>;
  deleteRoom: (roomId: string) => Promise<void>;
  joinRoomSeat: (roomId: string, seatIndex: number) => void;
  leaveRoomSeat: (roomId: string) => void;
  sendRoomMessage: (roomId: string, content: string, type?: "text" | "image" | "video" | "gif" | "system", mediaUrl?: string, replyToId?: string, replyToContent?: string, replyToSender?: string) => void;
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
  shareRoomToDM: (roomId: string, receiverId: string) => void;
  searchRoomByCode: (code: string) => Room | null;
  getConversation: (otherUserId: string) => Conversation;
  sendPrivateMessage: (conversationId: string, receiverId: string, content: string, type?: "text" | "image" | "video" | "audio" | "shared" | "location", mediaUrl?: string, duration?: number, sharedContent?: SharedContent, storyRef?: string, replyToId?: string, location?: MessageLocation) => void;
  deleteMessage: (conversationId: string, messageId: string, forBoth: boolean) => void;
  pinMessage: (conversationId: string, messageId: string) => void;
  addReaction: (conversationId: string, messageId: string, emoji: string) => void;
  blockedUsers: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
  deleteConversation: (conversationId: string) => void;
  governorateImages: GovernorateImage[];
  setGovernorateImage: (name: string, image: string) => void;
  addRestaurant: (restaurant: Omit<Restaurant, "id" | "createdAt">) => void;
  updateRestaurant: (id: string, data: Partial<Restaurant>) => void;
  deleteRestaurant: (id: string) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  resetUserPassword: (userId: string, newPassword: string) => void;
  addReel: (videoUrl: string, title: string, filter: ReelFilter) => void;
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
  addStory: (mediaUrl: string, mediaType: "image" | "video", caption?: string, filter?: string) => void;
  deleteStory: (storyId: string) => void;
  viewStory: (storyId: string) => void;
  likeStory: (storyId: string) => void;
  replyToStory: (storyId: string, storyCreatorId: string, replyText: string) => void;
  getActiveStories: () => Story[];
  getUserStories: (userId: string) => Story[];
  hasUnseenStory: (userId: string) => boolean;
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
    hillaConnect: "هلا بابل",
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
    invalidCredentials: "رقم الهاتف أو كلمة المرور غير صحيحة",
    phoneExists: "رقم الهاتف مسجل مسبقاً",
    fillAll: "يرجى ملء جميع الحقول",
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
    selectGovernorate: "اختر المحافظة",
    governorate: "المحافظة",
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
    hillaConnect: "Hilla Connect",
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
    invalidCredentials: "Invalid phone or password",
    phoneExists: "Phone number already registered",
    fillAll: "Please fill all fields",
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
    selectGovernorate: "Select Governorate",
    governorate: "Governorate",
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
        u.phone === handle
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
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [reelLikes, setReelLikes] = useState<ReelLike[]>([]);
  const [reelComments, setReelComments] = useState<ReelComment[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLikes, setPostLikes] = useState<PostLike[]>([]);
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [savedPosts, setSavedPostsState] = useState<string[]>([]);
  const [governorateImages, setGovernorateImagesState] = useState<GovernorateImage[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const keys = [
        "language", "theme", "currentUser", "users", "rooms", "conversations",
        "restaurants", "passwords", "blockedUsers", "reels", "reelLikes",
        "reelComments", "posts", "postLikes", "postComments", "stories",
        "follows", "notifications", "savedPosts", "governorateImages",
      ];
      const values = await AsyncStorage.multiGet(keys);
      const data = Object.fromEntries(values.map(([k, v]) => [k, v]));

      if (data.language) setLanguageState(data.language as Language);
      if (data.theme) setTheme(data.theme as Theme);
      if (data.currentUser) setCurrentUser(JSON.parse(data.currentUser));
      if (data.users) setUsers(JSON.parse(data.users));
      if (data.rooms) setRooms(JSON.parse(data.rooms));
      if (data.conversations) setConversations(JSON.parse(data.conversations));
      if (data.restaurants) setRestaurants(JSON.parse(data.restaurants));
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
      if (data.follows) setFollows(JSON.parse(data.follows));
      if (data.notifications) setNotifications(JSON.parse(data.notifications));
      if (data.savedPosts) setSavedPostsState(JSON.parse(data.savedPosts));
      if (data.governorateImages) setGovernorateImagesState(JSON.parse(data.governorateImages));
    } catch (e) {}
  };

  const saveUsers = (u: User[]) => { setUsers(u); AsyncStorage.setItem("users", JSON.stringify(u)); };
  const saveRooms = (r: Room[]) => { setRooms(r); AsyncStorage.setItem("rooms", JSON.stringify(r)); };
  const saveConversations = (c: Conversation[]) => { setConversations(c); AsyncStorage.setItem("conversations", JSON.stringify(c)); };
  const saveRestaurants = (r: Restaurant[]) => { setRestaurants(r); AsyncStorage.setItem("restaurants", JSON.stringify(r)); };
  const saveReels = (r: Reel[]) => { setReels(r); AsyncStorage.setItem("reels", JSON.stringify(r)); };
  const saveLikes = (l: ReelLike[]) => { setReelLikes(l); AsyncStorage.setItem("reelLikes", JSON.stringify(l)); };
  const saveComments = (c: ReelComment[]) => { setReelComments(c); AsyncStorage.setItem("reelComments", JSON.stringify(c)); };
  const savePosts = (p: Post[]) => { setPosts(p); AsyncStorage.setItem("posts", JSON.stringify(p)); };
  const savePostLikes = (l: PostLike[]) => { setPostLikes(l); AsyncStorage.setItem("postLikes", JSON.stringify(l)); };
  const savePostComments = (c: PostComment[]) => { setPostComments(c); AsyncStorage.setItem("postComments", JSON.stringify(c)); };
  const saveStories = (s: Story[]) => { setStories(s); AsyncStorage.setItem("stories", JSON.stringify(s)); };
  const saveFollows = (f: Follow[]) => { setFollows(f); AsyncStorage.setItem("follows", JSON.stringify(f)); };
  const saveNotifications = (n: AppNotification[]) => { setNotifications(n); AsyncStorage.setItem("notifications", JSON.stringify(n)); };
  const saveSavedPostsData = (s: string[]) => { setSavedPostsState(s); AsyncStorage.setItem("savedPosts", JSON.stringify(s)); };
  const saveGovernorateImagesData = (g: GovernorateImage[]) => { setGovernorateImagesState(g); AsyncStorage.setItem("governorateImages", JSON.stringify(g)); };

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
      return next;
    });
  }, []);

  const isSuperAdmin = currentUser?.phone === SUPER_ADMIN_PHONE;

  const login = useCallback(
    async (phone: string, password: string): Promise<boolean> => {
      if (phone === SUPER_ADMIN_PHONE && password === SUPER_ADMIN_PASSWORD) {
        let adminUser = users.find((u) => u.phone === SUPER_ADMIN_PHONE);
        if (!adminUser) {
          adminUser = {
            id: generateId(),
            name: "المدير الأعلى",
            username: "admin",
            phone: SUPER_ADMIN_PHONE,
            email: "admin@hillaconnect.com",
            age: 30,
            address: "الحلة",
            accountType: "public",
            createdAt: Date.now(),
          };
          const newUsers = [...users, adminUser];
          saveUsers(newUsers);
          const newPasswords = { ...passwords, [adminUser.id]: SUPER_ADMIN_PASSWORD };
          setPasswords(newPasswords);
          await AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
        }
        setCurrentUser(adminUser);
        await AsyncStorage.setItem("currentUser", JSON.stringify(adminUser));
        return true;
      }
      const user = users.find((u) => u.phone === phone);
      if (!user) return false;
      if (passwords[user.id] !== password) return false;
      if (user.isBanned) return false;
      setCurrentUser(user);
      await AsyncStorage.setItem("currentUser", JSON.stringify(user));
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

  const register = useCallback(
    async (name: string, phone: string, email: string, age: number, address: string, password: string, username: string): Promise<{ success: boolean; error?: "phone_exists" | "username_exists" }> => {
      const phoneExists = users.find((u) => u.phone === phone);
      if (phoneExists) return { success: false, error: "phone_exists" };
      const usernameExists = users.some((u) => u.username && u.username.toLowerCase() === username.toLowerCase());
      if (usernameExists) return { success: false, error: "username_exists" };
      const newUser: User = {
        id: generateId(),
        name,
        username,
        phone,
        email,
        age,
        address,
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
      return { success: true };
    },
    [users, passwords]
  );

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem("currentUser");
  }, []);

  const updateProfile = useCallback(
    async (name: string, bio?: string, avatar?: string, accountType?: AccountType) => {
      if (!currentUser) return;
      const updated: User = {
        ...currentUser,
        name,
        ...(bio !== undefined ? { bio } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
        ...(accountType !== undefined ? { accountType } : {}),
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
      const newRoom: Room = {
        id: generateId(),
        roomCode: generateRoomCode(),
        name,
        image,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        seats: Array(8).fill(null),
        seatUsers: Array(8).fill(null),
        lockedSeats: Array(8).fill(false),
        chat: [],
        bannedUsers: [],
        mutedUsers: [],
        isHidden: false,
        createdAt: Date.now(),
      };
      newRoom.seats[0] = currentUser.id;
      newRoom.seatUsers[0] = currentUser;
      saveRooms([...rooms, newRoom]);
      return newRoom;
    },
    [currentUser, rooms]
  );

  const deleteRoom = useCallback(
    async (roomId: string) => {
      try { await fetch(`/api/rooms/${roomId}`, { method: "DELETE" }); } catch {}
      saveRooms(rooms.filter((r) => r.id !== roomId));
    },
    [rooms]
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
        const systemMsg: Message = {
          id: generateId(),
          senderId: "system",
          senderName: "system",
          content: `${currentUser.name} دخل الغرفة 🎤`,
          type: "system",
          timestamp: Date.now(),
        };
        return { ...r, seats, seatUsers, chat: [...r.chat.slice(-100), systemMsg] };
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
        const systemMsg: Message = {
          id: generateId(),
          senderId: "system",
          senderName: "system",
          content: `${currentUser.name} غادر الغرفة 👋`,
          type: "system",
          timestamp: Date.now(),
        };
        return { ...r, seats, seatUsers, isHidden: false, chat: [...r.chat.slice(-100), systemMsg] };
      });
      saveRooms(updated);
    },
    [currentUser, rooms]
  );

  const sendRoomMessage = useCallback(
    (roomId: string, content: string, type: "text" | "image" | "video" | "gif" = "text", mediaUrl?: string, replyToId?: string, replyToContent?: string, replyToSender?: string) => {
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

  const sendPrivateMessage = useCallback(
    (
      conversationId: string,
      receiverId: string,
      content: string,
      type: "text" | "image" | "video" | "audio" | "shared" | "location" = "text",
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

  const addRestaurant = useCallback(
    (data: Omit<Restaurant, "id" | "createdAt">) => {
      const r: Restaurant = { ...data, id: generateId(), createdAt: Date.now() };
      saveRestaurants([...restaurants, r]);
    },
    [restaurants]
  );

  const updateRestaurant = useCallback(
    (id: string, data: Partial<Restaurant>) => {
      saveRestaurants(restaurants.map((r) => (r.id === id ? { ...r, ...data } : r)));
    },
    [restaurants]
  );

  const deleteRestaurant = useCallback(
    (id: string) => { saveRestaurants(restaurants.filter((r) => r.id !== id)); },
    [restaurants]
  );

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

  const addReel = useCallback(
    (videoUrl: string, title: string, filter: ReelFilter) => {
      if (!currentUser) return;
      const reel: Reel = { id: generateId(), videoUrl, title, creatorId: currentUser.id, filter, createdAt: Date.now() };
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
      return users.filter(
        (u) => u.id !== currentUser?.id && (u.name.toLowerCase().includes(q) || u.phone.includes(q))
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
  // STORIES
  // ============================
  const addStory = useCallback(
    (mediaUrl: string, mediaType: "image" | "video", caption?: string, filter = "none") => {
      if (!currentUser) return;
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      const story: Story = {
        id: generateId(),
        creatorId: currentUser.id,
        mediaUrl,
        mediaType,
        caption,
        filter,
        viewerIds: [],
        expiresAt,
        createdAt: Date.now(),
      };
      saveStories([story, ...stories]);
    },
    [currentUser, stories]
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

  const getActiveStories = useCallback(
    () => stories.filter((s) => s.expiresAt > Date.now()),
    [stories]
  );

  const getUserStories = useCallback(
    (userId: string) => stories.filter((s) => s.creatorId === userId && s.expiresAt > Date.now()),
    [stories]
  );

  const hasUnseenStory = useCallback(
    (userId: string) => {
      if (!currentUser) return false;
      return stories.some(
        (s) => s.creatorId === userId && s.expiresAt > Date.now() && !s.viewerIds.includes(currentUser.id)
      );
    },
    [currentUser, stories]
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
      const followingIds = follows
        .filter((f) => f.followerId === currentUser.id && f.status === "accepted")
        .map((f) => f.followingId);
      const feedIds = new Set([currentUser.id, ...followingIds]);
      return posts
        .filter((p) => feedIds.has(p.creatorId) && (!p.isHidden || p.creatorId === currentUser.id))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    [currentUser, posts, follows]
  );

  const getFeedReels = useCallback(
    () => {
      if (!currentUser) return reels;
      const followingIds = follows
        .filter((f) => f.followerId === currentUser.id && f.status === "accepted")
        .map((f) => f.followingId);
      const feedIds = new Set([currentUser.id, ...followingIds]);
      const followingReels = reels.filter((r) => feedIds.has(r.creatorId));
      const otherReels = reels.filter((r) => !feedIds.has(r.creatorId));
      return [...followingReels, ...otherReels].sort((a, b) => b.createdAt - a.createdAt);
    },
    [currentUser, reels, follows]
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

  const value = useMemo(
    () => ({
      language, setLanguage, theme, toggleTheme, currentUser, isAuthenticated: !!currentUser,
      isSuperAdmin, users, rooms, conversations, restaurants, reels, reelLikes, reelComments,
      posts, postLikes, postComments, stories, follows, notifications,
      login, register, logout, updateProfile, updateCoverPhoto, checkUsername, createRoom, deleteRoom, joinRoomSeat, leaveRoomSeat,
      sendRoomMessage, deleteRoomMessage, pinRoomMessage, editRoomMessage, addRoomReaction,
      kickFromRoom, banFromRoom, muteUserInRoom,
      updateRoomBackground, setRoomAnnouncement, lockSeat, unlockSeat, shareRoomToDM, searchRoomByCode,
      getConversation, sendPrivateMessage, deleteMessage, pinMessage, addReaction,
      blockedUsers, blockUser, unblockUser, isBlocked, deleteConversation,
      governorateImages, setGovernorateImage,
      addRestaurant, updateRestaurant, deleteRestaurant, banUser, unbanUser, resetUserPassword,
      addReel, deleteReel, likeReel, isReelLiked, getReelLikesCount, addReelComment, deleteReelComment, getReelComments,
      likeReelComment, isReelCommentLiked, pinReelComment, getReelCommentLikers, getPostCommentLikers,
      shareReelToConversation, sharePostToDM, shareStoryToDM, searchUsers,
      addPost, deletePost, hidePost, likePost, isPostLiked, getPostLikesCount,
      addPostComment, deletePostComment, likePostComment, isPostCommentLiked, pinPostComment, getPostComments,
      addStory, deleteStory, viewStory, likeStory, replyToStory, getActiveStories, getUserStories, hasUnseenStory,
      followUser, unfollowUser, acceptFollowRequest, rejectFollowRequest, isFollowing, isFollowedBy,
      getFollowStatus, getFollowers, getFollowing, getFollowersCount, getFollowingCount, getFollowRequests,
      markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount,
      getFeedPosts, getFeedReels, getLikedReels, getMyComments, getMyPostComments, getLikedPosts,
      getUserPosts, getUserReels,
      savedPosts, savePost, unsavePost, isPostSaved, getSavedPosts,
      t,
    }),
    [
      language, theme, currentUser, isSuperAdmin, users, rooms, conversations, restaurants,
      reels, reelLikes, reelComments, posts, postLikes, postComments, stories, follows, notifications,
      login, register, logout, updateProfile, updateCoverPhoto, checkUsername, createRoom, deleteRoom, joinRoomSeat, leaveRoomSeat,
      sendRoomMessage, deleteRoomMessage, pinRoomMessage, editRoomMessage, addRoomReaction,
      kickFromRoom, banFromRoom, muteUserInRoom,
      updateRoomBackground, setRoomAnnouncement, lockSeat, unlockSeat, shareRoomToDM, searchRoomByCode,
      getConversation, sendPrivateMessage, deleteMessage, pinMessage, addReaction,
      blockedUsers, blockUser, unblockUser, isBlocked, deleteConversation,
      governorateImages, setGovernorateImage,
      addRestaurant, updateRestaurant, deleteRestaurant, banUser, unbanUser, resetUserPassword,
      addReel, deleteReel, likeReel, isReelLiked, getReelLikesCount, addReelComment, deleteReelComment, getReelComments,
      likeReelComment, isReelCommentLiked, pinReelComment, getReelCommentLikers, getPostCommentLikers,
      shareReelToConversation, sharePostToDM, shareStoryToDM, searchUsers,
      addPost, deletePost, hidePost, likePost, isPostLiked, getPostLikesCount,
      addPostComment, deletePostComment, likePostComment, isPostCommentLiked, pinPostComment, getPostComments,
      addStory, deleteStory, viewStory, likeStory, replyToStory, getActiveStories, getUserStories, hasUnseenStory,
      followUser, unfollowUser, acceptFollowRequest, rejectFollowRequest, isFollowing, isFollowedBy,
      getFollowStatus, getFollowers, getFollowing, getFollowersCount, getFollowingCount, getFollowRequests,
      markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount,
      getFeedPosts, getFeedReels, getLikedReels, getMyComments, getMyPostComments, getLikedPosts,
      getUserPosts, getUserReels, t,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
