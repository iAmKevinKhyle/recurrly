import {
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/expo";
import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { colors } from "@/constants/theme";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const posthog = usePostHog();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      posthog.capture("user_signed_out", {
        email: user?.emailAddresses?.[0]?.emailAddress || "Unknown",
      });

      // Reset PostHog identity on sign out
      posthog.reset();

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
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>

          {/* Account Card */}
          <View style={styles.card}>
            {/* User ID Row */}
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>User ID</Text>
              <Text
                style={styles.cardRowValue}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.id || "—"}
              </Text>
            </View>

            {/* User Info Row */}
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Name</Text>
              <Text style={styles.cardRowValue}>
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || "—"}
              </Text>
            </View>

            {/* Email Row */}
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Email</Text>
              <Text style={styles.cardRowValue}>
                {user?.emailAddresses?.[0]?.emailAddress || "—"}
              </Text>
            </View>

            {/* Joined Date Row */}
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Joined</Text>
              <Text
                style={styles.cardRowValueSmall}
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
              style={styles.signOutButton}
              onPress={handleSignOut}
              disabled={isSigningOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              {isSigningOut ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.card}>
            <View style={[styles.cardRow, { marginBottom: 0 }]}>
              <Text style={styles.cardRowLabel}>App Version</Text>
              <Text style={styles.cardRowValueSmall}>1.0.0</Text>
            </View>

            <View>
              <Text style={styles.cardRowLabel}>Build</Text>
              <Text style={styles.cardRowValueSmall}>Production</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardRowLabel: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.6)",
    marginBottom: 4,
    fontWeight: "600",
  },
  cardRowValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  cardRowValueSmall: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  signOutButton: {
    backgroundColor: colors.destructive,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
