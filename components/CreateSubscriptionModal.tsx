import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import dayjs from "dayjs";
import clsx from "clsx";
import { icons } from "@/constants/icons";

interface CreateSubscriptionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
}

const CATEGORY_OPTIONS = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: "#f5c542",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#b8e8d0",
  Productivity: "#f7c3e9",
  Cloud: "#9ad4f4",
  Music: "#f2b8ad",
  Other: "#d5d5d5",
};

const resolveIconForName = (name: string) => {
  const normalized = name.toLowerCase().trim();

  const localMatches: Record<string, any> = {
    spotify: icons.spotify,
    github: icons.github,
    figma: icons.figma,
    canva: icons.canva,
    adobe: icons.adobe,
    notion: icons.notion,
    dropbox: icons.dropbox,
    openai: icons.openai,
    claude: icons.claude,
    medium: icons.medium,
  };

  // first priority: local assets
  for (const key of Object.keys(localMatches)) {
    if (normalized.includes(key)) {
      return localMatches[key];
    }
  }

  // second priority: DuckDuckGo icon search (free, no auth needed)
  const rawName = normalized.split(" ")[0].replace(/[^a-z0-9]/g, "");
  if (rawName.length > 0) {
    const fallbackDomain = `${rawName}.com`;
    return {
      uri: `https://icons.duckduckgo.com/ip3/${fallbackDomain}.ico`,
    };
  }

  // final fallback: generic initials style (handled by SubscriptionCard onError)
  const fallbackName = encodeURIComponent(name.trim() || "subscription");
  return {
    uri: `https://ui-avatars.com/api/?name=${fallbackName}&background=f5c542&color=081126`,
  };
};

export default function CreateSubscriptionModal({
  isVisible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<"Monthly" | "Yearly">("Monthly");
  const [category, setCategory] = useState<string>("Entertainment");

  const parsedPrice = Number(price);
  const isSubmitEnabled = name.trim().length > 0 && parsedPrice > 0;

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
  };

  const handleSubmit = () => {
    if (!isSubmitEnabled) {
      return;
    }

    const startDate = dayjs();
    const renewalDate =
      frequency === "Yearly"
        ? startDate.add(1, "year")
        : startDate.add(1, "month");

    const newSubscription: Subscription = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      icon: resolveIconForName(name),
      name: name.trim(),
      category,
      status: "active",
      startDate: startDate.toISOString(),
      price: parsedPrice,
      currency: "USD",
      billing: frequency,
      renewalDate: renewalDate.toISOString(),
      color: CATEGORY_COLORS[category] ?? "#d5d5d5",
    };

    onCreate(newSubscription);
    resetForm();
    onClose();
  };

  const frequencyOptions = ["Monthly", "Yearly"] as const;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          <View className="modal-container">
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                className="modal-close"
              >
                <Text className="modal-close-text">×</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View className="modal-body">
                <View className="auth-field">
                  <Text className="auth-label">Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter subscription name"
                    className="auth-input"
                    placeholderTextColor="#999"
                  />
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Price</Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    className="auth-input"
                    placeholderTextColor="#999"
                  />
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Frequency</Text>
                  <View className="picker-row">
                    {frequencyOptions.map((option) => {
                      const isActive = option === frequency;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setFrequency(option)}
                          className={clsx(
                            "picker-option",
                            isActive && "picker-option-active",
                          )}
                        >
                          <Text
                            className={clsx(
                              "picker-option-text",
                              isActive && "picker-option-text-active",
                            )}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Category</Text>
                  <View className="category-scroll">
                    {CATEGORY_OPTIONS.map((item) => {
                      const isActive = item === category;
                      return (
                        <Pressable
                          key={item}
                          onPress={() => setCategory(item)}
                          className={clsx(
                            "category-chip",
                            isActive && "category-chip-active",
                          )}
                        >
                          <Text
                            className={clsx(
                              "category-chip-text",
                              isActive && "category-chip-text-active",
                            )}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={!isSubmitEnabled}
                  className={clsx(
                    "auth-button",
                    !isSubmitEnabled && "auth-button-disabled",
                  )}
                >
                  <Text className="auth-button-text">Create Subscription</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
