# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── hilla-connect/      # Expo React Native mobile app (main product)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── pnpm-workspace.yaml
```

---

## Hilla Connect Mobile App (`artifacts/hilla-connect`) — v3.0

Arabic-first social communication platform built with Expo React Native.

### Auth
- Login / Register / Forgot Password
- Super Admin: `07719820537` / `1w2q3r4eSATHA2026$`

### Tab Navigation (v2.0)
1. **الرئيسية (Home)** — Instagram-like feed with stories bar + post cards + header icons (messages + notifications)
2. **الغرف (Rooms)** — Voice Rooms (moved from old home tab); includes user search bar
3. **الريلز (Reels)** — Short video reels feed
4. **المطاعم (Restaurants)** — Restaurant directory with menu + call/WhatsApp
5. **الملف (Profile)** — Personal profile with grid (posts/reels), right-side drawer (settings/activity/follow-requests)

### New v2.0 Features

#### Feed & Posts
- Home feed shows posts from followed users (+ own posts)
- Post creation (`/create-post`) with image/video/text
- Like, comment on posts with notifications
- Post grid in profile screen

#### Stories (24hr expiry)
- Stories bar at top of home feed — my story first, then followed users
- Create story (`/create-story`) — image/video + caption + filters
- Story viewer (`/story/[userId]`) — progress bar animation, tap left/right navigation
- Unread story ring highlighted in pink/red

#### Follow System
- Follow/unfollow any user
- Private accounts: follow requests + approval flow
- Follow requests shown in profile drawer ("الطلبات" tab)
- Pending request status shown on profile/[id] screen

#### Notifications (`/notifications`)
- Full notification center with type icons (follow, like, comment, post, message)
- Mark individual or all as read
- Badge count on home header

#### Multimedia DMs
- Chat screen (`/chat/[id]`) supports: text, image (picker), video (picker), audio (simulated mic)
- Attachment menu with image/video/audio buttons
- Voice call + video call buttons (UI ready, "coming soon" alert)
- Image preview in chat bubble

#### Profile Redesign (`/profile`)
- Avatar with camera overlay (tap to change)
- Bio + account type badge (public/private)
- Follow stats: posts / followers / following
- Posts grid tab + Reels grid tab
- Right-side drawer with 3 sub-tabs:
  - الإعدادات: account type, dark mode toggle, language, admin panel, logout
  - نشاطي: liked reels + recent comments
  - الطلبات: pending follow requests with accept/reject

#### Other User Profile (`/profile/[id]`)
- Follow button (follow / pending / following / unfollow)
- Story ring (tap to view story)
- Message button
- Private account lock screen for non-followers
- Posts + Reels grid tabs

### Key Files (v2.0)
- `context/AppContext.tsx` — Full state: auth, rooms, posts, stories, follows, notifications, feed, activity
- `app/(tabs)/_layout.tsx` — 5 tabs (home, rooms, reels, restaurants, profile); messages hidden from bar
- `app/(tabs)/index.tsx` — Home feed with stories bar + create post bar + post cards
- `app/(tabs)/rooms.tsx` — Voice rooms (moved here from old home)
- `app/(tabs)/profile.tsx` — Full profile with grid, drawer, edit modal
- `app/profile/[id].tsx` — Other user profile with follow system
- `app/notifications.tsx` — Notification center
- `app/create-post.tsx` — Post creation studio (image/video/text)
- `app/create-story.tsx` — Story creation (image/video + filters)
- `app/story/[userId].tsx` — Story viewer with progress bars
- `app/chat/[id].tsx` — Chat with multimedia DM support (image/video/audio)
- `constants/colors.ts` — Full light/dark theme + ACCENT_COLORS array
- `lib/db/src/schema/index.ts` — Full DB schema: posts, postLikes, postComments, stories, storyViews, follows, notifications

### Data Persistence
All data stored in AsyncStorage (no live backend DB from mobile). The API server handles Agora token generation only.

### Super Admin
- Phone: `07719820537`, Password: `1w2q3r4eSATHA2026$`
- Crown badge on profile, gold theme, access to admin panel from drawer

### Important Notes
- Never define components inside other components (causes keyboard focus loss)
- Use `Date.now().toString() + Math.random()` for IDs (no uuid package)
- FlatList with `inverted` prop for chat (not scrollToEnd)
- Use `useToast()` hook from `@/components/Toast` for all user feedback
- Stories expire after 24 hours (checked via `expiresAt` timestamp)
- Follow status: none → pending (private accounts) → accepted
