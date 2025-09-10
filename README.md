# Spark Dental - Mobile App

A React Native mobile application for dental practice management, built with Expo and TypeScript.

## Features

- **Cross-platform**: Runs on both iOS and Android
- **Authentication**: Secure login with JWT tokens
- **Patient Management**: Add, view, edit, and manage patients
- **Treatment Tracking**: Record and monitor dental treatments
- **Financial Management**: Track receivables and payments
- **Dashboard**: Overview of practice statistics
- **Offline Support**: Basic offline functionality with data caching

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd spark
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API endpoints:
   - Update `src/config/api.ts` with your backend server URLs
   - Make sure your backend server is running and accessible

## Configuration

### API Configuration

Update the API configuration in `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:5006'  // Your development server
    : 'https://your-production-domain.com', // Your production server
  // ... other config
};
```

### Backend Integration

This mobile app is designed to work with the existing dental practice backend. Make sure:

1. Your backend server is running
2. CORS is configured to allow requests from the mobile app
3. The API endpoints match the expected structure

## Running the App

### Development Mode

1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Run on iOS simulator:
   ```bash
   npm run ios
   ```

3. Run on Android emulator:
   ```bash
   npm run android
   ```

4. Run on web browser:
   ```bash
   npm run web
   ```

### Using Expo Go App

1. Install Expo Go on your mobile device from the App Store or Google Play
2. Scan the QR code displayed in the terminal or browser
3. The app will load on your device

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/           # API services and external integrations
├── contexts/           # React contexts (Auth, etc.)
├── config/             # Configuration files
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Components

### Authentication
- JWT-based authentication
- Secure token storage using AsyncStorage
- Automatic token refresh and logout on expiration

### Navigation
- Tab-based navigation for main features
- Stack navigation for detailed views
- Drawer navigation for additional options

### API Integration
- Centralized API service with axios
- Request/response interceptors
- Error handling and retry logic

## Building for Production

### Android

1. Build the Android APK:
   ```bash
   expo build:android
   ```

2. Or build locally with EAS:
   ```bash
   eas build --platform android
   ```

### iOS

1. Build the iOS app:
   ```bash
   expo build:ios
   ```

2. Or build locally with EAS:
   ```bash
   eas build --platform ios
   ```

## Deployment

### Using EAS (Expo Application Services)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Configure the project:
   ```bash
   eas build:configure
   ```

4. Build for both platforms:
   ```bash
   eas build --platform all
   ```

## Environment Variables

Create a `.env` file in the root directory:

```
API_BASE_URL=http://localhost:5006
API_TIMEOUT=10000
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **iOS simulator not opening**: Make sure Xcode is installed and simulator is available
3. **Android emulator issues**: Ensure Android Studio and SDK are properly configured
4. **API connection issues**: Check network connectivity and backend server status

### Debug Mode

Enable debug mode by setting `__DEV__` to true in your configuration. This will:
- Show detailed error messages
- Enable network request logging
- Use development API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
