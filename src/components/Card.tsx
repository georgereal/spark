import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: keyof typeof theme.spacing.padding;
  margin?: keyof typeof theme.spacing.margin;
  shadow?: keyof typeof theme.spacing.shadow;
  borderRadius?: keyof typeof theme.spacing.borderRadius;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 'lg',
  margin,
  shadow = 'sm',
  borderRadius = 'lg',
}) => {
  const cardStyle = [
    styles.card,
    {
      padding: theme.spacing.padding[padding],
      margin: margin ? theme.spacing.margin[margin] : undefined,
      borderRadius: theme.spacing.borderRadius[borderRadius],
      ...theme.spacing.shadow[shadow],
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
  },
});

export default Card;
