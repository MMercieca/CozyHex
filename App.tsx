import React from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>CozyHex</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#c8a0e8',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#555570',
    fontSize: 16,
    marginTop: 8,
  },
});

export default App;
