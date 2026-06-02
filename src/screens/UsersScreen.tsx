import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, Badge, LoadingSpinner, Button, Input } from "../components/ui";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "../hooks/useApi";
import { toast } from "../utils/toast";
import { useAuthStore } from "../store/auth-store";
import { User, Role } from "../types";

export default function UsersScreen() {
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading, refetch } = useUsers();
  const users = Array.isArray(data?.data) ? data.data : [];
  
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("HELPER");

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Enforce pre-selections based on logged-in role
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const defaultRegisterRole: Role = isSuperAdmin ? "ADMIN" : "HELPER";

  React.useEffect(() => {
    if (modalVisible) {
      setName("");
      setEmail("");
      setPassword("");
      setRole(defaultRegisterRole);
    }
  }, [modalVisible, defaultRegisterRole]);

  if (isLoading) return <LoadingSpinner />;

  const roleColor: Record<string, string> = {
    SUPER_ADMIN: COLORS.danger,
    ADMIN: COLORS.primary,
    CHEF: COLORS.warning,
    HELPER: COLORS.success,
  };

  const handleCreateUser = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    createUserMutation.mutate(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: isSuperAdmin ? "ADMIN" : role,
      },
      {
        onSuccess: () => {
          setModalVisible(false);
          refetch();
        },
        onError: (err: any) => {
          Alert.alert("Error", err?.response?.data?.error || "Failed to create user account.");
        },
      }
    );
  };

  const handleToggleBlock = (user: User, shouldBlock: boolean) => {
    const actionLabel = shouldBlock ? "block" : "unlock";
    const message = `Are you sure you want to ${actionLabel} ${user.name}'s account?`;

    const doAction = () => {
      updateUserMutation.mutate(
        { id: user.id, data: { action: shouldBlock ? "block" : "unlock" } },
        {
          onSuccess: () => {
            toast.success(`User ${actionLabel}ed successfully!`);
            refetch();
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.error || `Failed to ${actionLabel} user.`);
          },
        }
      );
    };

    if (Platform.OS === "web") {
      // Alert.alert callbacks don't fire on web — use window.confirm instead
      if (window.confirm(message)) doAction();
    } else {
      Alert.alert("Confirm Action", message, [
        { text: "Cancel", style: "cancel" },
        { text: shouldBlock ? "Block" : "Unlock", style: shouldBlock ? "destructive" : "default", onPress: doAction },
      ]);
    }
  };

  const handleDeleteUser = (user: User) => {
    const message = `Are you sure you want to delete ${user.name}? This action is irreversible.`;

    const doDelete = () => {
      deleteUserMutation.mutate(user.id, {
        onSuccess: () => {
          toast.success("User deleted successfully!");
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || "Failed to delete user.");
        },
      });
    };

    if (Platform.OS === "web") {
      if (window.confirm(message)) doDelete();
    } else {
      Alert.alert("Delete User", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Workspace Header Info Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>
          {isSuperAdmin ? "👑 Super Admin Dashboard" : "🛡️ Admin Operations"}
        </Text>
        <Text style={styles.bannerSubtitle}>
          {isSuperAdmin
            ? "You are authorized to manage Admin accounts only. Newly created accounts will receive a secure welcome setup link."
            : "You are authorized to manage Chef and Helper accounts only. Newly created accounts will receive a secure welcome setup link."}
        </Text>
      </View>

      {/* Main List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refetch();
              setRefreshing(false);
            }}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }: { item: User }) => {
          const isCurrentUser = item.id === currentUser?.id;
          const isUserActive = item.isActive !== false;

          return (
            <Card style={{ ...styles.card, ...(!isUserActive ? styles.blockedCard : {}) }}>
              <View style={styles.row}>
                {/* Avatar */}
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        (roleColor[item.role] || COLORS.primary) + (isUserActive ? "20" : "10"),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: isUserActive ? roleColor[item.role] : COLORS.textMuted },
                    ]}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, !isUserActive && styles.blockedText]}>
                      {item.name}
                    </Text>
                    {isCurrentUser && <Badge text="You" bgColor={COLORS.textSecondary} />}
                  </View>
                  <Text style={[styles.email, !isUserActive && styles.blockedText]}>
                    {item.email}
                  </Text>
                </View>

                {/* Badges */}
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Badge
                    text={item.role.replace(/_/g, " ")}
                    bgColor={isUserActive ? roleColor[item.role] || COLORS.primary : COLORS.textMuted}
                  />
                  {!isUserActive && <Badge text="Blocked" bgColor={COLORS.danger} />}
                </View>
              </View>

              {/* Action Buttons for non-self users */}
              {!isCurrentUser && (
                <View style={styles.actionRow}>
                  {isUserActive ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.blockBtn]}
                      onPress={() => handleToggleBlock(item, true)}
                    >
                      <Text style={styles.blockBtnText}>🚫 Block</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.unlockBtn]}
                      onPress={() => handleToggleBlock(item, false)}
                    >
                      <Text style={styles.unlockBtnText}>🔓 Unlock</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteUser(item)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          );
        }}
      />

      {(isSuperAdmin || currentUser?.role === "ADMIN") && (
        <>
          {/* Floating Add User Action Button */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingButtonText}>➕ Add Member</Text>
          </TouchableOpacity>
        </>
      )}

      {(isSuperAdmin || currentUser?.role === "ADMIN") && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContent}
            >
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🎉 Add New Team Member</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalForm}>
                  <Input
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter full name"
                  />

                  <Input
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  {/* Role Selector Box */}
                  <View style={styles.roleSelectorContainer}>
                    <Text style={styles.roleSelectorLabel}>Assigned Role</Text>
                    {isSuperAdmin ? (
                      <View style={styles.staticRoleBadge}>
                        <Text style={styles.staticRoleText}>ADMIN (Super Admin Pre-set)</Text>
                      </View>
                    ) : (
                      <View style={styles.roleToggles}>
                        <TouchableOpacity
                          style={[
                            styles.roleToggleBtn,
                            role === "HELPER" && styles.roleToggleBtnActive,
                          ]}
                          onPress={() => setRole("HELPER")}
                        >
                          <Text
                            style={[
                              styles.roleToggleText,
                              role === "HELPER" && styles.roleToggleTextActive,
                            ]}
                          >
                            Helper
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.roleToggleBtn,
                            role === "CHEF" && styles.roleToggleBtnActive,
                          ]}
                          onPress={() => setRole("CHEF")}
                        >
                          <Text
                            style={[
                              styles.roleToggleText,
                              role === "CHEF" && styles.roleToggleTextActive,
                            ]}
                          >
                            Chef
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Action Submit */}
                  <Button
                    title="Send Invite & Register"
                    onPress={handleCreateUser}
                    loading={createUserMutation.isPending}
                    fullWidth
                    size="lg"
                    style={{ marginTop: SPACING.lg }}
                  />

                  <Text style={styles.onboardingDisclaimer}>
                    Ensure the password meets security requirements. The new member will be able to log in immediately using these credentials.
                  </Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  banner: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  card: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  blockedCard: {
    opacity: 0.7,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  blockedText: {
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },
  email: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  blockBtn: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + "10",
  },
  blockBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  unlockBtn: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + "10",
  },
  unlockBtnText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    borderColor: COLORS.textSecondary,
    backgroundColor: COLORS.background,
  },
  deleteBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: "85%",
  },
  modalScroll: {
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  closeBtnText: {
    fontSize: 22,
    color: COLORS.textSecondary,
    paddingHorizontal: 8,
  },
  modalForm: {
    gap: SPACING.xs,
  },
  roleSelectorContainer: {
    marginBottom: SPACING.md,
  },
  roleSelectorLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  staticRoleBadge: {
    backgroundColor: COLORS.primary + "10",
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  staticRoleText: {
    color: COLORS.primaryLight,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  roleToggles: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  roleToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  roleToggleBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
  },
  roleToggleText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  roleToggleTextActive: {
    color: COLORS.primaryLight,
    fontWeight: "700",
  },
  onboardingDisclaimer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.md,
    lineHeight: 16,
  },
});
