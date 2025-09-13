import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card, Button } from '../components';
import ApiService from '../services/api';

interface User {
  _id: string;
  uid: string;
  email: string;
  displayName: string;
  role: string;
  isAdmin: boolean;
  approvalStatus: string;
  lastSignInTime: string;
  creationTime: string;
  approvedBy?: {
    displayName: string;
    email: string;
  };
  approvedAt?: string;
}

const AdminUsersScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [allUsers, pending] = await Promise.all([
        ApiService.getAdminUsers(),
        ApiService.getPendingUsers(),
      ]);
      
      setUsers(allUsers);
      setPendingUsers(pending);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await ApiService.approveUser(userId, 'staff');
      Alert.alert('Success', 'User approved successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to reject this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.rejectUser(userId, 'Application rejected');
              Alert.alert('Success', 'User rejected');
              fetchUsers();
            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Failed to reject user');
            }
          },
        },
      ]
    );
  };

  const handleSetAdmin = async (userId: string) => {
    try {
      await ApiService.setAdmin(userId);
      Alert.alert('Success', 'Admin privileges granted');
      fetchUsers();
    } catch (error) {
      console.error('Error setting admin:', error);
      Alert.alert('Error', 'Failed to set admin privileges');
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    Alert.alert(
      'Remove Admin',
      'Are you sure you want to remove admin privileges?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.removeAdmin(userId);
              Alert.alert('Success', 'Admin privileges removed');
              fetchUsers();
            } catch (error) {
              console.error('Error removing admin:', error);
              Alert.alert('Error', 'Failed to remove admin privileges');
            }
          },
        },
      ]
    );
  };

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const renderUserIcon = (user: User, isPending = false) => (
    <TouchableOpacity
      style={styles.userIconContainer}
      onPress={() => handleUserPress(user)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.userIcon,
        { backgroundColor: isPending ? theme.colors.warning + '20' : theme.colors.primary + '20' }
      ]}>
        <Ionicons
          name={isPending ? "person-add" : user.isAdmin ? "shield-checkmark" : "person"}
          size={32}
          color={isPending ? theme.colors.warning : user.isAdmin ? theme.colors.primary : theme.colors.text.secondary}
        />
      </View>
      <Text style={styles.userIconName} numberOfLines={1}>
        {user.displayName || user.email.split('@')[0]}
      </Text>
      <Text style={styles.userIconRole} numberOfLines={1}>
        {isPending ? 'Pending' : user.isAdmin ? 'Admin' : user.role}
      </Text>
      {isPending && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>!</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderUserDetails = () => {
    if (!selectedUser) return null;

    const isPending = selectedUser.approvalStatus === 'pending';

    return (
      <View style={styles.userDetailsContainer}>
        <View style={styles.userDetailsHeader}>
          <View style={styles.userDetailsIcon}>
            <Ionicons
              name={isPending ? "person-add" : selectedUser.isAdmin ? "shield-checkmark" : "person"}
              size={48}
              color={isPending ? theme.colors.warning : selectedUser.isAdmin ? theme.colors.primary : theme.colors.text.secondary}
            />
          </View>
          <View style={styles.userDetailsInfo}>
            <Text style={styles.userDetailsName}>
              {selectedUser.displayName || 'N/A'}
            </Text>
            <Text style={styles.userDetailsEmail}>{selectedUser.email}</Text>
            <Text style={styles.userDetailsRole}>
              Role: {isPending ? 'Pending Approval' : selectedUser.isAdmin ? 'Admin' : selectedUser.role}
            </Text>
            {isPending && (
              <Text style={styles.userDetailsStatus}>
                Status: {selectedUser.approvalStatus}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.userDetailsActions}>
          {isPending ? (
            <>
              <TouchableOpacity
                style={[styles.detailActionButton, styles.approveButton]}
                onPress={() => {
                  handleApproveUser(selectedUser._id);
                  closeUserModal();
                }}
              >
                <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                <Text style={styles.detailActionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailActionButton, styles.rejectButton]}
                onPress={() => {
                  handleRejectUser(selectedUser._id);
                  closeUserModal();
                }}
              >
                <Ionicons name="close" size={20} color={theme.colors.white} />
                <Text style={styles.detailActionButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {!selectedUser.isAdmin && (
                <TouchableOpacity
                  style={[styles.detailActionButton, styles.adminButton]}
                  onPress={() => {
                    handleSetAdmin(selectedUser.uid);
                    closeUserModal();
                  }}
                >
                  <Ionicons name="shield-checkmark" size={20} color={theme.colors.white} />
                  <Text style={styles.detailActionButtonText}>Make Admin</Text>
                </TouchableOpacity>
              )}
              {selectedUser.isAdmin && (
                <TouchableOpacity
                  style={[styles.detailActionButton, styles.removeButton]}
                  onPress={() => {
                    handleRemoveAdmin(selectedUser.uid);
                    closeUserModal();
                  }}
                >
                  <Ionicons name="shield-outline" size={20} color={theme.colors.white} />
                  <Text style={styles.detailActionButtonText}>Remove Admin</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.userDetailsFooter}>
          <Text style={styles.userDetailsFooterText}>
            Last Sign In: {selectedUser.lastSignInTime ? new Date(selectedUser.lastSignInTime).toLocaleDateString() : 'Never'}
          </Text>
          <Text style={styles.userDetailsFooterText}>
            Created: {selectedUser.creationTime ? new Date(selectedUser.creationTime).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity onPress={fetchUsers} disabled={loading}>
          <Ionicons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {pendingUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Approvals ({pendingUsers.length})</Text>
            <View style={styles.userIconGrid}>
              {pendingUsers.map(user => (
                <View key={user._id}>
                  {renderUserIcon(user, true)}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
          <View style={styles.userIconGrid}>
            {users.map(user => (
              <View key={user._id}>
                {renderUserIcon(user, false)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* User Details Modal */}
      {showUserModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Details</Text>
                <TouchableOpacity onPress={closeUserModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {renderUserDetails()}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  errorContainer: {
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    ...theme.typography.body1,
    color: theme.colors.error,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  // User Icon Grid Styles
  userIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.lg,
  },
  userIconContainer: {
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
    position: 'relative',
  },
  userIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  userIconName: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  userIconRole: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
  },
  pendingBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.warning,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    width: '100%',
    maxHeight: '90%',
    minHeight: '70%',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },

  // User Details Styles
  userDetailsContainer: {
    padding: theme.spacing.lg,
  },
  userDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  userDetailsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  userDetailsInfo: {
    flex: 1,
  },
  userDetailsName: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userDetailsEmail: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  userDetailsRole: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  userDetailsStatus: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  userDetailsActions: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.lg,
  },
  detailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    // gap property not supported in React Native StyleSheet
    },
  detailActionButtonText: {
    ...theme.typography.body1,
    color: theme.colors.white,
    fontWeight: '600',
  },
  userDetailsFooter: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  userDetailsFooterText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },

  // Action Button Colors
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  adminButton: {
    backgroundColor: theme.colors.primary,
  },
  removeButton: {
    backgroundColor: theme.colors.warning,
  },
});

export default AdminUsersScreen;
