module.exports = {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }] // 明确启用新的JSX转换
  ],
  plugins: ['@babel/plugin-transform-runtime']
};