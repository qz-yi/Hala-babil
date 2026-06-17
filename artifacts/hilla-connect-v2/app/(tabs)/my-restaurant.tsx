import { Redirect } from "expo-router";

export default function MyRestaurantRedirect() {
  return <Redirect href={"/(tabs)/my-merchant" as any} />;
}
