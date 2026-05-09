import { Stack } from "expo-router";
import React from "react";
import { useThemeStore } from "@/store/themeStore";

export default function AuthLayout() {
  const bg = useThemeStore((s) => s.tokens.background);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
