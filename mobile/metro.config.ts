const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig(__dirname);

  return {
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
      alias: {
        crypto: 'react-native-crypto',
        stream: 'readable-stream',
        buffer: '@craftzdog/react-native-buffer',
        'crypto-browserify': 'react-native-crypto',
        'stream-browserify': 'readable-stream',
      },
    },
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
  };
})();
