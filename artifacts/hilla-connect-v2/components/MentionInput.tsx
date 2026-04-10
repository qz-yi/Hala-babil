import React, { useRef, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ACCENT_COLORS } from "@/constants/colors";
import type { User } from "@/context/AppContext";

interface MentionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  users: User[];
  placeholder?: string;
  placeholderTextColor?: string;
  style?: any;
  inputStyle?: any;
  containerStyle?: any;
  colors: {
    text: string;
    textSecondary: string;
    card: string;
    border: string;
    backgroundSecondary: string;
    tint: string;
    inputBackground?: string;
  };
  multiline?: boolean;
  returnKeyType?: "send" | "done" | "next" | "go" | "search";
  onSubmitEditing?: () => void;
  maxHeight?: number;
  textAlign?: "left" | "right" | "center";
}

export default function MentionInput({
  value,
  onChangeText,
  users,
  placeholder,
  placeholderTextColor,
  style,
  inputStyle,
  containerStyle,
  colors,
  multiline,
  returnKeyType,
  onSubmitEditing,
  maxHeight,
  textAlign = "right",
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    onChangeText(text);

    const cursorPos = text.length;
    const atIdx = text.lastIndexOf("@", cursorPos);

    if (atIdx >= 0) {
      const charBeforeAt = atIdx === 0 ? " " : text[atIdx - 1];
      if (charBeforeAt === " " || charBeforeAt === "\n" || atIdx === 0) {
        const query = text.slice(atIdx + 1);
        if (!query.includes(" ") && !query.includes("\n")) {
          setMentionQuery(query);
          setMentionStart(atIdx);
          const filtered = users
            .filter((u) => {
              if (!query) return true;
              const q = query.toLowerCase();
              return (
                u.name.toLowerCase().includes(q) ||
                (u.username && u.username.toLowerCase().includes(q))
              );
            })
            .slice(0, 6);
          setSuggestions(filtered);
          return;
        }
      }
    }
    setSuggestions([]);
    setMentionQuery(null);
    setMentionStart(-1);
  };

  const handleSelectUser = (user: User) => {
    const handle = user.username || user.phone;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + (mentionQuery?.length ?? 0));
    const newText = `${before}@${handle} ${after}`;
    onChangeText(newText);
    setSuggestions([]);
    setMentionQuery(null);
    setMentionStart(-1);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <View style={[{ position: "relative" }, containerStyle]}>
      {suggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(u) => u.id}
            keyboardShouldPersistTaps="always"
            style={{ maxHeight: 200 }}
            renderItem={({ item }) => {
              const color = ACCENT_COLORS[item.name.length % ACCENT_COLORS.length];
              return (
                <TouchableOpacity
                  onPress={() => handleSelectUser(item)}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.suggestionAvatar, { backgroundColor: `${color}33` }]}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.suggestionAvatarImg} />
                    ) : (
                      <Text style={[styles.suggestionAvatarText, { color }]}>
                        {item.name[0]?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.suggestionName, { color: colors.text }]}>{item.name}</Text>
                    {item.username ? (
                      <Text style={[styles.suggestionHandle, { color: colors.tint }]}>
                        @{item.username}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      <View style={[styles.inputRow, { backgroundColor: colors.inputBackground ?? colors.backgroundSecondary, borderColor: colors.border }, style]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }, inputStyle]}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? colors.textSecondary}
          textAlign={textAlign}
          multiline={multiline}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxHeight={maxHeight}
          blurOnSubmit={!multiline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    borderRadius: 22,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    justifyContent: "center",
  },
  input: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 36,
  },
  suggestionsBox: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: "hidden",
    zIndex: 999,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  suggestionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  suggestionAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  suggestionAvatarText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  suggestionName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  suggestionHandle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});
