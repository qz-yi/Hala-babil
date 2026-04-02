import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

function NativeTabLayout() {
  const { t } = useApp();
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
      <NativeTabs.Trigger name="restaurants">
        <Icon sf={{ default: "fork.knife", selected: "fork.knife" }} />
        <Label>{t("restaurants")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>{t("profile")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const { t, theme } = useApp();
  const safeAreaInsets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isDark = theme === "dark";

  const tabBarBg = isDark ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.95)";
  const borderColor = isDark ? "#262626" : "#E5E5E5";
  const activeColor = isDark ? "#FFFFFF" : "#000000";
  const inactiveColor = isDark ? "#636366" : "#9CA3AF";

  return (
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
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="fork.knife" tintColor={color} size={22} />
            ) : (
              <Feather name="coffee" size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
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
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
