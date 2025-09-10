import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  animated?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = theme.colors.primary,
  animated = true,
}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => rotateAnimation.stop();
    }
  }, [animated, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (animated) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.spinner,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={[styles.spinnerInner, { borderTopColor: color }]} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.gray[200],
    borderTopColor: theme.colors.primary,
  },
  spinnerInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
});

export default LoadingSpinner;
