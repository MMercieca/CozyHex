import React from 'react';
import {StatusBar, StyleSheet, Text} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import {Canvas, Circle} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const CANVAS_W = 300;
const CANVAS_H = 300;

export default function App() {
  const offsetX = useSharedValue(0);

  const longPress = Gesture.LongPress()
    .onBegin(() => {
      offsetX.value = withSpring(80);
    })
    .onFinalize(() => {
      offsetX.value = withSpring(0);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateX: offsetX.value}],
  }));

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>CozyHex</Text>
          <Text style={styles.subtitle}>tap and hold to animate</Text>
          <GestureDetector gesture={longPress}>
            <Animated.View style={animStyle}>
              <Canvas style={styles.canvas}>
                <Circle
                  cx={CANVAS_W / 2}
                  cy={CANVAS_H / 2}
                  r={60}
                  color="#c8a0e8"
                />
              </Canvas>
            </Animated.View>
          </GestureDetector>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
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
    marginBottom: 8,
  },
  subtitle: {
    color: '#555570',
    fontSize: 14,
    marginBottom: 32,
  },
  canvas: {width: CANVAS_W, height: CANVAS_H},
});
