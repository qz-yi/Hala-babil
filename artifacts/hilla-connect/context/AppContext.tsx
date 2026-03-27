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

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  age: number;
  address: string;
  avatar?: string;
  isBanned?: boolean;
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "gif";
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  image?: string;
  ownerId: string;
  ownerName: string;
  seats: (string | null)[];
  seatUsers: (User | null)[];
  chat: Message[];
  bannedUsers: string[];
  isHidden: boolean;
  createdAt: number;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "image";
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantUsers: User[];
  lastMessage?: PrivateMessage;
  updatedAt: number;
}

export interface Restaurant {
  id: string;
  name: string;
  image?: string;
  phone: string;
  whatsapp?: string;
  category: string;
  menuItems: MenuItem[];
  createdAt: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
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
  login: (phone: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    phone: string,
    email: string,
    age: number,
    address: string,
    password: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (name: string, avatar?: string) => Promise<void>;
  createRoom: (name: string, image?: string) => Promise<Room | null>;
  deleteRoom: (roomId: string) => Promise<void>;
  joinRoomSeat: (roomId: string, seatIndex: number) => void;
  leaveRoomSeat: (roomId: string) => void;
  sendRoomMessage: (
    roomId: string,
    content: string,
    type?: "text" | "image" | "gif"
  ) => void;
  kickFromRoom: (roomId: string, userId: string) => void;
  banFromRoom: (roomId: string, userId: string) => void;
  getConversation: (otherUserId: string) => Conversation;
  sendPrivateMessage: (
    conversationId: string,
    receiverId: string,
    content: string,
    type?: "text" | "image"
  ) => void;
  blockUser: (userId: string) => void;
  addRestaurant: (restaurant: Omit<Restaurant, "id" | "createdAt">) => void;
  updateRestaurant: (id: string, data: Partial<Restaurant>) => void;
  deleteRestaurant: (id: string) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    home: "الرئيسية",
    messages: "الرسائل",
    restaurants: "المطاعم",
    profile: "الملف",
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
    noRoomSlot:
      "يمكنك إنشاء غرفة واحدة فقط. لديك غرفة بالفعل!",
    myRoom: "غرفتي",
    publicRooms: "الغرف العامة",
    mic: "الميكروفون",
    chat: "الدردشة",
    users: "المستخدمون",
  },
  en: {
    home: "Home",
    messages: "Messages",
    restaurants: "Restaurants",
    profile: "Profile",
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
  },
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        storedLang,
        storedTheme,
        storedUser,
        storedUsers,
        storedRooms,
        storedConvos,
        storedRestaurants,
        storedPasswords,
        storedBlocked,
      ] = await Promise.all([
        AsyncStorage.getItem("language"),
        AsyncStorage.getItem("theme"),
        AsyncStorage.getItem("currentUser"),
        AsyncStorage.getItem("users"),
        AsyncStorage.getItem("rooms"),
        AsyncStorage.getItem("conversations"),
        AsyncStorage.getItem("restaurants"),
        AsyncStorage.getItem("passwords"),
        AsyncStorage.getItem("blockedUsers"),
      ]);

      if (storedLang) setLanguageState(storedLang as Language);
      if (storedTheme) setTheme(storedTheme as Theme);
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedRooms) setRooms(JSON.parse(storedRooms));
      if (storedConvos) setConversations(JSON.parse(storedConvos));
      if (storedRestaurants) setRestaurants(JSON.parse(storedRestaurants));
      if (storedPasswords) setPasswords(JSON.parse(storedPasswords));
      if (storedBlocked) setBlockedUsers(JSON.parse(storedBlocked));
    } catch (e) {}
  };

  const saveUsers = (u: User[]) => {
    setUsers(u);
    AsyncStorage.setItem("users", JSON.stringify(u));
  };
  const saveRooms = (r: Room[]) => {
    setRooms(r);
    AsyncStorage.setItem("rooms", JSON.stringify(r));
  };
  const saveConversations = (c: Conversation[]) => {
    setConversations(c);
    AsyncStorage.setItem("conversations", JSON.stringify(c));
  };
  const saveRestaurants = (r: Restaurant[]) => {
    setRestaurants(r);
    AsyncStorage.setItem("restaurants", JSON.stringify(r));
  };

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

  const isSuperAdmin =
    currentUser?.phone === SUPER_ADMIN_PHONE;

  const login = useCallback(
    async (phone: string, password: string): Promise<boolean> => {
      if (
        phone === SUPER_ADMIN_PHONE &&
        password === SUPER_ADMIN_PASSWORD
      ) {
        let adminUser = users.find((u) => u.phone === SUPER_ADMIN_PHONE);
        if (!adminUser) {
          adminUser = {
            id: generateId(),
            name: "المدير الأعلى",
            phone: SUPER_ADMIN_PHONE,
            email: "admin@hillaconnect.com",
            age: 30,
            address: "الحلة",
            createdAt: Date.now(),
          };
          const newUsers = [...users, adminUser];
          saveUsers(newUsers);
          const newPasswords = {
            ...passwords,
            [adminUser.id]: SUPER_ADMIN_PASSWORD,
          };
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

  const register = useCallback(
    async (
      name: string,
      phone: string,
      email: string,
      age: number,
      address: string,
      password: string
    ): Promise<boolean> => {
      const exists = users.find((u) => u.phone === phone);
      if (exists) return false;

      const newUser: User = {
        id: generateId(),
        name,
        phone,
        email,
        age,
        address,
        createdAt: Date.now(),
      };
      const newUsers = [...users, newUser];
      saveUsers(newUsers);
      const newPasswords = { ...passwords, [newUser.id]: password };
      setPasswords(newPasswords);
      await AsyncStorage.setItem("passwords", JSON.stringify(newPasswords));
      setCurrentUser(newUser);
      await AsyncStorage.setItem("currentUser", JSON.stringify(newUser));
      return true;
    },
    [users, passwords]
  );

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem("currentUser");
  }, []);

  const updateProfile = useCallback(
    async (name: string, avatar?: string) => {
      if (!currentUser) return;
      const updated: User = {
        ...currentUser,
        name,
        ...(avatar !== undefined ? { avatar } : {}),
      };
      setCurrentUser(updated);
      await AsyncStorage.setItem("currentUser", JSON.stringify(updated));
      const updatedUsers = users.map((u) =>
        u.id === updated.id ? updated : u
      );
      saveUsers(updatedUsers);
      const updatedRooms = rooms.map((r) => ({
        ...r,
        ownerName: r.ownerId === updated.id ? updated.name : r.ownerName,
        seatUsers: r.seatUsers.map((su) =>
          su?.id === updated.id ? updated : su
        ),
      }));
      saveRooms(updatedRooms);

      // Keep avatars in conversations in sync too.
      const updatedConversations = conversations.map((c) => ({
        ...c,
        participantUsers: c.participantUsers.map((pu) =>
          pu.id === updated.id ? updated : pu
        ),
      }));
      saveConversations(updatedConversations);
    },
    [currentUser, users, rooms, conversations]
  );

  const createRoom = useCallback(
    async (name: string, image?: string): Promise<Room | null> => {
      if (!currentUser) return null;
      const existingRoom = rooms.find((r) => r.ownerId === currentUser.id);
      if (existingRoom) return null;

      const newRoom: Room = {
        id: generateId(),
        name,
        image,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        seats: Array(6).fill(null),
        seatUsers: Array(6).fill(null),
        chat: [],
        bannedUsers: [],
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
      // Requirement: deleteRoom must call the API.
      // The server might not persist rooms yet, but the request is made.
      try {
        await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
      } catch {
        // If API call fails, we still remove locally to keep UI responsive.
      }
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
        const seats = [...r.seats];
        const seatUsers = [...r.seatUsers];
        const existingSeat = seats.indexOf(currentUser.id);
        if (existingSeat !== -1) {
          seats[existingSeat] = null;
          seatUsers[existingSeat] = null;
        }
        if (seats[seatIndex] === null) {
          seats[seatIndex] = currentUser.id;
          seatUsers[seatIndex] = currentUser;
        }
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
        if (idx !== -1) {
          seats[idx] = null;
          seatUsers[idx] = null;
        }
        const hasGuests = seats.some((s) => s !== null);
        const isOwner = r.ownerId === currentUser.id;
        const isHidden = isOwner && !hasGuests;
        return { ...r, seats, seatUsers, isHidden };
      });
      saveRooms(updated);
    },
    [currentUser, rooms]
  );

  const sendRoomMessage = useCallback(
    (roomId: string, content: string, type: "text" | "image" | "gif" = "text") => {
      if (!currentUser) return;
      const msg: Message = {
        id: generateId(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        content,
        type,
        timestamp: Date.now(),
      };
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        return { ...r, chat: [...r.chat.slice(-100), msg] };
      });
      saveRooms(updated);
    },
    [currentUser, rooms]
  );

  const kickFromRoom = useCallback(
    (roomId: string, userId: string) => {
      const updated = rooms.map((r) => {
        if (r.id !== roomId) return r;
        const seats = r.seats.map((s) => (s === userId ? null : s));
        const seatUsers = r.seatUsers.map((s) =>
          s?.id === userId ? null : s
        );
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
        const seatUsers = r.seatUsers.map((s) =>
          s?.id === userId ? null : s
        );
        const bannedUsers = [...r.bannedUsers, userId];
        return { ...r, seats, seatUsers, bannedUsers };
      });
      saveRooms(updated);
    },
    [rooms]
  );

  const getConversation = useCallback(
    (otherUserId: string): Conversation => {
      if (!currentUser) throw new Error("Not authenticated");
      const existing = conversations.find(
        (c) =>
          c.participants.includes(currentUser.id) &&
          c.participants.includes(otherUserId)
      );
      if (existing) return existing;
      const otherUser = users.find((u) => u.id === otherUserId);
      const newConvo: Conversation = {
        id: generateId(),
        participants: [currentUser.id, otherUserId],
        participantUsers: [currentUser, otherUser!].filter(Boolean),
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
      type: "text" | "image" = "text"
    ) => {
      if (!currentUser) return;
      const msg: PrivateMessage = {
        id: generateId(),
        senderId: currentUser.id,
        receiverId,
        content,
        type,
        timestamp: Date.now(),
        read: false,
      };
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = (c as any).messages || [];
        return {
          ...c,
          messages: [...msgs, msg],
          lastMessage: msg,
          updatedAt: Date.now(),
        };
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

  const addRestaurant = useCallback(
    (data: Omit<Restaurant, "id" | "createdAt">) => {
      const r: Restaurant = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
      };
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
    (id: string) => {
      saveRestaurants(restaurants.filter((r) => r.id !== id));
    },
    [restaurants]
  );

  const banUser = useCallback(
    (userId: string) => {
      const updated = users.map((u) =>
        u.id === userId ? { ...u, isBanned: true } : u
      );
      saveUsers(updated);
    },
    [users]
  );

  const unbanUser = useCallback(
    (userId: string) => {
      const updated = users.map((u) =>
        u.id === userId ? { ...u, isBanned: false } : u
      );
      saveUsers(updated);
    },
    [users]
  );

  const t = useCallback(
    (key: string) => translations[language][key] ?? key,
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      toggleTheme,
      currentUser,
      isAuthenticated: !!currentUser,
      isSuperAdmin,
      users,
      rooms,
      conversations,
      restaurants,
      login,
      register,
      logout,
      updateProfile,
      createRoom,
      deleteRoom,
      joinRoomSeat,
      leaveRoomSeat,
      sendRoomMessage,
      kickFromRoom,
      banFromRoom,
      getConversation,
      sendPrivateMessage,
      blockUser,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      banUser,
      unbanUser,
      t,
    }),
    [
      language,
      setLanguage,
      theme,
      toggleTheme,
      currentUser,
      isSuperAdmin,
      users,
      rooms,
      conversations,
      restaurants,
      login,
      register,
      logout,
      updateProfile,
      createRoom,
      deleteRoom,
      joinRoomSeat,
      leaveRoomSeat,
      sendRoomMessage,
      kickFromRoom,
      banFromRoom,
      getConversation,
      sendPrivateMessage,
      blockUser,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      banUser,
      unbanUser,
      t,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
