import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
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
  const colors = Colors[theme];
  const safeAreaInsets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.backgroundSecondary,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={theme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: t("rooms"),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="mic.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="mic" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: t("reels"),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="film.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="film-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: t("restaurants"),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="fork.knife" tintColor={color} size={24} />
            ) : (
              <Ionicons name="restaurant" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="person" size={22} color={color} />
            ),
        }}
      />
      {/* Messages: متاح عبر الهيدر، مخفي من شريط التبويب */}
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
