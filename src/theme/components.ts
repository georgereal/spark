import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

// Licious-inspired component styles
export const components = {
  // Button styles
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      ...typography.styles.button,
      color: colors.white,
      textAlign: 'center' as const,
      ...spacing.shadow.sm,
    },
    secondary: {
      backgroundColor: colors.white,
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      ...typography.styles.button,
      color: colors.primary,
      textAlign: 'center' as const,
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...typography.styles.button,
      color: colors.text.primary,
      textAlign: 'center' as const,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      ...typography.styles.button,
      color: colors.primary,
      textAlign: 'center' as const,
    },
  },
  
  // Card styles
  card: {
    container: {
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      marginBottom: spacing.margin.md,
      ...spacing.shadow.sm,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.margin.sm,
    },
    content: {
      flex: 1,
    },
    footer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginTop: spacing.margin.sm,
      paddingTop: spacing.padding.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
  },
  
  // Input styles
  input: {
    container: {
      marginBottom: spacing.margin.md,
    },
    field: {
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      ...typography.styles.body1,
      color: colors.text.primary,
    },
    fieldFocused: {
      borderColor: colors.primary,
      ...spacing.shadow.sm,
    },
    label: {
      ...typography.styles.body2,
      color: colors.text.secondary,
      marginBottom: spacing.margin.xs,
    },
    error: {
      ...typography.styles.caption,
      color: colors.error,
      marginTop: spacing.margin.xs,
    },
  },
  
  // Badge styles
  badge: {
    container: {
      paddingHorizontal: spacing.padding.sm,
      paddingVertical: spacing.padding.xs,
      borderRadius: spacing.borderRadius.full,
      alignSelf: 'flex-start' as const,
    },
    text: {
      ...typography.styles.status,
      color: colors.white,
    },
    success: {
      backgroundColor: colors.success,
    },
    warning: {
      backgroundColor: colors.warning,
    },
    error: {
      backgroundColor: colors.error,
    },
    info: {
      backgroundColor: colors.info,
    },
    primary: {
      backgroundColor: colors.primary,
    },
  },
  
  // List item styles
  listItem: {
    container: {
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      marginBottom: spacing.margin.sm,
      ...spacing.shadow.sm,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.margin.sm,
    },
    content: {
      flex: 1,
      marginRight: spacing.margin.sm,
    },
    actions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
  },
  
  // Tab bar styles
  tabBar: {
    container: {
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: spacing.padding.sm,
      paddingBottom: spacing.padding.sm,
    },
    tab: {
      flex: 1,
      alignItems: 'center' as const,
      paddingVertical: spacing.padding.sm,
    },
    tabActive: {
      color: colors.primary,
    },
    tabInactive: {
      color: colors.text.secondary,
    },
    tabLabel: {
      ...typography.styles.caption,
      marginTop: spacing.margin.xs,
    },
  },
  
  // Header styles
  header: {
    container: {
      backgroundColor: colors.white,
      paddingVertical: spacing.padding.lg,
      paddingHorizontal: spacing.padding.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      ...spacing.shadow.sm,
    },
    title: {
      ...typography.styles.h3,
      color: colors.text.primary,
    },
    subtitle: {
      ...typography.styles.body2,
      color: colors.text.secondary,
      marginTop: spacing.margin.xs,
    },
  },
};
