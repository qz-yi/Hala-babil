import AsyncStorage from "@react-native-async-storage/async-storage";

const getApiBase = () => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
};

const TOKEN_KEY = "zentram_jwt_token";
const SERVER_USER_KEY = "zentram_server_user";

// ─── Token management ─────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return AsyncStorage.removeItem(TOKEN_KEY);
}

// ─── Base fetch with auth ─────────────────────────────────────────────────────

async function apiFetch(
  path: string,
  options: RequestInit = {},
  retries = 2,
): Promise<Response> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const base = getApiBase();
  const url = `${base}/api${path}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const res = await fetch(url, { ...options, headers, signal: controller.signal });
        return res;
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface ServerUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phoneNumber?: string | null;
  image: string | null;
  bio: string | null;
  accountType: string;
  primaryGovernorate: string | null;
  role: string;
  isBanned: boolean;
  isActive: boolean;
  createdAt: number;
}

export const authApi = {
  async register(params: {
    name: string;
    username: string;
    email: string;
    password: string;
    governorate?: string;
  }): Promise<{ user: ServerUser; token: string } | { error: string; message: string }> {
    try {
      const res = await apiFetch("/users/register", {
        method: "POST",
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await setToken(data.token);
        await AsyncStorage.setItem(SERVER_USER_KEY, JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      return { error: "network_error", message: "تعذّر الاتصال بالخادم" };
    }
  },

  async login(params: {
    identifier: string;
    password: string;
  }): Promise<{ user: ServerUser; token: string } | { error: string; message: string }> {
    try {
      const res = await apiFetch("/users/login", {
        method: "POST",
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await setToken(data.token);
        await AsyncStorage.setItem(SERVER_USER_KEY, JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      return { error: "network_error", message: "تعذّر الاتصال بالخادم" };
    }
  },

  async getMe(): Promise<ServerUser | null> {
    try {
      const res = await apiFetch("/users/me");
      if (!res.ok) return null;
      const data = await res.json();
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  async updateProfile(params: Partial<{
    name: string;
    username: string;
    bio: string;
    image: string;
    primaryGovernorate: string;
    accountType: string;
    pushToken: string;
  }>): Promise<ServerUser | null> {
    try {
      const res = await apiFetch("/users/me", {
        method: "PUT",
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.user) {
        await AsyncStorage.setItem(SERVER_USER_KEY, JSON.stringify(data.user));
      }
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await apiFetch("/users/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: "network_error" };
    }
  },

  getCachedUser(): ServerUser | null {
    return null; // Async, use getMe() instead
  },
};

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  async search(q: string): Promise<ServerUser[]> {
    try {
      const res = await apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.users ?? [];
    } catch {
      return [];
    }
  },

  async getUser(userId: string): Promise<ServerUser | null> {
    try {
      const res = await apiFetch(`/users/${userId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  async getFollowers(userId: string) {
    try {
      const res = await apiFetch(`/users/${userId}/followers`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.followers ?? [];
    } catch {
      return [];
    }
  },

  async getFollowing(userId: string) {
    try {
      const res = await apiFetch(`/users/${userId}/following`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.following ?? [];
    } catch {
      return [];
    }
  },
};

// ─── Rooms API ────────────────────────────────────────────────────────────────

export interface ServerRoom {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  roomCode: string | null;
  ownerId: string;
  ownerName: string | null;
  isVoiceActive: boolean;
  isHidden: boolean;
  seats: (string | null)[];
  bannedUsers: string[];
  mutedUsers: string[];
  chat: unknown[];
  presentUserIds: string[];
  createdAt: number;
}

export const roomsApi = {
  async listRooms(): Promise<ServerRoom[]> {
    try {
      const res = await apiFetch("/rooms");
      if (!res.ok) return [];
      const data = await res.json();
      return data.rooms ?? [];
    } catch {
      return [];
    }
  },

  async createRoom(params: {
    name: string;
    description?: string;
    image?: string;
    ownerId: string;
    ownerName: string;
    roomCode: string;
    seats?: (string | null)[];
  }): Promise<ServerRoom | null> {
    try {
      const res = await apiFetch("/rooms", {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.room ?? null;
    } catch {
      return null;
    }
  },

  async deleteRoom(roomId: string): Promise<void> {
    try {
      await apiFetch(`/rooms/${roomId}`, { method: "DELETE" });
    } catch {
      // best effort
    }
  },

  async joinRoom(roomId: string, params: {
    userId: string;
    userName?: string;
    userImage?: string;
    seatIndex?: number;
  }): Promise<void> {
    try {
      await apiFetch(`/rooms/${roomId}/join`, {
        method: "POST",
        body: JSON.stringify(params),
      });
    } catch {
      // best effort — local state still updated
    }
  },

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      await apiFetch(`/rooms/${roomId}/leave`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
    } catch {
      // best effort
    }
  },

  async getParticipants(roomId: string) {
    try {
      const res = await apiFetch(`/rooms/${roomId}/participants`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.participants ?? [];
    } catch {
      return [];
    }
  },

  async sendRoomMessage(roomId: string, params: {
    userId: string;
    userName: string;
    content: string;
    type?: string;
  }) {
    try {
      const res = await apiFetch(`/rooms/${roomId}/message`, {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.message ?? null;
    } catch {
      return null;
    }
  },
};

// ─── Messages API ─────────────────────────────────────────────────────────────

export interface ServerMessage {
  id: string;
  chatId: number;
  senderId: string;
  receiverId: string;
  content: string | null;
  mediaUrl: string | null;
  type: string;
  duration: number | null;
  isRead: boolean;
  isDeleted: boolean;
  sharedContent: unknown | null;
  replyToId: number | null;
  timestamp: number;
  read: boolean;
}

export interface ServerChat {
  id: number;
  user1Id: string;
  user2Id: string;
  lastActivity: number;
  lastMessage: unknown | null;
  otherUserId: string | null;
}

export const messagesApi = {
  async listChats(userId: string): Promise<ServerChat[]> {
    try {
      const res = await apiFetch(`/chats?userId=${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.chats ?? [];
    } catch {
      return [];
    }
  },

  async findOrCreateChat(userId: string, otherUserId: string): Promise<ServerChat | null> {
    try {
      const res = await apiFetch("/chats", {
        method: "POST",
        body: JSON.stringify({ userId, otherUserId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.chat ?? null;
    } catch {
      return null;
    }
  },

  async getMessages(chatId: number, opts?: { limit?: number; before?: number }): Promise<ServerMessage[]> {
    try {
      const params = new URLSearchParams();
      if (opts?.limit) params.set("limit", String(opts.limit));
      if (opts?.before) params.set("before", String(opts.before));
      const res = await apiFetch(`/chats/${chatId}/messages?${params}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages ?? [];
    } catch {
      return [];
    }
  },

  async sendMessage(chatId: number, params: {
    senderId: string;
    receiverId: string;
    content?: string;
    mediaUrl?: string;
    type?: string;
    duration?: number;
    sharedContent?: unknown;
    replyToId?: number;
  }): Promise<ServerMessage | null> {
    try {
      const res = await apiFetch(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.message ?? null;
    } catch {
      return null;
    }
  },

  async markAllRead(chatId: number, userId: string): Promise<void> {
    try {
      await apiFetch(`/chats/${chatId}/read-all`, {
        method: "PUT",
        body: JSON.stringify({ userId }),
      });
    } catch {
      // best effort
    }
  },

  async deleteMessage(chatId: number, messageId: string): Promise<void> {
    try {
      await apiFetch(`/chats/${chatId}/messages/${messageId}`, { method: "DELETE" });
    } catch {
      // best effort
    }
  },
};

// ─── Posts API ────────────────────────────────────────────────────────────────

export const postsApi = {
  async listPosts(userId?: string, opts?: { limit?: number; before?: number }) {
    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (opts?.limit) params.set("limit", String(opts.limit));
      if (opts?.before) params.set("before", String(opts.before));
      const res = await apiFetch(`/posts?${params}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.posts ?? [];
    } catch {
      return [];
    }
  },

  async createPost(params: {
    creatorId: string;
    creatorName?: string;
    creatorImage?: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
  }) {
    try {
      const res = await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.post ?? null;
    } catch {
      return null;
    }
  },

  async likePost(postId: string, userId: string) {
    try {
      const res = await apiFetch(`/posts/${postId}/like`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async addComment(postId: string, params: {
    userId: string;
    userName?: string;
    userImage?: string;
    content: string;
  }) {
    try {
      const res = await apiFetch(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.comment ?? null;
    } catch {
      return null;
    }
  },

  async deletePost(postId: string) {
    try {
      await apiFetch(`/posts/${postId}`, { method: "DELETE" });
    } catch {
      // best effort
    }
  },
};

// ─── Follows API ──────────────────────────────────────────────────────────────

export const followsApi = {
  async toggleFollow(followerId: string, targetUserId: string): Promise<{ following: boolean } | null> {
    try {
      const res = await apiFetch(`/follows/${targetUserId}`, {
        method: "POST",
        body: JSON.stringify({ followerId }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async checkFollowStatus(followerId: string, targetUserId: string): Promise<boolean> {
    try {
      const res = await apiFetch(`/follows/status/${targetUserId}?followerId=${followerId}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.following ?? false;
    } catch {
      return false;
    }
  },
};
