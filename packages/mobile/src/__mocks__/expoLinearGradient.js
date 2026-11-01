// Manual mock for expo-linear-gradient used in Jest tests.
const React = require('react');
const { View } = require('react-native');

const LinearGradient = ({ children, style, testID }) =>
  React.createElement(View, { style, testID }, children);

module.exports = { LinearGradient };
