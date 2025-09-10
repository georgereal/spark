# Spark Dental Mobile App - Quick Setup Guide

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) or Android Studio (for Android development)

### 2. Running the App

The development server should now be running. You'll see a QR code in your terminal.

#### Option A: Using Expo Go App (Recommended for testing)
1. Install **Expo Go** on your phone from App Store/Google Play
2. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)
3. The app will load on your device

#### Option B: Using Simulators
```bash
# For iOS (Mac only)
npm run ios

# For Android
npm run android

# For Web browser
npm run web
```

### 3. Backend Configuration

**Important**: Update the API configuration to connect to your existing backend:

1. Open `src/config/api.ts`
2. Update the `BASE_URL` to match your backend server:
   ```typescript
   BASE_URL: __DEV__ 
     ? 'http://YOUR_LOCAL_IP:5006'  // Replace with your actual IP
     : 'https://your-production-domain.com',
   ```

3. Make sure your backend server is running and accessible

### 4. Testing the App

1. **Login Screen**: The app will start with a login screen
2. **Navigation**: Use the bottom tabs to navigate between sections
3. **Features**: 
   - Dashboard shows practice statistics
   - Patients section for patient management
   - Treatments for treatment tracking
   - Receivables for financial management
   - Profile for user settings

### 5. Common Issues & Solutions

#### "Network Error" or "Cannot connect to server"
- Check if your backend server is running
- Update the API URL in `src/config/api.ts`
- Make sure your phone and computer are on the same network

#### "Metro bundler issues"
- Clear cache: `expo start -c`
- Restart the development server

#### iOS Simulator not opening
- Make sure Xcode is installed
- Run: `sudo xcode-select --install`

### 6. Development Tips

- **Hot Reload**: Changes to your code will automatically reload the app
- **Debug Menu**: Shake your device or press `Cmd+D` (iOS) / `Cmd+M` (Android) to open debug menu
- **Console Logs**: Check the terminal for any error messages

### 7. Next Steps

1. **Connect to Backend**: Update API configuration
2. **Test Features**: Try logging in and navigating through the app
3. **Customize**: Modify colors, add your logo, etc.
4. **Add Features**: Implement additional functionality as needed
5. **Deploy**: Use EAS Build to create production builds

## 📱 App Structure

```
├── src/
│   ├── screens/          # All app screens
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API integration
│   ├── contexts/         # Authentication & state
│   └── config/           # App configuration
```

## 🔧 Key Files to Customize

- `src/config/api.ts` - API endpoints and configuration
- `app.json` - App metadata and build settings
- `src/screens/` - Individual screen components
- `assets/` - App icons and images

## 📞 Support

If you encounter any issues:
1. Check the terminal for error messages
2. Ensure all dependencies are installed correctly
3. Verify your backend server is running and accessible
4. Check network connectivity between your device and development machine

Happy coding! 🎉
