const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
    entry: {
        // Uncomment if you plan on using gulp instead of CLI to run the dev server
        // app: ['webpack-dev-server/client?http://localhost:8080', 'webpack/hot/only-dev-server', './js/app.js']
        app: ['webpack-dev-server/client?http://localhost:8080', './js/index.js']
    },

    // contentBase doesn't tell it where to
    // serve the files. It tells WHICH files from your
    // fs are served to the dev-server.
    contentBase: 'dist',
    output: {
        // The name of our outputted file
        filename: 'js/app.min.js',
        // When running the dev server, it stores this path in memory
        path: __dirname + '/dist',
        // publicPath tells it WHERE to serve the files
        publicPath: '/',
    },
    debug: true,
    devtool: 'cheap-module-source-map',
    plugins: [
        new ExtractTextPlugin('style', 'css/[name].min.css'),
        // Uncomment if you plan on using gulp instead of CLI to run the dev server
        // new webpack.HotModuleReplacementPlugin(),
    ],
    module: {
        loaders: [
            {
                test: /\.(js|jsx|es6)$/,
                exclude: /(node_modules|bower_components)/,
                loaders: [
                    'react-hot',
                    'babel?presets[]=es2015&presets[]=react'
                ]
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style', 'css-loader?sourceMap!postcss-loader!sass-loader?sourceMap')
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [ 'url?name=imgs/[name].[ext]', 'img' ]
            }
        ]
    },
    postcss: [
        autoprefixer({
            browsers: ['last 2 versions']
        })
    ]
};
