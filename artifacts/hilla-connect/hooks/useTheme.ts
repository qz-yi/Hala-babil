import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export function useTheme() {
  const { theme } = useApp();
  return Colors[theme];
}
