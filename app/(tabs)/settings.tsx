import {
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/expo";
import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { colors } from "@/constants/theme";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background p-5 items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 p-5">
        {/* Page Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: colors.primary,
            marginBottom: 24,
          }}
        >
          Settings
        </Text>

        {/* Account Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.primary,
              marginBottom: 12,
            }}
          >
            Account
          </Text>

          {/* Account Card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* User ID Row */}
            <View
              style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(0, 0, 0, 0.6)",
                  marginBottom: 4,
                  fontWeight: "600",
                }}
              >
                User ID
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.primary,
                  fontWeight: "500",
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.id || "—"}
              </Text>
            </View>

            {/* User Info Row */}
            <View
              style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(0, 0, 0, 0.6)",
                  marginBottom: 4,
                  fontWeight: "600",
                }}
              >
                Name
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.primary,
                  fontWeight: "500",
                }}
              >
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || "—"}
              </Text>
            </View>

            {/* Email Row */}
            <View
              style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(0, 0, 0, 0.6)",
                  marginBottom: 4,
                  fontWeight: "600",
                }}
              >
                Email
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.primary,
                  fontWeight: "500",
                }}
              >
                {user?.emailAddresses?.[0]?.emailAddress || "—"}
              </Text>
            </View>

            {/* Joined Date Row */}
            <View
              style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(0, 0, 0, 0.6)",
                  marginBottom: 4,
                  fontWeight: "600",
                }}
              >
                Joined
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: "500",
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </Text>
            </View>

            {/* Sign Out Button */}
            <Pressable
              style={{
                backgroundColor: colors.destructive,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={handleSignOut}
              disabled={isSigningOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              {isSigningOut ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                >
                  Sign Out
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* App Info Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.primary,
              marginBottom: 12,
            }}
          >
            About
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(0, 0, 0, 0.6)",
                  marginBottom: 4,
                  fontWeight: "600",
                }}
              >
                App Version
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: "500",
                }}
              >
                1.0.0
              </Text>
            </View>

            <View>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(0, 0, 0, 0.6)",
                  marginBottom: 4,
                  fontWeight: "600",
                }}
              >
                Build
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: "500",
                }}
              >
                Production
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
