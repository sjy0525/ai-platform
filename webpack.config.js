const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const PreloadWebpackPlugin = require("@vue/preload-webpack-plugin")
const path = require("path")
const webpack = require("webpack")

/**
 * Webpack配置文件
 * @type {import('webpack').Configuration}
 */

// 判断当前环境变量
const isProduction = process.env.NODE_ENV === "production"

// css重复配置提取
const getStyleLoader = () => {
  return [
    isProduction ? MiniCssExtractPlugin.loader : "style-loader",
    "css-loader",
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugins: ["postcss-preset-env"],
        },
      },
    },
  ]
}

const config = {
  entry: path.resolve(__dirname, "src/main.tsx"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isProduction
      ? "static/js/[name][contenthash:10].js"
      : "[name][hash:10].js",
    chunkFilename: isProduction
      ? "static/js/[name][contenthash:10].chunk.js"
      : "[name][hash:10].chunk.js",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      // 合并 TypeScript 规则
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              presets: [
                "@babel/preset-env",
                "@babel/preset-typescript",
                "@babel/preset-react",
              ],
            },
          },
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true, // 提高开发编译速度
              happyPackMode: true,
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            cacheCompression: false,
          },
        },
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            cacheCompression: false,
          },
        },
      },
      { test: /\.css$/, use: [...getStyleLoader()] },
      { test: /\.less$/, use: [...getStyleLoader(), "less-loader"] },
      { test: /\.s[ac]ss$/, use: [...getStyleLoader(), "sass-loader"] },
      {
        test: /\.(png|jpe?g|gif|webp|svg)$/,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024,
          },
        },
        generator: {
          filename: "static/images/[name][contenthash:10][ext][query]",
        },
      },
      {
        test: /\.(ttf|woff2?)$/,
        type: "asset/resource",
        generator: {
          filename: "static/fonts/[name][contenthash:10][ext][query]",
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
      minify: isProduction
        ? {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
          }
        : false,
    }),
    // 使用 filter 过滤掉 false
    isProduction &&
      new MiniCssExtractPlugin({
        filename: "static/css/[name][contenthash:10].css",
        chunkFilename: "static/css/[name][contenthash:10].chunk.css",
      }),
    isProduction &&
      new PreloadWebpackPlugin({
        rel: "preload",
        as: "script",
      }),
    // 添加环境变量插件
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
    }),
  ].filter(Boolean), // 过滤掉 false
  mode: process.env.NODE_ENV || "development",
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    port: 5173,
    compress: true,
    open: true,
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  devtool: isProduction ? "source-map" : "cheap-module-source-map",
}

// 设置生产与开发环境的优化配置
if (isProduction) {
  config.optimization = {
    minimize: true,
    minimizer: [
      "...", // 使用默认的 JS 压缩（TerserPlugin）
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ["default", { discardComments: { removeAll: true } }],
        },
      }),
    ],
    splitChunks: {
      chunks: "all",
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: "vendors",
        },
        common: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          name: "common",
        },
      },
    },
    runtimeChunk: {
      name: "runtime",
    },
  }
} else {
  config.optimization = {
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  }
  // 开发环境使用缓存提高速度
  config.cache = {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  }
}

module.exports = config
