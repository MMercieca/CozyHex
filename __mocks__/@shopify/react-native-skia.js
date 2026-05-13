const React = require('react');
const {View} = require('react-native');

module.exports = {
  Canvas: ({children, style}) => React.createElement(View, {style}, children),
  Circle: () => null,
  useDerivedValue: fn => ({current: fn()}),
};
