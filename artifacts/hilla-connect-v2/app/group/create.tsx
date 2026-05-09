import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import type { User } from "@/context/AppContext";

const BG = "#000";
const CARD = "#1C1C1E";
const BORDER = "#2C2C2E";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";
const TINT = "#3D91F4";

export default function CreateGroupScreen() {
  const { users, currentUser, createGroup, theme } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const [step, setStep] = useState<1 | 2>(1);
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const otherUsers = users.filter((u) => u.id !== currentUser?.id);
  const filteredUsers = otherUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handlePickPhoto = async () => {
    if (Platform.OS === "web") return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (!groupName.trim()) {
      Alert.alert("", "يرجى إدخال اسم المجموعة");
      return;
    }
    if (!groupId.trim() || groupId.trim().length < 3) {
      Alert.alert("", "يرجى إدخال معرف فريد للمجموعة (3 أحرف على الأقل)");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(groupId.trim())) {
      Alert.alert("", "المعرف يجب أن يحتوي على حروف إنجليزية وأرقام وشرطة سفلية فقط");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(2);
  };

  const toggleMember = (uid: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async () => {
    if (selectedMembers.length < 2) {
      Alert.alert("", "يجب اختيار عضوين على الأقل");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const group = await createGroup(groupName.trim(), photo, groupId.trim(), privacy, selectedMembers);
    setLoading(false);
    if (!group) {
      Alert.alert("", "معرف المجموعة مستخدم بالفعل، يرجى اختيار معرف آخر");
      return;
    }
    router.replace(`/group/${group.id}` as any);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => (step === 2 ? setStep(1) : router.back())}
          style={[s.backBtn, { borderColor: colors.border }]}
          activeOpacity={0.8}
        >
          <Feather name="arrow-right" size={20} color={colors.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>
          {step === 1 ? "إنشاء مجموعة جديدة" : "اختيار الأعضاء"}
        </Text>
        {step === 1 ? (
          <TouchableOpacity onPress={handleNext} style={[s.nextBtn, { backgroundColor: TINT }]} activeOpacity={0.85}>
            <Text style={s.nextBtnText}>التالي</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleCreate}
            style={[s.nextBtn, { backgroundColor: selectedMembers.length >= 2 ? TINT : "#333", opacity: loading ? 0.6 : 1 }]}
            activeOpacity={0.85}
            disabled={loading || selectedMembers.length < 2}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.nextBtnText}>إنشاء</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {step === 1 ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: botPad + 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Group Photo */}
            <View style={s.photoSection}>
              <TouchableOpacity onPress={handlePickPhoto} style={s.photoWrap} activeOpacity={0.85}>
                {photo ? (
                  <Image source={{ uri: photo }} style={s.photoImg} />
                ) : (
                  <View style={[s.photoPlaceholder, { backgroundColor: CARD, borderColor: BORDER }]}>
                    <Feather name="camera" size={28} color={TEXT2} strokeWidth={1.5} />
                  </View>
                )}
                <View style={s.photoEditBadge}>
                  <Feather name="edit-2" size={12} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[s.photoHint, { color: colors.textSecondary }]}>صورة المجموعة (اختياري)</Text>
            </View>

            {/* Group Name */}
            <View>
              <Text style={[s.label, { color: colors.textSecondary }]}>اسم المجموعة</Text>
              <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[s.input, { color: colors.text }]}
                  placeholder="أدخل اسم المجموعة..."
                  placeholderTextColor={colors.textSecondary}
                  value={groupName}
                  onChangeText={setGroupName}
                  maxLength={50}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Group ID */}
            <View>
              <Text style={[s.label, { color: colors.textSecondary }]}>معرف المجموعة</Text>
              <Text style={[s.sublabel, { color: colors.textSecondary }]}>
                معرف فريد للبحث عن المجموعة (يُستخدم عند البحث العام)
              </Text>
              <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: TEXT2, paddingRight: 8 }}>@</Text>
                <TextInput
                  style={[s.input, { color: colors.text, flex: 1 }]}
                  placeholder="group_id"
                  placeholderTextColor={colors.textSecondary}
                  value={groupId}
                  onChangeText={(v) => setGroupId(v.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                  maxLength={30}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Privacy */}
            <View>
              <Text style={[s.label, { color: colors.textSecondary }]}>الخصوصية</Text>
              <View style={s.privacyRow}>
                <TouchableOpacity
                  onPress={() => setPrivacy("public")}
                  style={[
                    s.privacyBtn,
                    { borderColor: privacy === "public" ? TINT : BORDER, backgroundColor: privacy === "public" ? `${TINT}22` : CARD },
                  ]}
                  activeOpacity={0.8}
                >
                  <Feather name="globe" size={18} color={privacy === "public" ? TINT : TEXT2} strokeWidth={1.5} />
                  <Text style={[s.privacyLabel, { color: privacy === "public" ? TINT : TEXT2 }]}>عامة</Text>
                  <Text style={[s.privacyDesc, { color: TEXT2 }]}>يمكن للجميع الانضمام</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPrivacy("private")}
                  style={[
                    s.privacyBtn,
                    { borderColor: privacy === "private" ? TINT : BORDER, backgroundColor: privacy === "private" ? `${TINT}22` : CARD },
                  ]}
                  activeOpacity={0.8}
                >
                  <Feather name="lock" size={18} color={privacy === "private" ? TINT : TEXT2} strokeWidth={1.5} />
                  <Text style={[s.privacyLabel, { color: privacy === "private" ? TINT : TEXT2 }]}>خاصة</Text>
                  <Text style={[s.privacyDesc, { color: TEXT2 }]}>بالدعوة فقط</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Selected chips */}
          {selectedMembers.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              {selectedMembers.map((uid) => {
                const u = users.find((x) => x.id === uid);
                if (!u) return null;
                return (
                  <TouchableOpacity key={uid} onPress={() => toggleMember(uid)} style={s.chip} activeOpacity={0.8}>
                    <View style={[s.chipAvatar, { backgroundColor: `${ACCENT_COLORS[u.name.length % ACCENT_COLORS.length]}33` }]}>
                      {u.avatar ? (
                        <Image source={{ uri: u.avatar }} style={s.chipAvatarImg} />
                      ) : (
                        <Text style={[s.chipAvatarText, { color: ACCENT_COLORS[u.name.length % ACCENT_COLORS.length] }]}>
                          {u.name[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={[s.chipName, { color: colors.text }]} numberOfLines={1}>{u.name}</Text>
                    <Feather name="x" size={12} color={TEXT2} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Search */}
          <View style={[s.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={TEXT2} strokeWidth={1.5} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="ابحث عن مستخدم..."
              placeholderTextColor={TEXT2}
              value={memberSearch}
              onChangeText={setMemberSearch}
              textAlign="right"
            />
          </View>

          <Text style={[s.memberHint, { color: TEXT2 }]}>
            {selectedMembers.length > 0 ? `${selectedMembers.length} عضو محدد` : "اختر عضوين على الأقل"}
          </Text>

          <FlatList
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            contentContainerStyle={{ paddingBottom: botPad + 90 }}
            renderItem={({ item }) => {
              const isSelected = selectedMembers.includes(item.id);
              const color = ACCENT_COLORS[item.name.length % ACCENT_COLORS.length];
              return (
                <TouchableOpacity
                  onPress={() => toggleMember(item.id)}
                  style={[s.memberRow, { borderBottomColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <View style={[s.memberAvatar, { backgroundColor: `${color}33` }]}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={s.memberAvatarImg} />
                    ) : (
                      <Text style={[s.memberAvatarText, { color }]}>{item.name[0].toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.memberName, { color: colors.text }]}>{item.name}</Text>
                    {item.username && (
                      <Text style={[s.memberUsername, { color: TEXT2 }]}>@{item.username}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      s.checkCircle,
                      { borderColor: isSelected ? TINT : BORDER, backgroundColor: isSelected ? TINT : "transparent" },
                    ]}
                  >
                    {isSelected && <Feather name="check" size={14} color="#fff" strokeWidth={2.5} />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 13, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center", marginHorizontal: 8 },
  nextBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, alignItems: "center", justifyContent: "center", minWidth: 70,
  },
  nextBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },

  photoSection: { alignItems: "center", gap: 10 },
  photoWrap: { position: "relative" },
  photoImg: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  photoEditBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: TINT, alignItems: "center", justifyContent: "center",
  },
  photoHint: { fontSize: 13, fontFamily: "Inter_400Regular" },

  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, textAlign: "right" },
  sublabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8, textAlign: "right" },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "right" },

  privacyRow: { flexDirection: "row", gap: 12 },
  privacyBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    padding: 14, gap: 6, alignItems: "center",
  },
  privacyLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  privacyDesc: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },

  chipsRow: { padding: 12, gap: 8, flexDirection: "row" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: CARD, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: BORDER,
  },
  chipAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  chipAvatarImg: { width: "100%", height: "100%", borderRadius: 12 },
  chipAvatarText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  chipName: { fontSize: 13, fontFamily: "Inter_500Medium", maxWidth: 80 },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginVertical: 10, borderRadius: 14,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  memberHint: { fontSize: 12, fontFamily: "Inter_400Regular", paddingHorizontal: 16, marginBottom: 6, textAlign: "right" },

  memberRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  memberAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  memberAvatarImg: { width: "100%", height: "100%", borderRadius: 23 },
  memberAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  memberName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  memberUsername: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
});
