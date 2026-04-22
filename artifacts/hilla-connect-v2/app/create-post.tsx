import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

/**
 * Create Post screen — now a thin redirect to the UniversalEditor.
 * The post creation flow is handled by `/create-story` with `mode=post`,
 * which unifies the editing experience (filters, text engine, stickers)
 * with story creation. Close Friends logic is excluded for posts.
 */
export default function CreatePostRedirect() {
  useEffect(() => {
    router.replace({ pathname: "/create-story", params: { mode: "post" } } as any);
  }, []);
  return <View style={{ flex: 1, backgroundColor: "#000" }} />;
}
