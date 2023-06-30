const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
  entry: "./src/index.tsx",
  mode: "development",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html"
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/

      },
    ]
  },
  devServer: {
    client:{
      overlay: false,
      progress: true,
    },
    historyApiFallback: true,
    hot: true,
    // inline: true,
    // progress: true,
    host: "0.0.0.0",
    port: 3131,
  }
};
