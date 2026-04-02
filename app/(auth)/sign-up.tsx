import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignUp } from "@clerk/expo";
import { useClerk } from "@clerk/expo";
import { useRouter, Link } from "expo-router";
import { usePostHog } from "posthog-react-native";
import {
  validateEmail,
  validatePassword,
  validateVerificationCode,
} from "@/libs/validation";
import { AUTH_MESSAGES, AUTH_ERRORS } from "@/constants/auth";
import { colors } from "@/constants/theme";

type SignUpStep = "form" | "verify";

interface FormErrors {
  email?: string;
  password?: string;
  code?: string;
}

/**
 * Parse Clerk API errors into user-friendly messages
 */
const parseClerkError = (err: any, fallbackMessage: string): string => {
  return err.errors?.[0]?.message || err.message || fallbackMessage;
};

export default function SignUp() {
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  const router = useRouter();
  const posthog = usePostHog();
  const codeInputRef = useRef<TextInput>(null);

  const [step, setStep] = useState<SignUpStep>("form");
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const resendCooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Validation on change
  const validateForm = useCallback(() => {
    const errors: FormErrors = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.error;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const handleSignUp = useCallback(async () => {
    if (!signUp || !validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      const { error } = await signUp?.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        if (__DEV__) {
          console.error("Sign-up error code:", error);
        }
        setGeneralError(
          parseClerkError(error, AUTH_ERRORS.SOMETHING_WENT_WRONG),
        );
        return;
      }

      if (!error) {
        setStep("verify");
        await signUp.verifications.sendEmailCode();
      }
    } catch (err: any) {
      if (__DEV__) {
        console.error("Sign-up error code:", err);
      }
      if (err.errors?.[0]?.code === "form_identifier_exists") {
        setGeneralError(AUTH_ERRORS.EMAIL_ALREADY_IN_USE);
      } else {
        setGeneralError(parseClerkError(err, AUTH_ERRORS.SOMETHING_WENT_WRONG));
      }
    } finally {
      setIsLoading(false);
    }
  }, [signUp, email, password, validateForm]);

  const handleVerifyCode = useCallback(async () => {
    if (!signUp || !setActive) {
      return;
    }

    const codeValidation = validateVerificationCode(code);
    if (!codeValidation.valid) {
      setFormErrors({ code: codeValidation.error });
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      await signUp.verifications.verifyEmailCode({ code: code.trim() });

      if (signUp.status === "complete") {
        const userId = signUp?.createdUserId || "Unknown";

        await setActive({ session: signUp?.createdSessionId });

        try {
          posthog.identify(userId, {
            email: email.trim() || "Unknown",
            signupMethod: "email_password",
            createdAt: new Date().toISOString(),
          });

          posthog.capture("user_signed_up", {
            userId,
            method: "email_password",
          });
        } catch (analyticsError) {
          console.warn("PostHog error (ignored):", analyticsError);
        }

        router.replace("/");
      } else {
        setGeneralError(AUTH_ERRORS.SIGN_UP_NOT_COMPLETE);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      if (err.errors?.[0]?.code === "verification_failed") {
        setFormErrors({ code: AUTH_ERRORS.INVALID_CODE });
      } else {
        setGeneralError(parseClerkError(err, AUTH_ERRORS.VERIFICATION_FAILED));
      }
    } finally {
      setIsLoading(false);
    }
  }, [signUp, setActive, code, email, posthog, router]);

  const handleResendCode = useCallback(async () => {
    if (!signUp || resendCooldown > 0) {
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      await signUp.verifications.sendEmailCode();
      Alert.alert("Code Sent", AUTH_MESSAGES.CODE_SENT);

      // Start 60-second cooldown to prevent spam
      setResendCooldown(60);
      resendCooldownTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (resendCooldownTimerRef.current) {
              clearInterval(resendCooldownTimerRef.current);
              resendCooldownTimerRef.current = null;
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Resend code error:", err);
      setGeneralError(parseClerkError(err, AUTH_ERRORS.SOMETHING_WENT_WRONG));
    } finally {
      setIsLoading(false);
    }
  }, [signUp, resendCooldown]);

  useEffect(() => {
    return () => {
      if (resendCooldownTimerRef.current) {
        clearInterval(resendCooldownTimerRef.current);
      }
    };
  }, []);

  if (!signUp) {
    return (
      <View
        className="auth-safe-area"
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView className="auth-safe-area" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // className="auth-screen"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            {/* Brand Block */}
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">₹</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">Recurrly</Text>
                  <Text className="auth-wordmark-sub">Smart Billing</Text>
                </View>
              </View>
            </View>

            {/* Title & Subtitle */}
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Text className="auth-title">{AUTH_MESSAGES.SIGN_UP_TITLE}</Text>
              <Text className="auth-subtitle">
                {AUTH_MESSAGES.SIGN_UP_SUBTITLE}
              </Text>
            </View>

            {/* Main Card */}
            <View className="auth-card">
              {/* General Error */}
              {generalError && (
                <View
                  style={{
                    backgroundColor: colors.destructive + "15",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.destructive,
                  }}
                >
                  <Text
                    style={{
                      color: colors.destructive,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {generalError}
                  </Text>
                </View>
              )}

              {step === "form" ? (
                <View className="auth-form">
                  {/* Email Field */}
                  <View className="auth-field">
                    <Text className="auth-label">Email Address</Text>
                    <TextInput
                      className="auth-input"
                      style={
                        formErrors.email
                          ? { borderColor: colors.destructive, borderWidth: 2 }
                          : { borderColor: colors.border }
                      }
                      placeholder="Enter your email"
                      placeholderTextColor={colors.mutedForeground}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (formErrors.email) {
                          const validation = validateEmail(text);
                          if (validation.valid) {
                            setFormErrors((prev) => ({
                              ...prev,
                              email: undefined,
                            }));
                          }
                        }
                      }}
                      editable={!isLoading}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      accessibilityLabel="Email input"
                    />
                    {formErrors.email && (
                      <Text className="auth-error">{formErrors.email}</Text>
                    )}
                  </View>

                  {/* Password Field */}
                  <View className="auth-field">
                    <Text className="auth-label">Password</Text>
                    <TextInput
                      className="auth-input"
                      style={
                        formErrors.password
                          ? { borderColor: colors.destructive, borderWidth: 2 }
                          : { borderColor: colors.border }
                      }
                      placeholder="Create a strong password"
                      placeholderTextColor={colors.mutedForeground}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (formErrors.password) {
                          const validation = validatePassword(text);
                          if (validation.valid) {
                            setFormErrors((prev) => ({
                              ...prev,
                              password: undefined,
                            }));
                          }
                        }
                      }}
                      editable={!isLoading}
                      secureTextEntry
                      accessibilityLabel="Password input"
                    />
                    {formErrors.password && (
                      <Text className="auth-error">{formErrors.password}</Text>
                    )}
                    {!formErrors.password && password && (
                      <Text className="auth-helper">
                        {AUTH_MESSAGES.PASSWORD_REQUIREMENTS}
                      </Text>
                    )}
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    className="auth-button"
                    onPress={handleSignUp}
                    disabled={isLoading || !email || !password}
                    style={
                      isLoading || !email || !password ? { opacity: 0.6 } : {}
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Create account"
                    accessibilityHint="Creates a new account with your email and password"
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <Text className="auth-button-text">Create Account</Text>
                    )}
                  </Pressable>

                  {/* Sign In Link */}
                  <View className="auth-link-row">
                    <Text className="auth-link-copy">
                      Already have an account?
                    </Text>
                    <Link href="/(auth)/sign-in" asChild>
                      <Pressable>
                        <Text className="auth-link">Sign in</Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              ) : (
                <View className="auth-form">
                  {/* Verification Code Field */}
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.primary,
                        marginBottom: 8,
                      }}
                    >
                      {AUTH_MESSAGES.VERIFY_TITLE}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "rgba(0, 0, 0, 0.6)",
                        marginBottom: 16,
                      }}
                    >
                      {AUTH_MESSAGES.CHECK_EMAIL}
                    </Text>
                  </View>

                  <View className="auth-field">
                    <Text className="auth-label">Verification Code</Text>
                    <TextInput
                      ref={codeInputRef}
                      className="auth-input"
                      style={
                        formErrors.code
                          ? { borderColor: colors.destructive, borderWidth: 2 }
                          : { borderColor: colors.border }
                      }
                      placeholder="000000"
                      placeholderTextColor={colors.mutedForeground}
                      value={code}
                      onChangeText={(text) => {
                        setCode(text.replace(/\D/g, "").slice(0, 6));
                        if (formErrors.code) {
                          const validation = validateVerificationCode(text);
                          if (validation.valid) {
                            setFormErrors((prev) => ({
                              ...prev,
                              code: undefined,
                            }));
                          }
                        }
                      }}
                      editable={!isLoading}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                      accessibilityLabel="Verification code input"
                    />
                    {formErrors.code && (
                      <Text className="auth-error">{formErrors.code}</Text>
                    )}
                  </View>

                  {/* Verify Button */}
                  <Pressable
                    className="auth-button"
                    onPress={handleVerifyCode}
                    disabled={isLoading || code.length !== 6}
                    style={
                      isLoading || code.length !== 6 ? { opacity: 0.6 } : {}
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Verify code"
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <Text className="auth-button-text">Verify Email</Text>
                    )}
                  </Pressable>

                  {/* Resend Code Button with Cooldown */}
                  <Pressable
                    className="auth-secondary-button"
                    onPress={handleResendCode}
                    disabled={isLoading || resendCooldown > 0}
                    accessibilityRole="button"
                    accessibilityLabel="Resend verification code"
                    accessibilityHint={
                      resendCooldown > 0
                        ? `Available in ${resendCooldown} seconds`
                        : undefined
                    }
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.accent} size="small" />
                    ) : resendCooldown > 0 ? (
                      <Text
                        className="auth-secondary-button-text"
                        style={{ opacity: 0.6 }}
                      >
                        Resend in {resendCooldown}s
                      </Text>
                    ) : (
                      <Text className="auth-secondary-button-text">
                        {AUTH_MESSAGES.RESEND_CODE}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
