---
name: Hilla Connect Cloud Sync Architecture
description: How AppContext is wired to cloud API + real-time socket for Zentram/Hilla Connect
---

# Cloud Sync Architecture

## API Service Layer (`artifacts/hilla-connect-v2/services/api.ts`)
- `authApi` — register/login/me/updateProfile/changePassword
- `usersApi` — search/getUser/getFollowers/getFollowing
- `roomsApi` — listRooms/createRoom/deleteRoom/joinRoom/leaveRoom/getParticipants/sendRoomMessage
- `messagesApi` — listChats/findOrCreateChat/getMessages/sendMessage/markAllRead/deleteMessage
- `postsApi` — listPosts/createPost/likePost/addComment/deletePost
- `followsApi` — toggleFollow/checkFollowStatus
- Token stored in AsyncStorage key `zentram_jwt_token`

## AppContext Wire-up Pattern (cloud-first with local fallback)
- `register` → authApi.register first, fallback to local AsyncStorage creation
- `login` → authApi.login first, fallback to local password check
- `createRoom` → local state immediately, then roomsApi.createRoom fire-and-forget
- `joinRoomPresence` → local state + roomsApi.joinRoom + socket `room:subscribe`
- `leaveRoomPresence/leaveRoomFull` → local state + roomsApi.leaveRoom + socket `room:unsubscribe`
- `sendPrivateMessage` → local state + messagesApi.findOrCreateChat then sendMessage + socket `private-message`
- `searchUsers` → returns local immediately, kicks off usersApi.search to update cache

## Socket Events
- Client emits `private-message` → server relays to `user_${receiverId}` room
- Client emits `room:subscribe/unsubscribe` → server manages room socket rooms
- Client emits `register-user` → server creates `user_${userId}` presence room
- AppContext listens for `private-message` events → updates conversations state

## Helper
- `serverUserToLocal(su: ServerUser): User` — maps API user shape to local User interface

## Port Architecture (dev)
- `API Server` workflow: port 3000 — used by Hilla Connect static proxy
- `artifacts/api-server: API Server` workflow: port 3001 — dev hot-reload
- `Hilla Connect` workflow: port 5000 — static web export server

**Why:** Both API Server workflows must run simultaneously — port 3000 for Hilla Connect's proxy, port 3001 for dev workflow.

## DB User IDs
- DB returns serial integers as strings (e.g., "1", "2")
- `ServerUser.id` is always a string representation of the integer
