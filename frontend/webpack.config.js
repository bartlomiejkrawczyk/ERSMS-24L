'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer')

const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    index: './src/ts/index.ts',
    manageThread: './src/ts/manageThread.ts',
    postEditor: './src/ts/postEditor.ts',
    threadEditor: './src/ts/threadEditor.ts',
    silentSsoCheck: './src/ts/silentSsoCheck.ts',
    thread: './src/ts/thread.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer:{
    static: path.resolve(__dirname, 'dist'),
    port: 8085,
    hot: true
  },
  plugins: [
    new FaviconsWebpackPlugin("./src/img/icon.svg"),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: './src/index.html',
      chunks: ["index"],
    }),
    new HtmlWebpackPlugin({
      filename: "manage_thread.html",
      template: './src/manage_thread.html',
      chunks: ["manageThread"],
    }),
    new HtmlWebpackPlugin({
      filename: "post_editor.html",
      template: './src/post_editor.html',
      chunks: ["postEditor"],
    }),
    new HtmlWebpackPlugin({
      filename: "thread_editor.html",
      template: './src/thread_editor.html',
      chunks: ["threadEditor"],
    }),
    new HtmlWebpackPlugin({
      filename: "silent_sso_check.html",
      template: './src/silent_sso_check.html',
      chunks: ["silentSsoCheck"],
    }),
    new HtmlWebpackPlugin({
      filename: "thread.html",
      template: './src/thread.html',
      chunks: ["thread"],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            // Adds CSS to the DOM by injecting a `<style>` tag
            loader: 'style-loader'
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  autoprefixer
                ]
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        type: 'asset/resource',
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
}
