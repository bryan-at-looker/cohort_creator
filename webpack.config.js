module.exports = {
  node: {
    fs: 'empty'
  },
  devServer: {
    host: "localhost",
    port: 8080,
    https: true,
    disableHostCheck: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  },
  entry: ['babel-polyfill', './src/index.js'],
  output: {
    filename: 'main.js',
    // `chunkFilename` provides a template for naming code-split bundles (optional)
    chunkFilename: '[name].main.js',
    // `publicPath` is where Webpack will load your bundles from (optional)
    // publicPath: 'https://bryan-at-looker.s3.amazonaws.com/cohort-creator/'
    publicPath: 'https://localhost:8080/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" }
        ]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
};
