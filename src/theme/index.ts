import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { components } from './components';

// Main theme object combining all design tokens
export const theme = {
  colors,
  typography,
  spacing,
  components,
};

// Export individual modules for convenience
export { colors, typography, spacing, components };

// Default export
export default theme;
