/**
 * Authentication-related constants and configuration
 */

export const AUTH_ERRORS = {
  // General errors
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",

  // Sign-up specific
  EMAIL_ALREADY_IN_USE: "This email is already associated with an account.",
  SIGN_UP_NOT_COMPLETE: "Sign-up process incomplete. Please try again.",

  // Sign-in specific
  TOO_MANY_ATTEMPTS: "Too many failed attempts. Please try again later.",

  // Verification
  INVALID_CODE: "Invalid verification code. Please try again.",
  CODE_EXPIRED: "Verification code expired. Please request a new one.",
  VERIFICATION_FAILED: "Verification failed. Please try again.",

  // MFA
  MFA_REQUIRED: "Additional verification required.",
  MFA_FAILED: "Multi-factor authentication failed. Please try again.",
} as const;

export const AUTH_MESSAGES = {
  CHECK_EMAIL: "Check your email for a verification code",
  CODE_SENT: "Verification code sent to your email",
  REQUEST_NEW_CODE: "Didn't receive a code?",
  RESEND_CODE: "Resend code",

  PASSWORD_REQUIREMENTS:
    "8+ characters, uppercase, lowercase, number, special character",

  SIGN_UP_TITLE: "Create an account",
  SIGN_UP_SUBTITLE: "Start managing your subscriptions",

  SIGN_IN_TITLE: "Welcome back",
  SIGN_IN_SUBTITLE: "Sign in to your Recurrly account",

  VERIFY_TITLE: "Verify your email",
  VERIFY_SUBTITLE: "Enter the code sent to your email",

  MFA_TITLE: "Verify your account",
  MFA_SUBTITLE: "Your identity needs to be verified",
} as const;

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_TIMEOUT = 60; // seconds
