const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production', // or 'development' for sourcemaps
  entry: {
    background: path.resolve(__dirname, 'src', 'background.ts'),
    popup: path.resolve(__dirname, 'src', 'popup', 'popup.ts'),
    options: path.resolve(__dirname, 'src', 'options', 'options.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'src/popup/popup.html', to: 'popup' },
        { from: 'src/popup/popup.css', to: 'popup' },
        { from: 'src/options/options.html', to: 'options' },
        { from: 'src/options/options.css', to: 'options' },
        { from: 'themes', to: 'themes' },
        { from: 'data', to: 'data' },
      ],
    }),
  ],
};
