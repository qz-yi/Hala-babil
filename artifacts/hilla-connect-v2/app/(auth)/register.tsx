import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";
const INPUT_BG = "#1C1C1C";
const ACCENT = "#3D91F4";

interface FieldProps {
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  nextRef?: React.RefObject<TextInput | null>;
  keyboardType?: any;
  secure?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
  last?: boolean;
  onSubmit?: () => void;
  prefix?: string;
  statusIcon?: "ok" | "error" | null;
}

function RegisterField({
  icon,
  placeholder,
  value,
  onChangeText,
  inputRef,
  nextRef,
  keyboardType = "default",
  secure = false,
  showSecure = false,
  onToggleSecure,
  last = false,
  onSubmit,
  prefix,
  statusIcon,
}: FieldProps) {
  return (
    <View style={styles.inputWrapper}>
      <Feather name={icon} size={18} color={TEXT2} strokeWidth={1.5} />
      {prefix && (
        <Text style={styles.inputPrefix}>{prefix}</Text>
      )}
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={TEXT2}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secure && !showSecure}
        returnKeyType={last ? "done" : "next"}
        onSubmitEditing={last ? onSubmit : () => nextRef?.current?.focus()}
        textAlign={Platform.OS !== "web" ? "right" : "left"}
        autoCapitalize="none"
      />
      {statusIcon === "ok" && (
        <Feather name="check-circle" size={16} color="#10B981" strokeWidth={1.5} />
      )}
      {statusIcon === "error" && (
        <Feather name="x-circle" size={16} color="#FF3B5C" strokeWidth={1.5} />
      )}
      {secure && onToggleSecure && (
        <TouchableOpacity onPress={onToggleSecure}>
          <Feather name={showSecure ? "eye-off" : "eye"} size={18} color={TEXT2} strokeWidth={1.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RegisterScreen() {
  const { register, checkUsername, t } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 30 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const handleUsernameChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "").toLowerCase();
    setUsername(cleaned);
    if (cleaned.length >= 3) {
      setUsernameAvailable(checkUsername(cleaned));
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleRegister = async () => {
    if (!name || !username || !phone || !email || !age || !address || !password) {
      showToast(t("fillAll"), "error");
      return;
    }
    if (username.length < 3) {
      showToast("اسم المستخدم يجب أن يكون 3 أحرف على الأقل", "error");
      return;
    }
    if (usernameAvailable === false) {
      showToast(t("usernameExists"), "error");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await register(
      name.trim(),
      phone.trim(),
      email.trim(),
      parseInt(age),
      address.trim(),
      password,
      username.trim()
    );
    setLoading(false);
    if (result.success) {
      showToast(t("success") + "! " + t("welcome"), "success");
      router.dismissAll();
      router.replace("/(tabs)");
    } else if (result.error === "username_exists") {
      showToast(t("usernameExists"), "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      showToast(t("phoneExists"), "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 16, paddingBottom: botPad + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={TEXT} strokeWidth={1.5} />
          </TouchableOpacity>

          <View style={styles.headerBlock}>
            <LinearGradient
              colors={["#34D399", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoRing}
            >
              <View style={styles.logoInner}>
                <Feather name="user-plus" size={26} color={TEXT} strokeWidth={1.5} />
              </View>
            </LinearGradient>
            <Text style={styles.title}>{t("register")}</Text>
            <Text style={styles.subtitle}>انضم إلى هلا بابل</Text>
          </View>

          <View style={styles.form}>
            <RegisterField icon="user" placeholder={t("name")} value={name} onChangeText={setName} nextRef={usernameRef} />

            <View>
              <RegisterField
                icon="at-sign"
                placeholder="اسم_المستخدم"
                value={username}
                onChangeText={handleUsernameChange}
                inputRef={usernameRef}
                nextRef={phoneRef}
                statusIcon={
                  username.length >= 3
                    ? usernameAvailable === true
                      ? "ok"
                      : "error"
                    : null
                }
              />
              {username.length > 0 && username.length < 3 && (
                <Text style={styles.fieldHint}>3 أحرف على الأقل</Text>
              )}
              {username.length >= 3 && usernameAvailable === true && (
                <Text style={[styles.fieldHint, { color: "#10B981" }]}>✓ اسم المستخدم متاح</Text>
              )}
              {username.length >= 3 && usernameAvailable === false && (
                <Text style={[styles.fieldHint, { color: "#FF3B5C" }]}>✗ {t("usernameExists")}</Text>
              )}
            </View>

            <RegisterField icon="phone" placeholder={t("phone")} value={phone} onChangeText={setPhone} inputRef={phoneRef} nextRef={emailRef} keyboardType="phone-pad" />
            <RegisterField icon="mail" placeholder={t("email")} value={email} onChangeText={setEmail} inputRef={emailRef} nextRef={ageRef} keyboardType="email-address" />
            <RegisterField icon="calendar" placeholder={t("age")} value={age} onChangeText={setAge} inputRef={ageRef} nextRef={addressRef} keyboardType="number-pad" />
            <RegisterField icon="map-pin" placeholder={t("address")} value={address} onChangeText={setAddress} inputRef={addressRef} nextRef={passRef} />
            <RegisterField icon="lock" placeholder={t("password")} value={password} onChangeText={setPassword} inputRef={passRef} secure showSecure={showPassword} onToggleSecure={() => setShowPassword(!showPassword)} last onSubmit={handleRegister} />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={loading}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>{loading ? "..." : t("register")}</Text>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>لديك حساب؟{"  "}</Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.switchLink}>{t("login")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerBlock: { alignItems: "center", gap: 14 },
  logoRing: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", padding: 2.5 },
  logoInner: { width: "100%", height: "100%", borderRadius: 37, backgroundColor: CARD, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: TEXT, textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center" },
  form: { gap: 12 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputPrefix: { fontSize: 16, color: ACCENT, fontFamily: "Inter_600SemiBold" },
  input: { flex: 1, fontSize: 16, color: TEXT, fontFamily: "Inter_400Regular", height: "100%" },
  fieldHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2, marginTop: 4, marginRight: 4, textAlign: "right" },
  submitBtn: {
    backgroundColor: TEXT,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: { color: BG, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchText: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2 },
  switchLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
});
