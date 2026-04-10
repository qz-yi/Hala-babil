import { router } from "expo-router";
import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";
import type { User } from "@/context/AppContext";

interface MentionTextProps {
  text: string;
  users: User[];
  style?: StyleProp<TextStyle>;
  mentionStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export default function MentionText({ text, users, style, mentionStyle, numberOfLines }: MentionTextProps) {
  const parts = text.split(/(@[\w\u0600-\u06FF]+)/g);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const handle = part.slice(1);
          const mentioned = users.find(
            (u) =>
              (u.username && u.username.toLowerCase() === handle.toLowerCase()) ||
              u.phone === handle
          );
          if (mentioned) {
            return (
              <Text
                key={i}
                style={[{ color: "#3D91F4", fontFamily: "Inter_600SemiBold" }, mentionStyle]}
                onPress={() => router.push(`/profile/${mentioned.id}` as any)}
              >
                {part}
              </Text>
            );
          }
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}
