import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card, Button } from '../components';

const AdminSystemScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: 'en',
    autoBackup: true,
    backupFrequency: 'daily',
    maxFileSize: '10',
    sessionTimeout: '30',
  });

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement settings update logic
      // await ApiService.updateSystemSettings(settings);
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError('Failed to update settings');
      console.error('Error updating settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              emailNotifications: true,
              smsNotifications: false,
              darkMode: false,
              language: 'en',
              autoBackup: true,
              backupFrequency: 'daily',
              maxFileSize: '10',
              sessionTimeout: '30',
            });
            setSuccess('Settings reset to default');
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    description: string,
    type: 'switch' | 'input' | 'select',
    key: string,
    options?: string[]
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingControl}>
        {type === 'switch' && (
          <Switch
            value={settings[key as keyof typeof settings] as boolean}
            onValueChange={(value) => handleChange(key, value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={settings[key as keyof typeof settings] ? theme.colors.primary : theme.colors.text.secondary}
          />
        )}
        {type === 'input' && (
          <TextInput
            style={styles.input}
            value={settings[key as keyof typeof settings] as string}
            onChangeText={(text) => handleChange(key, text)}
            keyboardType="numeric"
          />
        )}
        {type === 'select' && (
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectText}>
              {settings[key as keyof typeof settings]}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Settings</Text>
        <TouchableOpacity onPress={handleResetSettings}>
          <Ionicons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {success && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderSettingItem(
            'Email Notifications',
            'Receive notifications via email',
            'switch',
            'emailNotifications'
          )}
          {renderSettingItem(
            'SMS Notifications',
            'Receive notifications via SMS',
            'switch',
            'smsNotifications'
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          {renderSettingItem(
            'Dark Mode',
            'Use dark theme for the application',
            'switch',
            'darkMode'
          )}
          {renderSettingItem(
            'Language',
            'Select application language',
            'select',
            'language',
            ['English', 'Spanish', 'French']
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Data & Backup</Text>
          {renderSettingItem(
            'Auto Backup',
            'Automatically backup data',
            'switch',
            'autoBackup'
          )}
          {renderSettingItem(
            'Backup Frequency',
            'How often to backup data',
            'select',
            'backupFrequency',
            ['Daily', 'Weekly', 'Monthly']
          )}
          {renderSettingItem(
            'Max File Size (MB)',
            'Maximum file size for uploads',
            'input',
            'maxFileSize'
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Security</Text>
          {renderSettingItem(
            'Session Timeout (minutes)',
            'Auto logout after inactivity',
            'input',
            'sessionTimeout'
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Google Integration</Text>
          <View style={styles.integrationItem}>
            <View style={styles.integrationInfo}>
              <Ionicons name="logo-google" size={24} color={theme.colors.primary} />
              <View style={styles.integrationText}>
                <Text style={styles.integrationTitle}>Google Drive Sync</Text>
                <Text style={styles.integrationDescription}>
                  Sync your data with Google Drive
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            title="Save Settings"
            onPress={handleSubmit}
            disabled={loading}
            style={styles.saveButton}
          />
          <Button
            title="Reset to Default"
            onPress={handleResetSettings}
            style={styles.resetButton}
          />
        </View>
      </ScrollView>
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
  successContainer: {
    backgroundColor: theme.colors.success + '20',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  successText: {
    ...theme.typography.body1,
    color: theme.colors.success,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingTitle: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 80,
    textAlign: 'center',
    ...theme.typography.body2,
    backgroundColor: theme.colors.surface,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 100,
    backgroundColor: theme.colors.surface,
  },
  selectText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  integrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  integrationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  integrationText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  integrationTitle: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  integrationDescription: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  connectButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  connectButtonText: {
    ...theme.typography.body2,
    color: theme.colors.white,
    fontWeight: '600',
  },
  actionButtons: {
    // gap property not supported in React Native StyleSheet
    marginTop: theme.spacing.lg,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  resetButton: {
    backgroundColor: theme.colors.text.secondary,
  },
});

export default AdminSystemScreen;
