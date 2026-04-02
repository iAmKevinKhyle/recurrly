import React, { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignIn, useUser } from "@clerk/expo";
import { useClerk } from "@clerk/expo";
import { useRouter, Link } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { validateEmail, validateVerificationCode } from "@/libs/validation";
import {
  AUTH_MESSAGES,
  AUTH_ERRORS,
  VERIFICATION_CODE_LENGTH,
} from "@/constants/auth";
import { colors } from "@/constants/theme";

type SignInStep = "credentials" | "mfa";

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

export default function SignIn() {
  const { signIn } = useSignIn();
  const { user } = useUser();
  const { setActive } = useClerk();
  const router = useRouter();
  const posthog = usePostHog();
  const codeInputRef = useRef<TextInput>(null);

  const [step, setStep] = useState<SignInStep>("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleSignIn = useCallback(async () => {
    if (!signIn) {
      return;
    }

    // Basic validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setFormErrors({ email: emailValidation.error });
      return;
    }

    if (!password) {
      setFormErrors({ password: "Password is required" });
      return;
    }

    setIsLoading(true);
    setGeneralError("");
    setFormErrors({});

    try {
      await signIn.password({
        identifier: email.trim(),
        password,
      });

      if (signIn.status === "complete") {
        await setActive({ session: signIn.createdSessionId });

        try {
          const userId = user?.id || "Unknown";

          posthog.identify(userId, {
            email: email.trim() || "Unknown",
            signInMethod: "email_password",
            lastSignInAt: new Date().toISOString(),
          });

          posthog.capture("user_signed_in", {
            userId,
            method: "email_password",
          });
        } catch (analyticsError) {
          console.warn("PostHog error (ignored):", analyticsError);
        }

        router.replace("/");
      } else if (
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust"
      ) {
        // MFA required
        try {
          await signIn.mfa.sendEmailCode();
          setStep("mfa");
        } catch (mfaErr) {
          console.error("MFA email code error:", mfaErr);
          setGeneralError(
            parseClerkError(
              mfaErr,
              "Failed to send verification code. Please try again.",
            ),
          );
        }
      } else {
        setGeneralError(AUTH_ERRORS.SOMETHING_WENT_WRONG);
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      if (
        err.errors?.[0]?.code === "form_identifier_not_found" ||
        err.errors?.[0]?.code === "form_password_incorrect"
      ) {
        setGeneralError(AUTH_ERRORS.INVALID_CREDENTIALS);
      } else {
        setGeneralError(parseClerkError(err, AUTH_ERRORS.SOMETHING_WENT_WRONG));
      }
    } finally {
      setIsLoading(false);
    }
  }, [signIn, setActive, email, password, posthog, router, user]);

  const handleMFAVerify = useCallback(async () => {
    if (!signIn || !setActive) {
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
      const { error } = await signIn.mfa.verifyEmailCode({
        code: code.trim(),
      });

      if (signIn.status === "complete") {
        await setActive({ session: signIn.createdSessionId });

        posthog.identify(user?.id || "Unknown", {
          mfaCompleted: true,
          lastMFAAt: new Date().toISOString(),
        });

        posthog.capture("mfa_verified", {
          strategy: "email_code",
        });

        router.replace("/");
      } else {
        setGeneralError(error?.message || AUTH_ERRORS.SOMETHING_WENT_WRONG);
      }
    } catch (err: any) {
      console.error("MFA verification error:", err);
      if (err.errors?.[0]?.code === "form_code_incorrect") {
        setFormErrors({ code: AUTH_ERRORS.INVALID_CODE });
      } else {
        setGeneralError(parseClerkError(err, AUTH_ERRORS.MFA_FAILED));
      }
    } finally {
      setIsLoading(false);
    }
  }, [signIn, setActive, code, posthog, router, user]);

  const handleResendCode = useCallback(async () => {
    if (!signIn) {
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      await signIn.mfa.sendEmailCode();
    } catch (err: any) {
      console.error("Resend code error:", err);
      setGeneralError(parseClerkError(err, AUTH_ERRORS.SOMETHING_WENT_WRONG));
    } finally {
      setIsLoading(false);
    }
  }, [signIn]);

  if (!signIn) {
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
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // className="auth-screen"
      >
        <ScrollView
          // className="auth-scroll"
          keyboardShouldPersistTaps="handled"
          // contentContainerStyle={{ flexGrow: 1 }}
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
              <Text className="auth-title">{AUTH_MESSAGES.SIGN_IN_TITLE}</Text>
              <Text className="auth-subtitle">
                {AUTH_MESSAGES.SIGN_IN_SUBTITLE}
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

              {step === "credentials" ? (
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
                      placeholder="Enter your password"
                      placeholderTextColor={colors.mutedForeground}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (formErrors.password) {
                          setFormErrors((prev) => ({
                            ...prev,
                            password: undefined,
                          }));
                        }
                      }}
                      editable={!isLoading}
                      secureTextEntry
                      accessibilityLabel="Password input"
                    />
                    {formErrors.password && (
                      <Text className="auth-error">{formErrors.password}</Text>
                    )}
                  </View>

                  {/* Sign In Button */}
                  <Pressable
                    className="auth-button"
                    onPress={handleSignIn}
                    disabled={isLoading || !email || !password}
                    style={
                      isLoading || !email || !password ? { opacity: 0.6 } : {}
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Sign in"
                    accessibilityHint="Signs you in with your email and password"
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <Text className="auth-button-text">Continue</Text>
                    )}
                  </Pressable>

                  {/* Sign Up Link */}
                  <View className="auth-link-row">
                    <Text className="auth-link-copy">
                      Don't have an account?
                    </Text>
                    <Link href="/(auth)/sign-up" asChild>
                      <Pressable>
                        <Text className="auth-link">Sign up</Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              ) : (
                <View className="auth-form">
                  {/* MFA Title & Subtitle */}
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.primary,
                        marginBottom: 8,
                      }}
                    >
                      {AUTH_MESSAGES.MFA_TITLE}
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

                  {/* Verification Code Field */}
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
                      placeholderTextColor={colors.muted}
                      value={code}
                      onChangeText={(text) => {
                        const sanitized = text
                          .replace(/\D/g, "")
                          .slice(0, VERIFICATION_CODE_LENGTH);
                        setCode(sanitized);

                        if (formErrors.code) {
                          const validation =
                            validateVerificationCode(sanitized);
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
                      maxLength={VERIFICATION_CODE_LENGTH}
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
                    onPress={handleMFAVerify}
                    disabled={
                      isLoading || code.length !== VERIFICATION_CODE_LENGTH
                    }
                    style={
                      isLoading || code.length !== VERIFICATION_CODE_LENGTH
                        ? { opacity: 0.6 }
                        : {}
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Verify code"
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <Text className="auth-button-text">Verify</Text>
                    )}
                  </Pressable>

                  {/* Resend Code Button */}
                  <Pressable
                    className="auth-secondary-button"
                    onPress={handleResendCode}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Resend verification code"
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.accent} size="small" />
                    ) : (
                      <Text className="auth-secondary-button-text">
                        {AUTH_MESSAGES.RESEND_CODE}
                      </Text>
                    )}
                  </Pressable>

                  {/* Back Button */}
                  <Pressable
                    className="auth-secondary-button"
                    onPress={() => setStep("credentials")}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                  >
                    <Text className="auth-secondary-button-text">
                      Back to Sign In
                    </Text>
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
