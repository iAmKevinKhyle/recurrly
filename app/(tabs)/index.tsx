import { FlatList, Image, Text, View, Pressable } from "react-native";
import "@/global.css";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";
import images from "@/constants/images";
import { HOME_BALANCE, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import { formatCurrency } from "@/libs/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionsCard from "@/components/UpcomingSubscriptionsCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import { useState } from "react";
import { useUser } from "@clerk/expo";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const { user } = useUser();
  const posthog = usePostHog();
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { subscriptions, addSubscription } = useSubscriptions();

  const handleSubscriptionPress = (
    subscriptionId: string,
    subscriptionName: string,
  ) => {
    const isExpanding = expandedSubscriptionId !== subscriptionId;

    if (isExpanding && user?.id) {
      posthog.identify(user?.id, {
        email: user?.emailAddresses?.[0]?.emailAddress || "Unknown",
      });

      posthog.capture("subscription_expanded", {
        subscription_id: subscriptionId,
        subscription_name: subscriptionName,
        source: "home_screen",
      });
    }

    setExpandedSubscriptionId((currentId) =>
      currentId === subscriptionId ? null : subscriptionId,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image
                  source={
                    user?.imageUrl ? { uri: user.imageUrl } : images.avatar
                  }
                  className="home-avatar"
                />
                <Text className="home-user-name">
                  {user?.firstName
                    ? user?.firstName
                    : user?.emailAddresses?.[0]?.emailAddress || "—"}
                </Text>
              </View>

              <Pressable
                onPress={() => setIsModalVisible(true)}
                className="border rounded-full p-1"
              >
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>
                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                </Text>
              </View>
            </View>

            <View className="mb-3">
              <ListHeading title="Upcoming" />

              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                renderItem={({ item }) => (
                  <UpcomingSubscriptionsCard {...item} />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming renewals yet.
                  </Text>
                }
              />
            </View>

            <ListHeading title="All Subscription" />
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => handleSubscriptionPress(item.id, item.name)}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions yet.</Text>
        }
        contentContainerClassName="pb-30"
      />

      <CreateSubscriptionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreate={addSubscription}
      />
    </SafeAreaView>
  );
}
