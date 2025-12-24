const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin')
const path = require('path')

/**
 * Webpack配置文件
 * @type {import('webpack').Configuration}
 */

// css重复配置提取
const getStyleLoader = ()=>{
  return [
   isProduction?MiniCssExtractPlugin.loader:'style-loader',
    'css-loader',
    {
      loader:'postcss-loader',
      options:{
        postcssOptions:{
          plugins:[
            'postcss-preset-env',
          ]
        }
      }
    }
  ]
}

// 判断当前环境变量
const isProduction = process.env.NODE_ENV=== 'production'

const config = {
  entry:path.resolve(__dirname,'src/main.js'),
  output:{
    path:path.resolve(__dirname,'dist'),
    filename:'[name][hash:10].js',
     chunkFilename:'static/js/[name][hash:10].chunk.js', 
     clean:true
  },
  resolve:{
    extensions:['.jsx','.js','.json'],
    alias:{
      '@': path.resolve(__dirname,'src')
    }
  },
  module:{
    rules: [
      {
        test:/\.js$/,
        exclude:/node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,      // 是否缓存
            cacheCompression: false,   // 不缓存
          }
        }
      },
      {
        test:/\.jsx$/,
        exclude:/node_modules/,
        use:{
          loader:'babel-loader',
          options:{
            cacheDirectory:true,
            cacheCompression:false,
          }
        }
      },
      {test:/\.css$/,use:[...getStyleLoader()]},
      {test:/\.less$/,use:[...getStyleLoader(),'less-loader']},
      {test:/\.s[ac]ss$/,use:[...getStyleLoader(),'sass-loader']},
      {
        test:/\.(png|jpe?g|gif|webp|svg)$/, 
        type:'asset',
        parser:{
          dataUrlCondition:{
            maxSize: 10*1024
          }
        },
        generator:{
          filename: 'static/images/[name][contenthash:10][ext][query]'
        }
      },
      {
        test:/\.(ttf|woff2?)$/,
        type:'asset/resource',
        generator:{
          filename:'static/fonts/[name][contenthash:10][ext][query]'
        }
      }
    ]
  },
  plugins:[
    new HtmlWebpackPlugin({
      template:path.resolve(__dirname,'public/index.html')
    }),
    isProduction && new MiniCssExtractPlugin(
      {
        filename:'static/css/[name][hash:10].css'
      }
    ),
    isProduction && new PreloadWebpackPlugin({
        rel:'prefetch', // 或者 'prefetch'
        include:'asyncChunk' //默认配置 加载所有异步Chunk
    })
  ],
  mode:process.env.NODE_ENV,
  devServer:{
    static:{
      directory:path.join(__dirname,'public')
    },
    port:5173,
    compress:true,
    open:true,
    hot:true,
    historyApiFallback: true,  //  支持SPA路由
    client: { //错误层
      overlay: {  
        errors: true,
        warnings: false
      }
    }
  },
  optimization: {
    minimizer: [
      '...',
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',  // 自动分割所有类型的chunk
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,  // 至少被2个chunk引用
          name: 'common',
          priority: 5
        }
      }
    },
    runtimeChunk: 'single'  // 提取运行时代码，避免缓存失效
  },
  devtool:  isProduction ? 'source-map' : 'cheap-module-source-map'  
}


//设置生产与开发环境的压缩配置
if(isProduction){
  config.optimization = {
    minimize: true,
    minimizer: [
      '...',  // 使用默认的JS压缩
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 20000,  // 设置最小尺寸
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: 'vendors'
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          name: 'common'
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  }
}else{
    config.optimization = {
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  }
  // 开发环境使用更快的构建
  config.cache = {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
}

module.exports = config