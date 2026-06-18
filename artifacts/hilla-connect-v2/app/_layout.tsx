import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { ToastProvider } from "@/components/Toast";
import { FloatingRoomWidget } from "@/components/FloatingRoomWidget";
import { FloatingCallBanner } from "@/components/FloatingCallBanner";
import { IncomingCallOverlay } from "@/components/IncomingCallOverlay";
import { useThemeStore } from "@/store/themeStore";
import { useCallStore } from "@/store/callStore";
import { getSocket, registerUserSocket } from "@/hooks/useSocket";
import { EngineProvider } from "@/context/EngineContext";
import { GlobalEngineLayer } from "@/components/engines/GlobalEngineLayer";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const Notifications = Platform.OS !== "web"
  ? require("expo-notifications")
  : null;

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

async function registerForPushNotifications() {
  if (!Notifications) return null;
  if (Platform.OS === "web") return null;

  const Device = require("expo-device");
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

function CallSetup() {
  const { currentUser } = useApp();
  const { setIncomingCall, incomingCall } = useCallStore();

  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket();
    registerUserSocket(currentUser.id);

    // ── Presence: re-register on every reconnect ──────────────────────────
    const onReconnect = () => registerUserSocket(currentUser.id);
    socket.on("reconnect", onReconnect);

    // ── Receive incoming call from server (Presence Manager broadcast) ────
    const onIncomingCall = (payload: {
      fromUserId: string;
      fromUserName: string;
      fromUserAvatar: string;
      callRoomId: string;
      callType: "audio" | "video";
    }) => {
      // Ignore if already in an active call
      if (useCallStore.getState().activeCall) return;
      setIncomingCall({
        callRoomId: payload.callRoomId,
        fromUserId: payload.fromUserId,
        fromUserName: payload.fromUserName,
        fromUserAvatar: payload.fromUserAvatar,
        callType: payload.callType,
      });
    };
    socket.on("incoming-call", onIncomingCall);

    // ── Dismiss ringing if another device answered (cross-device sync) ────
    const onCallDismissed = () => {
      setIncomingCall(null);
    };
    socket.on("call-dismissed", onCallDismissed);

    // ── Caller cancelled before we answered ──────────────────────────────
    const onCallCancelled = () => {
      setIncomingCall(null);
    };
    socket.on("call-cancelled", onCallCancelled);

    return () => {
      socket.off("reconnect", onReconnect);
      socket.off("incoming-call", onIncomingCall);
      socket.off("call-dismissed", onCallDismissed);
      socket.off("call-cancelled", onCallCancelled);
    };
  }, [currentUser?.id]);

  return null;
}

function NotificationSetup() {
  const { currentUser } = useApp();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!currentUser || !Notifications) return;

    // Fail-safe: notifications may not be available in Expo Go on all platforms
    let registered = false;
    try {
      registerForPushNotifications().catch(() => {});

      notificationListener.current = Notifications.addNotificationReceivedListener(
        (_notification: any) => {},
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          try {
            const data = response?.notification?.request?.content?.data as any;
            if (!data) return;
            const { type, referenceId, senderId } = data;
            // POP_TO_TOP guard: use replace instead of push to avoid invalid stack
            // context errors when navigating from a notification to a tab screen
            const safeNavigate = (path: string) => {
              try {
                router.push(path as any);
              } catch {
                try { router.replace(path as any); } catch { /* ignore */ }
              }
            };
            if (type === "message" && senderId) {
              safeNavigate(`/chat/${senderId}`);
            } else if ((type === "comment" || type === "like" || type === "mention") && referenceId) {
              safeNavigate(`/post/${referenceId}`);
            } else if (type === "follow_request" || type === "follow_accept") {
              safeNavigate(`/profile/${senderId}`);
            } else if (type === "story" && senderId) {
              safeNavigate(`/story/${senderId}`);
            } else {
              safeNavigate("/notifications");
            }
          } catch { /* ignore malformed notification */ }
        },
      );
      registered = true;
    } catch {
      // expo-notifications not available in this environment (Expo Go web / simulator)
    }

    return () => {
      if (registered) {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      }
    };
  }, [currentUser?.id]);

  return null;
}

function RootLayoutNavInner() {
  // useColors() applies engine token overrides (Creator → #050505, Cinematic → deep dark, etc.)
  const colors = useColors();
  const bg = colors.background;
  const dur = colors.animationDuration;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Global engine visual layer — renders above all content, no pointer events */}
      <GlobalEngineLayer />
      <CallSetup />
      <NotificationSetup />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: bg },
          animation: "fade_from_bottom",
          animationDuration: dur,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: bg } }} />
        <Stack.Screen name="room/[id]" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="chat/info/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="restaurant/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="admin" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="create-post" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="create-story" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="finalize-post" options={{ presentation: "modal", headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="story/[userId]" options={{ presentation: "fullScreenModal", headerShown: false, animation: "fade" }} />
        <Stack.Screen name="change-password" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="group/info/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="group/create" options={{ headerShown: false, animation: "slide_from_bottom", presentation: "modal" }} />
        <Stack.Screen name="user-posts/[userId]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="call/[id]" options={{ presentation: "fullScreenModal", headerShown: false, animation: "fade" }} />
      </Stack>
      <FloatingCallBanner />
      <FloatingRoomWidget />
      <IncomingCallOverlay />
    </View>
  );
}

function RootLayoutNav() {
  return (
    <EngineProvider>
      <RootLayoutNavInner />
    </EngineProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Hide splash as soon as possible — don't block on fonts
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Never block rendering waiting for fonts — use system fallback if needed

  return (
    <SafeAreaProvider style={{ backgroundColor: "#000000" }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000000" }}>
              <KeyboardProvider>
                <ToastProvider>
                  <RootLayoutNav />
                </ToastProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
