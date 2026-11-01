// Stub for expo/src/winter/runtime.native in Jest.
// The real file installs a __ExpoImportMetaRegistry lazy property via
// react-native's defineLazyObjectProperty. That lazy getter fires during
// setupFiles (before isInsideTestCode = true) and causes jest-runtime to
// throw "You are trying to import a file outside of the scope of the test code."
// Stubbing the whole module avoids the issue entirely.
