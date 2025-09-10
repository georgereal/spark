import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.padding.sm,
          paddingHorizontal: theme.spacing.padding.md,
          fontSize: theme.typography.fontSize.sm,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.padding.lg,
          paddingHorizontal: theme.spacing.padding.xl,
          fontSize: theme.typography.fontSize.lg,
        };
      default:
        return {
          paddingVertical: theme.spacing.padding.md,
          paddingHorizontal: theme.spacing.padding.lg,
          fontSize: theme.typography.fontSize.base,
        };
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return theme.components.button.secondary;
      case 'outline':
        return theme.components.button.outline;
      case 'ghost':
        return theme.components.button.ghost;
      default:
        return theme.components.button.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.text.disabled;
    
    switch (variant) {
      case 'secondary':
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return theme.colors.white;
    }
  };

  const { paddingVertical, paddingHorizontal, fontSize } = getSize();
  const variantStyle = getVariantStyle();
  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyle,
        {
          paddingVertical,
          paddingHorizontal,
          opacity: disabled ? 0.6 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            {
              color: textColor,
              fontSize,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.spacing.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default Button;
