const React = require('react');
const {Animated, View} = require('react-native');

const useSharedValue = initial => ({value: initial});
const useAnimatedStyle = fn => {
  fn();
  return {};
};
const withSpring = v => v;
const withTiming = v => v;
const useDerivedValue = fn => ({value: fn()});

const AnimatedComponent = View;

module.exports = {
  default: Animated,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useDerivedValue,
  createAnimatedComponent: c => c,
};

module.exports.default = {
  ...Animated,
  View: AnimatedComponent,
  Text: View,
  ScrollView: View,
  Image: View,
  FlatList: View,
};
