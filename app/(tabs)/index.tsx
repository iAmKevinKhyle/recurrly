import { Text, View } from "react-native";
import "@/global.css";
import { Link } from "expo-router";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">
        Welcome to Nativewind!
      </Text>

      <Link
        href="/onboarding"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        Go to onboarding
      </Link>

      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        Go to sign in
      </Link>

      <Link
        href="/(auth)/sign-up"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        Go to sign up
      </Link>

      <Link
        href={{
          pathname: "/subsciptions/[id]",
          params: { id: "spotify" },
        }}
        className="mt-4 rounded bg-primary text-white p-4"
      >
        Subscribe to spotify
      </Link>

      <Link
        href={{
          pathname: "/subsciptions/[id]",
          params: { id: "claude" },
        }}
        className="mt-4 rounded bg-primary text-white p-4"
      >
        Subscribe to claude
      </Link>
    </View>
  );
}
