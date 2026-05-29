const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force transpilation of packages that use private class fields (#property)
// which older Hermes (Expo Go) does not support natively.
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|@react-native-community|expo|@expo|expo-constants|expo-localization|expo-linear-gradient|expo-status-bar|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg|@react-navigation|@stripe/stripe-react-native|@react-native-async-storage|lucide-react-native)/)',
];

module.exports = config;
