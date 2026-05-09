import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, IRAQI_GOVERNORATES } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { useThemeStore } from "@/store/themeStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  statusIcon,
}: FieldProps) {
  const { tokens: c } = useThemeStore();
  return (
    <View style={[st.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
      <Feather name={icon} size={18} color={c.textSecondary} strokeWidth={1.5} />
      <TextInput
        ref={inputRef}
        style={[st.input, { color: c.text, fontFamily: c.fontFamily ?? "Inter_400Regular" }]}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
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
        <Feather name="check-circle" size={16} color={c.success} strokeWidth={1.5} />
      )}
      {statusIcon === "error" && (
        <Feather name="x-circle" size={16} color={c.danger} strokeWidth={1.5} />
      )}
      {secure && onToggleSecure && (
        <TouchableOpacity onPress={onToggleSecure}>
          <Feather name={showSecure ? "eye-off" : "eye"} size={18} color={c.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function GovernoratePicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (g: string) => void;
  onClose: () => void;
}) {
  const { tokens: c } = useThemeStore();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.modalBg} onPress={onClose} />
      <View style={[st.pickerSheet, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[st.pickerHandle, { backgroundColor: c.border }]} />
        <Text style={[st.pickerTitle, { color: c.text, borderBottomColor: c.border, fontFamily: c.fontFamily ?? "Inter_700Bold" }]}>
          اختر محافظتك
        </Text>
        <FlatList
          data={IRAQI_GOVERNORATES as readonly string[]}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item === selected;
            return (
              <TouchableOpacity
                style={[
                  st.pickerItem,
                  { borderBottomColor: c.border },
                  isSelected && { backgroundColor: `${c.accent}18` },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  st.pickerItemText,
                  { color: c.text, fontFamily: c.fontFamily ?? "Inter_400Regular" },
                  isSelected && { color: c.accent, fontFamily: c.fontFamily ?? "Inter_600SemiBold" },
                ]}>
                  {item}
                </Text>
                {isSelected && (
                  <Feather name="check" size={18} color={c.accent} strokeWidth={2} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

export default function RegisterScreen() {
  const { register, checkUsername, checkEmail, t } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { tokens: c } = useThemeStore();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [governorate, setGovernorate] = useState("");
  const [showGovPicker, setShowGovPicker] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 30 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;
  const ff = c.fontFamily;

  const handleUsernameChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    setUsername(cleaned);
    if (cleaned.length >= 1) {
      setUsernameAvailable(checkUsername(cleaned));
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const isValid = EMAIL_RE.test(val.trim());
    setEmailValid(val.trim().length > 0 ? isValid : null);
    if (isValid) {
      setEmailAvailable(checkEmail(val.trim()));
    } else {
      setEmailAvailable(null);
    }
  };

  const handleRegister = async () => {
    if (!name || !username || !email || !governorate || !password) {
      showToast(t("fillAll"), "error");
      return;
    }
    if (username.length < 1) {
      showToast("اسم المستخدم مطلوب", "error");
      return;
    }
    if (usernameAvailable === false) {
      showToast(t("usernameExists"), "error");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      showToast(t("invalidEmail"), "error");
      return;
    }
    if (emailAvailable === false) {
      showToast(t("emailExists"), "error");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await register(name.trim(), username.trim(), email.trim(), governorate, password);
    setLoading(false);
    if (result.success) {
      showToast(t("success") + "! " + t("welcome"), "success");
      router.dismissAll();
      router.replace("/(tabs)");
    } else if (result.error === "username_exists") {
      showToast(t("usernameExists"), "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (result.error === "email_exists") {
      showToast(t("emailExists"), "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      showToast(t("error"), "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={[st.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[st.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={st.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={c.text} strokeWidth={1.5} />
          </TouchableOpacity>

          <View style={st.headerBlock}>
            <LinearGradient
              colors={[c.gradientStart, c.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.logoRing}
            >
              <View style={[st.logoInner, { backgroundColor: c.card }]}>
                <Feather name="user-plus" size={26} color={c.text} strokeWidth={1.5} />
              </View>
            </LinearGradient>
            <Text style={[st.title, { color: c.text, fontFamily: ff ?? "Inter_700Bold" }]}>
              {t("register")}
            </Text>
            <Text style={[st.subtitle, { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" }]}>
              {t("joinApp")}
            </Text>
          </View>

          <View style={st.form}>
            {/* الاسم */}
            <RegisterField
              icon="user"
              placeholder={t("name")}
              value={name}
              onChangeText={setName}
              nextRef={usernameRef}
            />

            {/* اسم المستخدم */}
            <View>
              <RegisterField
                icon="at-sign"
                placeholder="اسم_المستخدم"
                value={username}
                onChangeText={handleUsernameChange}
                inputRef={usernameRef}
                nextRef={emailRef}
                statusIcon={
                  username.length >= 1
                    ? usernameAvailable === true ? "ok" : "error"
                    : null
                }
              />
              {username.length >= 1 && usernameAvailable === true && (
                <Text style={[st.fieldHint, { color: c.success, fontFamily: ff ?? "Inter_400Regular" }]}>
                  ✓ اسم المستخدم متاح
                </Text>
              )}
              {username.length >= 1 && usernameAvailable === false && (
                <Text style={[st.fieldHint, { color: c.danger, fontFamily: ff ?? "Inter_400Regular" }]}>
                  ✗ {t("usernameExists")}
                </Text>
              )}
            </View>

            {/* البريد الإلكتروني */}
            <View>
              <RegisterField
                icon="mail"
                placeholder={t("email")}
                value={email}
                onChangeText={handleEmailChange}
                inputRef={emailRef}
                nextRef={passRef}
                keyboardType="email-address"
                statusIcon={
                  email.length > 0
                    ? emailValid === false
                      ? "error"
                      : emailAvailable === false
                      ? "error"
                      : emailValid === true && emailAvailable === true
                      ? "ok"
                      : null
                    : null
                }
              />
              {email.length > 0 && emailValid === false && (
                <Text style={[st.fieldHint, { color: c.danger, fontFamily: ff ?? "Inter_400Regular" }]}>
                  ✗ {t("invalidEmail")}
                </Text>
              )}
              {email.length > 0 && emailValid === true && emailAvailable === false && (
                <Text style={[st.fieldHint, { color: c.danger, fontFamily: ff ?? "Inter_400Regular" }]}>
                  ✗ {t("emailExists")}
                </Text>
              )}
              {email.length > 0 && emailValid === true && emailAvailable === true && (
                <Text style={[st.fieldHint, { color: c.success, fontFamily: ff ?? "Inter_400Regular" }]}>
                  ✓ البريد الإلكتروني متاح
                </Text>
              )}
            </View>

            {/* المحافظة */}
            <TouchableOpacity
              style={[st.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowGovPicker(true);
              }}
              activeOpacity={0.85}
            >
              <Feather name="map-pin" size={18} color={c.textSecondary} strokeWidth={1.5} />
              <Text style={[
                st.govPlaceholder,
                { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" },
                governorate && { color: c.text },
              ]}>
                {governorate || t("selectGovernorate")}
              </Text>
              <Feather name="chevron-down" size={18} color={c.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>

            {/* كلمة المرور */}
            <RegisterField
              icon="lock"
              placeholder={t("password")}
              value={password}
              onChangeText={setPassword}
              inputRef={passRef}
              secure
              showSecure={showPassword}
              onToggleSecure={() => setShowPassword(!showPassword)}
              last
              onSubmit={handleRegister}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={loading}
              style={[st.submitBtn, { backgroundColor: c.text }]}
            >
              <Text style={[st.submitBtnText, { color: c.background, fontFamily: ff ?? "Inter_600SemiBold" }]}>
                {loading ? "..." : t("register")}
              </Text>
            </TouchableOpacity>

            <View style={st.switchRow}>
              <Text style={[st.switchText, { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" }]}>
                لديك حساب؟{"  "}
              </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={[st.switchLink, { color: c.text, fontFamily: ff ?? "Inter_600SemiBold" }]}>
                  {t("login")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <GovernoratePicker
        visible={showGovPicker}
        selected={governorate}
        onSelect={setGovernorate}
        onClose={() => setShowGovPicker(false)}
      />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerBlock: { alignItems: "center", gap: 14 },
  logoRing: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", padding: 2.5 },
  logoInner: { width: "100%", height: "100%", borderRadius: 37, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center" },
  form: { gap: 12 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16, height: "100%" },
  fieldHint: { fontSize: 12, marginTop: 4, marginRight: 4, textAlign: "right" },
  govPlaceholder: { flex: 1, fontSize: 16, textAlign: "right" },
  submitBtn: {
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: { fontSize: 17 },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  pickerSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: "70%",
    borderTopWidth: 0.5,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    textAlign: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  pickerItemText: { fontSize: 16 },
});
