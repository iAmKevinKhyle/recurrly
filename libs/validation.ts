/**
 * Form validation utilities for authentication flows
 */

export interface ValidationError {
  valid: boolean;
  error?: string;
}

/**
 * Validates email format using a simplified RFC5322 pattern
 */
export const validateEmail = (email: string): ValidationError => {
  if (!email || !email.trim()) {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true };
};

/**
 * Validates password strength
 * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export const validatePassword = (password: string): ValidationError => {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain an uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain a lowercase letter" };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: "Password must contain a number" };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: "Password must contain a special character" };
  }

  return { valid: true };
};

/**
 * Validates full name
 * Requirements: non-empty, 2+ characters
 */
export const validateFullName = (fullName: string): ValidationError => {
  if (!fullName || !fullName.trim()) {
    return { valid: false, error: "Full name is required" };
  }

  if (fullName.trim().length < 2) {
    return { valid: false, error: "Please enter your full name" };
  }

  return { valid: true };
};

/**
 * Validates verification code (6 digits)
 */
export const validateVerificationCode = (code: string): ValidationError => {
  if (!code || !code.trim()) {
    return { valid: false, error: "Verification code is required" };
  }

  if (!/^\d{6}$/.test(code.trim())) {
    return { valid: false, error: "Verification code must be 6 digits" };
  }

  return { valid: true };
};

/**
 * Gets password strength indicator
 * Returns: weak, medium, or strong
 */
export const getPasswordStrength = (
  password: string,
): "weak" | "medium" | "strong" => {
  if (!password) return "weak";

  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  if (strength <= 2) return "weak";
  if (strength <= 3) return "medium";
  return "strong";
};
