// Manual mock for expo-notifications used in Jest tests.
// The real module pulls in native code that triggers Expo's WinterCG runtime
// scope guard. All functions here are jest.fn() stubs that tests can configure.

const setNotificationHandler = jest.fn();
const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
const getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
const scheduleNotificationAsync = jest.fn().mockResolvedValue('mock-notif-id');
const cancelScheduledNotificationAsync = jest.fn().mockResolvedValue();

module.exports = {
  setNotificationHandler,
  requestPermissionsAsync,
  getPermissionsAsync,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
};
