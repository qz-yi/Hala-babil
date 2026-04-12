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
│   ├── api-server/         # Express API server (port 3001)
│   └── hilla-connect-v2/   # Expo React Native mobile app (port 8080)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── pnpm-workspace.yaml
```

## Workflows

- **Start Backend**: `cd artifacts/api-server && PORT=3001 pnpm run dev` (port 3001)
- **Start Expo**: `PORT=8080 pnpm --filter @workspace/hilla-connect-v2 run dev` (port 8080)

---

## Hilla Connect Mobile App (`artifacts/hilla-connect`) — v3.0

Arabic-first social communication platform built with Expo React Native.

### Auth
- Login / Register / Forgot Password
- Super Admin: `07719820537` / `1w2q3r4eSATHA2026$`

### Tab Navigation (v2.0)
1. **الرئيسية (Home)** — Instagram-like feed with stories bar + post cards + header icons (messages + notifications)
2. **الغرف (Rooms)** — Voice Rooms with room code search, 8 numbered seats, admin panel
3. **الريلز (Reels)** — Short video reels feed
4. **المطاعم (Restaurants)** — Restaurant directory with 18 Iraqi governorate geo-filtering, menu + call/WhatsApp/order system
5. **الملف (Profile)** — Personal profile with grid (posts/reels), right-side drawer (settings/activity/follow-requests)

### Geographic Services System (v3.0 — New)

#### 18 Iraqi Governorates
- `IRAQI_GOVERNORATES` constant exported from AppContext (18 governorates)
- `GovernorateImage` interface: `{ name: string; image?: string }` stored in AsyncStorage
- `Restaurant` now has `governorate: string` field (required when adding)

#### Admin — Governorate Management
- New "المحافظات" tab in admin panel with oval image grid for all 18 governorates
- Tap any oval to pick/replace photo from gallery
- Checkmark indicator on governorates that have uploaded images

#### Admin — Adding Restaurant (Mandatory Step)
- Step 1: **اختيار المحافظة** — oval grid showing all 18 governorates with uploaded images
- Cannot proceed to step 2 without selecting a governorate
- Step 2: Restaurant details (name, phone, WhatsApp, category, image, menu items)
- Governorate badge shown in restaurant list in admin

#### User — Restaurants Screen
- Horizontal scrollable governorate picker bar at the top with oval images
- "الكل" (All) button to show all restaurants
- Selecting a governorate filters to show only restaurants from that governorate
- Small `📍 governorate` tag shown on each restaurant card
- Empty state message if no restaurants in selected governorate

#### User — Restaurant Detail + Order System
- Governorate badge shown in hero section
- Hint banner: "اضغط على أي صنف لإرسال طلبك مباشرة للمطعم"
- Each menu item is clickable → opens bottom-sheet order modal
- Order modal shows: item image, name, description, price, restaurant info
- **"إرسال طلب" button** opens WhatsApp with pre-filled order message in Arabic
- Mini WhatsApp "طلب" badge on each menu item row

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
- User info row (avatar+name) at top is clickable → navigates to profile
- Views counter at bottom-left, heart+share buttons at bottom-right above reply bar

#### Follow System
- Follow/unfollow any user
- Private accounts: follow requests + approval flow
- Follow requests shown in profile drawer ("الطلبات" tab)
- Pending request status shown on profile/[id] screen

#### Notifications (`/notifications`)
- Full notification center with type icons (follow, like, comment, post, message)
- Mark individual or all as read
- Badge count on home header

#### Voice Rooms (v2 — Full Redesign)
- **Room Identity**: Every room gets a unique 8-digit `roomCode` on creation; shown on card with `#` badge
- **Search by code**: Rooms screen search detects numeric input (6+ digits) and offers direct navigation to room
- **Rooms persist**: Rooms no longer auto-hide when all users leave; always searchable
- **8 Numbered Seats**: Grid of 8 seats (NO.1–NO.8), each labeled with its number
- **Lock Seat**: Admin can lock/unlock any seat from the seat card; locked seats show 🔒 icon, block entry
- **Announcement Card**: Shown at top of room if admin has set one; admin can edit via admin panel
- **Admin Panel**: Settings icon (⚙️) in header opens bottom sheet with: change background, remove background, edit announcement
- **Background Change**: Admin picks image from phone gallery; shown as full-screen blurred background
- **System Messages**: Entry/exit events automatically shown as centered grey bubbles in chat (e.g. "علي دخل الغرفة 🎤")
- **Share Room**: 🔗 button in header opens bottom sheet with room poster + friends list; sends DM invite with room code
- **Floating Reactions**: ⭐ ❤️ 😂 buttons with animated floating reactions
- Role system: users enter as Listeners (no mic, no seat) by default
- "هل تريد الصعود للميكروفون؟" confirmation modal before joining a seat (shows NO.X)
- Leave Seat button (↓ arrow) lets speakers leave seat without leaving room
- Room chat supports image/video: paperclip button opens attach menu, media shown in chat bubbles (tap to expand)
- Admin controls: mute/unmute + kick any user via UserActionsModal; muted badge shown on member list
- `mutedUsers`, `lockedSeats`, `background`, `announcement`, `roomCode` persisted in Room state

#### Multimedia DMs
- Chat screen (`/chat/[id]`) supports: text, image (picker), video (picker), audio (simulated mic)
- Attachment menu with image/video/audio buttons
- Voice call + video call buttons (UI ready, "coming soon" alert)
- Image preview in chat bubble
- Conversations list shows proper previews for shared content: 📎 منشور / 📷 صورة / 🎥 فيديو / 🎤 صوتية

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

### v3.0 Improvements (Latest)

#### Stories
- **Long press pause**: `onPressIn`/`onPressOut` on tap areas pause/resume the progress timer and animation
- **Auto-advance to next user**: When a user's last story ends, automatically navigates to the next user's stories (using `router.replace`) instead of going back to home
- **Filter real application**: Story filters now apply via `expo-image-manipulator` before publishing (not just visual overlay)
- **Filter preview overlay**: Shows live overlay on image while selecting filter, with active filter badge

#### Post Creation
- **Image/Video tabs**: Separate tabs at top of create post screen — image tab uses `ImagePicker.MediaTypeOptions.Images`, video tab uses `Videos`
- **Video as permanent post**: Videos published through the video tab become regular posts (not just reels)
- **Visible CROP button**: Bottom-right of image preview with dark pill background, label "قص"
- **Filter applied via ImageManipulator**: Filters processed with `expo-image-manipulator` before saving

#### Custom Modals (replaced system Alert.alert)
- **Post options modal** (`post/[id].tsx`): Frosted-glass bottom sheet with hide/delete options; delete shows a confirmation step with red trash icon and "لا يمكن التراجع" warning
- **Block user modal** (`chat/[id].tsx`): Bottom sheet with large slash icon, user name in subtitle, and styled block/cancel buttons

#### Keyboard & Comments
- `KeyboardAvoidingView` wrapping the comments sheet for proper keyboard avoidance
- `returnKeyType="send"` on comment and reply inputs
- Comments already supported `onSubmitEditing={handleSend}`

### Important Notes
- Never define components inside other components (causes keyboard focus loss)
- Use `Date.now().toString() + Math.random()` for IDs (no uuid package)
- FlatList with `inverted` prop for chat (not scrollToEnd)
- Use `useToast()` hook from `@/components/Toast` for all user feedback
- Stories expire after 24 hours (checked via `expiresAt` timestamp)
- Follow status: none → pending (private accounts) → accepted
- Theme toggle already wired via `Switch` in profile drawer → `toggleTheme()` in AppContext, persisted in AsyncStorage
