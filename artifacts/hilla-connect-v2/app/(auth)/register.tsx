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

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";
const INPUT_BG = "#1C1C1C";
const ACCENT = "#3D91F4";
const SUCCESS = "#10B981";
const ERROR = "#FF3B5C";

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
  return (
    <View style={styles.inputWrapper}>
      <Feather name={icon} size={18} color={TEXT2} strokeWidth={1.5} />
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
        <Feather name="check-circle" size={16} color={SUCCESS} strokeWidth={1.5} />
      )}
      {statusIcon === "error" && (
        <Feather name="x-circle" size={16} color={ERROR} strokeWidth={1.5} />
      )}
      {secure && onToggleSecure && (
        <TouchableOpacity onPress={onToggleSecure}>
          <Feather name={showSecure ? "eye-off" : "eye"} size={18} color={TEXT2} strokeWidth={1.5} />
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHandle} />
        <Text style={styles.pickerTitle}>اختر محافظتك</Text>
        <FlatList
          data={IRAQI_GOVERNORATES as readonly string[]}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item === selected;
            return (
              <TouchableOpacity
                style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                  🏛️  {item}
                </Text>
                {isSelected && (
                  <Feather name="check" size={18} color={ACCENT} strokeWidth={2} />
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

  const handleUsernameChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "").toLowerCase();
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
    const result = await register(
      name.trim(),
      username.trim(),
      email.trim(),
      governorate,
      password
    );
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
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
                    ? usernameAvailable === true
                      ? "ok"
                      : "error"
                    : null
                }
              />
              {username.length >= 1 && usernameAvailable === true && (
                <Text style={[styles.fieldHint, { color: SUCCESS }]}>✓ اسم المستخدم متاح</Text>
              )}
              {username.length >= 1 && usernameAvailable === false && (
                <Text style={[styles.fieldHint, { color: ERROR }]}>✗ {t("usernameExists")}</Text>
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
                <Text style={[styles.fieldHint, { color: ERROR }]}>✗ {t("invalidEmail")}</Text>
              )}
              {email.length > 0 && emailValid === true && emailAvailable === false && (
                <Text style={[styles.fieldHint, { color: ERROR }]}>✗ {t("emailExists")}</Text>
              )}
              {email.length > 0 && emailValid === true && emailAvailable === true && (
                <Text style={[styles.fieldHint, { color: SUCCESS }]}>✓ البريد الإلكتروني متاح</Text>
              )}
            </View>

            {/* المحافظة - Dropdown */}
            <TouchableOpacity
              style={[styles.inputWrapper, !governorate && styles.inputWrapperEmpty]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowGovPicker(true);
              }}
              activeOpacity={0.85}
            >
              <Feather name="map-pin" size={18} color={TEXT2} strokeWidth={1.5} />
              <Text style={[styles.govPlaceholder, governorate && styles.govSelected]}>
                {governorate || t("selectGovernorate")}
              </Text>
              <Feather name="chevron-down" size={18} color={TEXT2} strokeWidth={1.5} />
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

      <GovernoratePicker
        visible={showGovPicker}
        selected={governorate}
        onSelect={setGovernorate}
        onClose={() => setShowGovPicker(false)}
      />
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
  inputWrapperEmpty: { borderColor: BORDER },
  input: { flex: 1, fontSize: 16, color: TEXT, fontFamily: "Inter_400Regular", height: "100%" },
  fieldHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2, marginTop: 4, marginRight: 4, textAlign: "right" },
  govPlaceholder: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "right" },
  govSelected: { color: TEXT },
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
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  pickerSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: "70%",
    borderTopWidth: 0.5,
    borderColor: BORDER,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: TEXT,
    textAlign: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1E1E1E",
  },
  pickerItemSelected: { backgroundColor: "#1C2C3C" },
  pickerItemText: { fontSize: 16, fontFamily: "Inter_400Regular", color: TEXT },
  pickerItemTextSelected: { color: ACCENT, fontFamily: "Inter_600SemiBold" },
});
