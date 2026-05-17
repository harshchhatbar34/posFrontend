import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { COLORS, BORDER_RADIUS, SPACING } from "../constants";

// ============ Button Component ============
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const bgColor = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    danger: COLORS.danger,
    outline: "transparent",
    ghost: "transparent",
  }[variant];

  const textColor = {
    primary: COLORS.white,
    secondary: COLORS.black,
    danger: COLORS.white,
    outline: COLORS.primary,
    ghost: COLORS.textSecondary,
  }[variant];

  const padding = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 12, paddingHorizontal: 24 },
    lg: { paddingVertical: 16, paddingHorizontal: 32 },
  }[size];

  const fontSize = { sm: 13, md: 15, lg: 17 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: BORDER_RADIUS.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
          ...(variant === "outline" && {
            borderWidth: 1.5,
            borderColor: COLORS.primary,
          }),
          ...padding,
        },
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={[
              {
                color: textColor,
                fontSize,
                fontWeight: "600",
                letterSpacing: 0.3,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ============ Card Component ============
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: COLORS.surface,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: COLORS.border,
        },
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
}

// ============ Badge Component ============
interface BadgeProps {
  text: string;
  color?: string;
  bgColor?: string;
  size?: "sm" | "md";
}

export function Badge({
  text,
  color = COLORS.white,
  bgColor = COLORS.primary,
  size = "sm",
}: BadgeProps) {
  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: size === "sm" ? 8 : 12,
        paddingVertical: size === "sm" ? 2 : 4,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color,
          fontSize: size === "sm" ? 11 : 13,
          fontWeight: "700",
          letterSpacing: 0.5,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ============ Status Badge ============
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    PENDING: { color: "#FFF", bg: COLORS.statusPending },
    IN_PROGRESS: { color: "#FFF", bg: COLORS.statusInProgress },
    COMPLETED: { color: "#FFF", bg: COLORS.statusCompleted },
    SERVED: { color: "#FFF", bg: COLORS.statusServed },
    CANCELLED: { color: "#FFF", bg: COLORS.statusCancelled },
    UNDER_COOK: { color: "#FFF", bg: COLORS.itemUnderCook },
    COOKED: { color: "#FFF", bg: COLORS.itemCooked },
    PAID: { color: "#FFF", bg: COLORS.success },
    UNPAID: { color: "#FFF", bg: COLORS.danger },
  };

  const { color, bg } = config[status] || {
    color: "#FFF",
    bg: COLORS.textMuted,
  };
  const label = status.replace(/_/g, " ");

  return <Badge text={label} color={color} bgColor={bg} />;
}

// ============ Loading Spinner ============
export function LoadingSpinner({
  text = "Loading...",
}: {
  text?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text
        style={{
          color: COLORS.textSecondary,
          marginTop: SPACING.md,
          fontSize: 14,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ============ Empty State ============
export function EmptyState({
  title = "No data",
  description = "Nothing to show here",
  icon,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: SPACING.xl,
      }}
    >
      {icon}
      <Text
        style={{
          color: COLORS.text,
          fontSize: 18,
          fontWeight: "600",
          marginTop: SPACING.md,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: 14,
          textAlign: "center",
          marginTop: SPACING.sm,
        }}
      >
        {description}
      </Text>
    </View>
  );
}

// ============ Section Header ============
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.md,
      }}
    >
      <Text
        style={{
          color: COLORS.text,
          fontSize: 18,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}

// ============ Input Component ============
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "number-pad";
  error?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  error,
  multiline,
  autoCapitalize = "none",
  maxLength,
}: InputProps) {
  const RNTextInput = require("react-native").TextInput;

  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label && (
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 13,
            fontWeight: "600",
            marginBottom: 6,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      )}
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={{
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: error ? COLORS.danger : COLORS.border,
          borderRadius: BORDER_RADIUS.md,
          padding: SPACING.md,
          color: COLORS.text,
          fontSize: 15,
          ...(multiline && { minHeight: 80, textAlignVertical: "top" as const }),
        }}
      />
      {error && (
        <Text
          style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
