# Spark Dental Theme System

A comprehensive design system inspired by Licious app's beautiful and modern UI patterns.

## 🎨 Design Philosophy

The theme system follows Licious's design principles:
- **Clean & Modern**: Minimalist design with focus on content
- **Warm & Inviting**: Orange/red primary colors that feel approachable
- **Consistent**: Unified spacing, typography, and component styles
- **Accessible**: High contrast ratios and readable typography

## 🎯 Color Palette

### Primary Colors
- **Primary**: `#FF6B35` - Licious orange, warm and inviting
- **Primary Dark**: `#E55A2B` - For hover states and emphasis
- **Primary Light**: `#FF8A65` - For backgrounds and subtle accents

### Secondary Colors
- **Secondary**: `#2E7D32` - Green for health/medical context
- **Accent**: `#FFC107` - Yellow for highlights and notifications

### Neutral Colors
- **Gray Scale**: From `#FAFAFA` (lightest) to `#212121` (darkest)
- **Text Colors**: Primary, secondary, disabled, and hint variants
- **Background**: Light gray (`#FAFAFA`) for main background

## 📝 Typography

### Font Hierarchy
- **H1**: 32px, Bold - Main headings
- **H2**: 28px, Semi-bold - Section headings  
- **H3**: 24px, Semi-bold - Card titles
- **H4**: 20px, Medium - Subsection headings
- **Body1**: 16px, Regular - Main content
- **Body2**: 14px, Regular - Secondary content
- **Caption**: 12px, Regular - Small text and labels

### Special Styles
- **Button**: 16px, Semi-bold, Uppercase
- **Price**: 20px, Bold, Orange color
- **Status**: 12px, Semi-bold, Uppercase

## 📏 Spacing System

Based on 8px grid system:
- **xs**: 4px
- **sm**: 8px  
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 40px
- **3xl**: 48px
- **4xl**: 64px

## 🔲 Border Radius

Licious-style rounded corners:
- **sm**: 4px - Small elements
- **md**: 8px - Buttons, inputs
- **lg**: 12px - Cards
- **xl**: 16px - Large cards
- **2xl**: 20px - Modals
- **3xl**: 24px - Hero sections
- **full**: 9999px - Pills, avatars

## 🌟 Shadows

Elevation system for depth:
- **sm**: Subtle shadow for cards
- **md**: Medium shadow for elevated elements
- **lg**: Strong shadow for modals
- **xl**: Maximum shadow for overlays

## 🧩 Components

### Buttons
- **Primary**: Orange background, white text
- **Secondary**: White background, orange border
- **Outline**: Transparent background, gray border
- **Ghost**: Transparent background, no border

### Cards
- White background with subtle shadow
- Rounded corners (12px)
- Consistent padding (20px)
- Clean typography hierarchy

### Inputs
- Clean borders with focus states
- Consistent padding and typography
- Error states with red accents
- Icon support

### Badges
- Rounded pills with status colors
- Uppercase text
- Small, compact design

## 📱 Usage Examples

```typescript
import { theme } from '../theme';

// Using colors
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.text.primary,
    ...theme.typography.styles.body1,
  },
});

// Using components
import { Button, Card } from '../components';

<Button
  title="Add Patient"
  onPress={handlePress}
  variant="primary"
  size="large"
/>

<Card padding="lg" shadow="md">
  <Text>Card content</Text>
</Card>
```

## 🎨 Design Tokens

All design tokens are centralized in the theme system:
- Colors
- Typography
- Spacing
- Border radius
- Shadows
- Component styles

This ensures consistency across the entire app and makes it easy to maintain and update the design system.

## 🔄 Customization

To customize the theme:
1. Update values in `colors.ts`, `typography.ts`, `spacing.ts`
2. Modify component styles in `components.ts`
3. All changes will automatically apply across the app

## 📚 Inspiration

This theme system is inspired by:
- **Licious App**: Modern food delivery app with excellent UX
- **Material Design**: Google's design system principles
- **Human Interface Guidelines**: Apple's design standards
- **Accessibility Guidelines**: WCAG 2.1 compliance
