import React from 'react';
import { StatusBar as RNStatusBar, StatusBarStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

interface StatusBarProps {
  style?: StatusBarStyle;
  backgroundColor?: string;
  translucent?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  style = 'light-content',
  backgroundColor = theme.colors.primary,
  translucent = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <RNStatusBar
      barStyle={style}
      backgroundColor={backgroundColor}
      translucent={translucent}
    />
  );
};

export default StatusBar;
