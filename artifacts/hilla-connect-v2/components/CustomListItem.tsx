import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
  showDivider?: boolean;
  danger?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  titleColor?: string;
}

export default function CustomListItem({
  icon,
  title,
  subtitle,
  onPress,
  right,
  showChevron = true,
  showDivider = true,
  danger,
  disabled,
  style,
  titleColor,
}: Props) {
  const colors = useColors();

  const textColor = danger ? colors.danger : (titleColor ?? colors.text);
  const chevronColor = danger ? colors.danger : colors.textSecondary;

  const inner = (
    <View style={[styles.row, style]}>
      <View style={styles.iconSlot}>{icon}</View>
      <View style={styles.textBlock}>
        <Text
          style={[styles.title, { color: textColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (
        showChevron && !disabled && (
          <Feather
            name="chevron-right"
            size={16}
            color={chevronColor}
            strokeWidth={1.5}
          />
        )
      )}
    </View>
  );

  return (
    <View>
      {onPress && !disabled ? (
        <Pressable
          onPress={onPress}
          android_ripple={{ color: "rgba(128,128,128,0.12)" }}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          {inner}
        </Pressable>
      ) : (
        inner
      )}
      {showDivider && (
        <View
          style={[styles.divider, { backgroundColor: colors.border ?? "rgba(128,128,128,0.12)" }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    gap: 14,
    minHeight: 52,
  },
  iconSlot: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  pressed: {
    opacity: 0.65,
  },
});
