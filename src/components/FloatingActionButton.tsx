import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = 'add',
  size = 'medium',
  color = theme.colors.primary,
  style,
  disabled = false,
  loading = false,
  label,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 48, height: 48, iconSize: 20 };
      case 'large':
        return { width: 72, height: 72, iconSize: 32 };
      default:
        return { width: 56, height: 56, iconSize: 24 };
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      width: getSize().width,
      height: getSize().height,
      backgroundColor: disabled ? theme.colors.gray[400] : color,
    };

    // If there's a label, make it wider
    if (label) {
      return {
        ...baseStyle,
        width: Math.max(baseStyle.width, 120),
        flexDirection: 'row' as const,
        paddingHorizontal: theme.spacing.md,
      };
    }

    return baseStyle;
  };

  const { iconSize } = getSize();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        getButtonStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} size="small" />
      ) : (
        <>
          <Ionicons
            name={icon}
            size={iconSize}
            color={theme.colors.white}
          />
          {label && (
            <Text style={styles.labelText}>
              {label}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.spacing.shadow.lg,
    elevation: 8,
  },
  labelText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});

export default FloatingActionButton;
