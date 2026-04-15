import { Stack } from "expo-router";
import React from "react";
import { useApp } from "@/context/AppContext";

export default function AuthLayout() {
  const { theme } = useApp();
  const bg = theme === "dark" ? "#000000" : "#FFFFFF";
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
