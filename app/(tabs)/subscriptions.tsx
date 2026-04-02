import {
  Text,
  View,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useState, useMemo } from "react";
import { usePostHog } from "posthog-react-native";
import { useUser } from "@clerk/expo";
import { colors } from "@/constants/theme";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";

const SafeAreaView = styled(RNSafeAreaView);

interface ListHeaderProps {
  searchQuery: string;
  count: number;
  onChangeText: (text: string) => void;
  onClearSearch: () => void;
}

const ListHeader = React.memo(
  ({ searchQuery, count, onChangeText, onClearSearch }: ListHeaderProps) => (
    <>
      {/* Page Title */}
      <Text style={styles.pageTitle}>Subscriptions</Text>

      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        <TextInput
          style={[styles.searchInput, { flex: 1, borderColor: colors.border }]}
          placeholder="Search by name, category..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={onChangeText}
          textContentType="none"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={onClearSearch}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Results Count */}
      {count > 0 && (
        <Text style={styles.resultCount}>
          {count} subscription
          {count !== 1 ? "s" : ""}
        </Text>
      )}
    </>
  ),
);

const Subscriptions = () => {
  const { user } = useUser();
  const posthog = usePostHog();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const { subscriptions } = useSubscriptions();

  // Filter subscriptions based on search query
  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return subscriptions;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    return subscriptions.filter(
      (sub) =>
        sub.name.toLowerCase().includes(lowerQuery) ||
        sub.category?.toLowerCase().includes(lowerQuery) ||
        sub.plan?.toLowerCase().includes(lowerQuery),
    );
  }, [searchQuery, subscriptions]);

  const handleSubscriptionPress = useCallback(
    (subscriptionId: string, subscriptionName: string) => {
      const isExpanding = expandedSubscriptionId !== subscriptionId;
      if (isExpanding && user?.id) {
        posthog.identify(user.id, {
          email: user.emailAddresses?.[0]?.emailAddress,
        });

        posthog.capture("subscription_expanded", {
          subscription_id: subscriptionId,
          subscription_name: subscriptionName,
          source: "subscriptions_screen",
        });
      }
      setExpandedSubscriptionId((currentId) =>
        currentId === subscriptionId ? null : subscriptionId,
      );
    },
    [expandedSubscriptionId, user, posthog],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          paddingBottom: 100,
        }}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <ListHeader
            searchQuery={searchQuery}
            count={filteredSubscriptions.length}
            onChangeText={setSearchQuery}
            onClearSearch={handleClearSearch}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListTitle}>No subscriptions found</Text>
            <Text style={styles.emptyListSubtitle}>
              {searchQuery.length > 0
                ? "Try adjusting your search terms"
                : "You don't have any subscriptions yet"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8 }}>
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() => handleSubscriptionPress(item.id, item.name)}
            />
          </View>
        )}
        ListHeaderComponentStyle={{
          backgroundColor: colors.background,
          zIndex: 1,
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
  },
  searchInputContainer: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    fontWeight: "500",
  },
  resultCount: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.6)",
    marginBottom: 16,
    fontWeight: "500",
  },
  clearButton: {
    padding: 8,
    backgroundColor: colors.destructive + "15",
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: colors.destructive,
    fontWeight: "600",
  },

  emptyListContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListTitle: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.6)",
    marginBottom: 8,
    fontWeight: "600",
  },
  emptyListSubtitle: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.5)",
    textAlign: "center",
  },
});

export default Subscriptions;
