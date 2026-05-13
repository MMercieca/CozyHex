module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  moduleNameMapper: {
    'react-native-reanimated': '<rootDir>/__mocks__/react-native-reanimated.js',
    '@shopify/react-native-skia':
      '<rootDir>/__mocks__/@shopify/react-native-skia.js',
  },
};
