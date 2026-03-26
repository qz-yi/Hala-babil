import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
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

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function RegisterScreen() {
  const { register, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRegister = async () => {
    if (!name || !phone || !email || !age || !address || !password) {
      Alert.alert(t("error"), t("fillAll"));
      return;
    }
    setLoading(true);
    const success = await register(name.trim(), phone.trim(), email.trim(), parseInt(age), address.trim(), password);
    setLoading(false);
    if (success) {
      router.dismissAll();
      router.replace("/(tabs)");
    } else {
      Alert.alert(t("error"), t("phoneExists"));
    }
  };

  const Field = ({
    icon,
    placeholder,
    value,
    onChangeText,
    ref: refProp,
    nextRef,
    keyboardType = "default" as any,
    secure = false,
    last = false,
  }: any) => (
    <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={{ flexShrink: 0 }} />
      <TextInput
        ref={refProp}
        style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        returnKeyType={last ? "done" : "next"}
        onSubmitEditing={last ? handleRegister : () => nextRef?.current?.focus()}
        textAlign={Platform.OS !== "web" ? "right" : "left"}
      />
      {secure && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          theme === "dark"
            ? ["rgba(124,58,237,0.12)", "transparent"]
            : ["rgba(79,70,229,0.07)", "transparent"]
        }
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 20, paddingBottom: botPad + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerBlock}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.iconBox}
            >
              <Ionicons name="person-add" size={28} color="#fff" />
            </LinearGradient>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("register")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              انضم إلى {t("hillaConnect")}
            </Text>
          </View>

          <View style={styles.form}>
            <Field icon="person-outline" placeholder={t("name")} value={name} onChangeText={setName} nextRef={phoneRef} />
            <Field icon="call-outline" placeholder={t("phone")} value={phone} onChangeText={setPhone} ref={phoneRef} nextRef={emailRef} keyboardType="phone-pad" />
            <Field icon="mail-outline" placeholder={t("email")} value={email} onChangeText={setEmail} ref={emailRef} nextRef={ageRef} keyboardType="email-address" />
            <Field icon="calendar-outline" placeholder={t("age")} value={age} onChangeText={setAge} ref={ageRef} nextRef={addressRef} keyboardType="number-pad" />
            <Field icon="location-outline" placeholder={t("address")} value={address} onChangeText={setAddress} ref={addressRef} nextRef={passRef} />
            <Field icon="lock-closed-outline" placeholder={t("password")} value={password} onChangeText={setPassword} ref={passRef} secure={true} last={true} />

            <TouchableOpacity activeOpacity={0.85} onPress={handleRegister} disabled={loading}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? "..." : t("register")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={[styles.switchLink, { color: colors.tint }]}>{t("login")}</Text>
              </TouchableOpacity>
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>{"  "}لديك حساب؟</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 20 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  headerBlock: { alignItems: "center", gap: 12, marginVertical: 8 },
  iconBox: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#10B981", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  form: { gap: 14 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 14, height: 56, gap: 10,
  },
  input: { flex: 1, fontSize: 16, height: "100%" },
  submitBtn: {
    borderRadius: 18, paddingVertical: 18, alignItems: "center",
    shadowColor: "#10B981", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10, marginTop: 6,
  },
  submitBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  switchLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
