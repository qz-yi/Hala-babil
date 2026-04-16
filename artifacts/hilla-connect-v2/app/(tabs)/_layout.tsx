import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router, useSegments } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Dimensions, PanResponder, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

const { width: SW } = Dimensions.get("window");
const TAB_ROUTES = ["index", "rooms", "reels", "restaurants", "profile"];
const EDGE_WIDTH = Math.round(SW * 0.08); // 8% of screen width for edge detection

function NativeTabLayout() {
  const { t, isRestaurantOwner } = useApp();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{t("home")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="rooms">
        <Icon sf={{ default: "mic", selected: "mic.fill" }} />
        <Label>{t("rooms")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reels">
        <Icon sf={{ default: "film", selected: "film.fill" }} />
        <Label>{t("reels")}</Label>
      </NativeTabs.Trigger>
      {isRestaurantOwner ? (
        <NativeTabs.Trigger name="my-restaurant">
          <Icon sf={{ default: "storefront", selected: "storefront.fill" }} />
          <Label>{t("myRestaurant")}</Label>
        </NativeTabs.Trigger>
      ) : (
        <NativeTabs.Trigger name="restaurants">
          <Icon sf={{ default: "fork.knife", selected: "fork.knife" }} />
          <Label>{t("restaurants")}</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>{t("profile")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function useSwipeTabNav() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] ?? "index";
  const currentIdx = TAB_ROUTES.indexOf(currentRoute);

  const navigateTab = (dir: 1 | -1) => {
    const nextIdx = currentIdx + dir;
    if (nextIdx < 0 || nextIdx >= TAB_ROUTES.length) return;
    const route = TAB_ROUTES[nextIdx];
    router.replace(`/(tabs)/${route === "index" ? "" : route}` as any);
  };

  const leftEdgePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.pageX < EDGE_WIDTH,
      onMoveShouldSetPanResponder: (e, gs) =>
        e.nativeEvent.pageX < EDGE_WIDTH && gs.dx > 12 && Math.abs(gs.dy) < 40,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SW * 0.25) navigateTab(-1);
      },
    })
  ).current;

  const rightEdgePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.pageX > SW - EDGE_WIDTH,
      onMoveShouldSetPanResponder: (e, gs) =>
        e.nativeEvent.pageX > SW - EDGE_WIDTH && gs.dx < -12 && Math.abs(gs.dy) < 40,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -(SW * 0.25)) navigateTab(1);
      },
    })
  ).current;

  return { leftEdgePan, rightEdgePan };
}

function ClassicTabLayout() {
  const { t, theme, isRestaurantOwner } = useApp();
  const safeAreaInsets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isDark = theme === "dark";
  const { leftEdgePan, rightEdgePan } = useSwipeTabNav();

  const tabBarBg = isDark ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.95)";
  const borderColor = isDark ? "#262626" : "#E5E5E5";
  const activeColor = isDark ? "#FFFFFF" : "#000000";
  const inactiveColor = isDark ? "#636366" : "#9CA3AF";
  const bgColor = isDark ? "#000000" : "#FFFFFF";

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Left edge swipe zone */}
      <View
        {...leftEdgePan.panHandlers}
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: EDGE_WIDTH, zIndex: 999 }}
        pointerEvents="box-only"
      />
      {/* Right edge swipe zone */}
      <View
        {...rightEdgePan.panHandlers}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: EDGE_WIDTH, zIndex: 999 }}
        pointerEvents="box-only"
      />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : tabBarBg,
          borderTopWidth: 0.5,
          borderTopColor: borderColor,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)" }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: tabBarBg, borderTopWidth: 0.5, borderTopColor: borderColor },
              ]}
            />
          ),
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
            ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: t("rooms"),
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "mic.fill" : "mic"} tintColor={color} size={22} />
            ) : (
              <Feather name="mic" size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
            ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: t("reels"),
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "film.fill" : "film"} tintColor={color} size={22} />
            ) : (
              <Feather name="film" size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
            ),
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: t("restaurants"),
          href: isRestaurantOwner ? null : undefined,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="fork.knife" tintColor={color} size={22} />
            ) : (
              <Feather name="coffee" size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
            ),
        }}
      />
      <Tabs.Screen
        name="my-restaurant"
        options={{
          title: t("myRestaurant"),
          href: isRestaurantOwner ? undefined : null,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "storefront.fill" : "storefront"} tintColor={color} size={22} />
            ) : (
              <Feather name="shopping-bag" size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "person.fill" : "person"} tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
            ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
