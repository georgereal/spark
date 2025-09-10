// Licious-inspired typography system
export const typography = {
  // Font families - React Native compatible
  fontFamily: {
    regular: undefined, // Use system default
    medium: undefined,
    bold: undefined,
    light: undefined,
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },
  
  // Line heights - React Native compatible
  lineHeight: {
    tight: 20,
    normal: 24,
    relaxed: 28,
    loose: 32,
  },
  
  // Font weights - React Native compatible
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Text styles (Licious-style compact) - React Native compatible
  styles: {
    // Headers - Compact sizes
    h1: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 30,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    h4: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    
    // Body text - Compact sizes
    body1: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    body2: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    
    // Caption and small text
    caption: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 14,
    },
    
    // Button text - Compact
    button: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 18,
      textTransform: 'uppercase' as const,
    },
    
    // Card titles - Compact
    cardTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    
    // Price text - Compact
    price: {
      fontSize: 16,
      fontWeight: '700' as const,
      lineHeight: 20,
    },
    
    // Status text - Compact
    status: {
      fontSize: 11,
      fontWeight: '600' as const,
      lineHeight: 14,
      textTransform: 'uppercase' as const,
    },
    
    // Input labels - Compact
    inputLabel: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    
    // Input text - Compact
    inputText: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    
    // Helper text - Compact
    helperText: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },
};
