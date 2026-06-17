import { Redirect, useLocalSearchParams } from "expo-router";

export default function RestaurantDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/merchant/${id}` as any} />;
}
