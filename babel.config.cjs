module.exports = (api) => {
  if (api && api.cache) {
    api.cache(true);
  }

  return {
    presets: [
      [
        '@babel/preset-env',
        { modules: false },
      ],
      [
        '@babel/preset-react',
        { runtime: 'automatic' },
      ],
    ],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-transform-modules-commonjs',
    ],
  };
};
