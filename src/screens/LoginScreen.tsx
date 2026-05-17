import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Button, Input } from "../components/ui";
import { useLogin, useForgotPassword, useResetPassword } from "../hooks/useApi";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const loginMutation = useLogin();
  const forgotMutation = useForgotPassword();
  const resetMutation = useResetPassword();

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) return;
    loginMutation.mutate({ email: email.trim(), password });
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    forgotMutation.mutate(email.trim(), {
      onSuccess: () => {
        Alert.alert("Success", "6-digit OTP verification code has been sent to your email!");
        setMode("reset");
      },
      onError: (err: any) => {
        Alert.alert("Error", err?.response?.data?.error || "Failed to request password reset");
      },
    });
  };

  const handleResetPassword = () => {
    if (!email.trim() || !otp.trim() || !newPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (otp.trim().length !== 6) {
      Alert.alert("Error", "OTP must be exactly 6 digits");
      return;
    }
    resetMutation.mutate(
      {
        email: email.trim(),
        otp: otp.trim(),
        password: newPassword.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Success",
            "Your password has been reset successfully! Please login with your new password."
          );
          setMode("login");
          setPassword("");
          setOtp("");
          setNewPassword("");
        },
        onError: (err: any) => {
          Alert.alert("Error", err?.response?.data?.error || "Failed to reset password");
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🏪</Text>
          </View>
          <Text style={styles.appName}>Jay Goga POS</Text>
          <Text style={styles.subtitle}>Shop Management System</Text>
        </View>

        {/* Dynamic Forms Card */}
        {mode === "login" && (
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.instructionText}>
              Sign in to manage your shop
            </Text>

            <View style={{ marginTop: SPACING.lg }}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.forgotLink}
                onPress={() => setMode("forgot")}
              >
                <Text style={styles.forgotLinkText}>Forgot Password?</Text>
              </TouchableOpacity>

              {loginMutation.isError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {(loginMutation.error as any)?.response?.data?.error ||
                      "Login failed. Please try again."}
                  </Text>
                </View>
              )}

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loginMutation.isPending}
                fullWidth
                size="lg"
              />
            </View>
          </View>
        )}

        {mode === "forgot" && (
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Forgot Password</Text>
            <Text style={styles.instructionText}>
              Enter your email address to receive a 6-digit OTP code
            </Text>

            <View style={{ marginTop: SPACING.lg }}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Button
                title="Send OTP Code"
                onPress={handleForgotPassword}
                loading={forgotMutation.isPending}
                fullWidth
                size="lg"
                style={{ marginTop: SPACING.md }}
              />

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => setMode("login")}
              >
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {mode === "reset" && (
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Reset Password</Text>
            <Text style={styles.instructionText}>
              Enter the OTP code sent to your email and your new password
            </Text>

            <View style={{ marginTop: SPACING.lg }}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="6-Digit OTP Code"
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
              />

              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                autoCapitalize="none"
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={resetMutation.isPending}
                fullWidth
                size="lg"
                style={{ marginTop: SPACING.md }}
              />

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => setMode("login")}
              >
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Demo Credentials */}
        {mode === "login" && (
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Demo Credentials</Text>
            <Text style={styles.demoText}>
              Admin: admin@jaygoga.com{"\n"}
              Chef: chef@jaygoga.com{"\n"}
              Helper: helper@jaygoga.com{"\n"}
              Password: password123
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: 36,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: COLORS.danger + "20",
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: "center",
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  forgotLinkText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: "600",
  },
  backLink: {
    alignSelf: "center",
    marginTop: SPACING.md,
  },
  backLinkText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  demoCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryLight,
    marginBottom: 4,
  },
  demoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
