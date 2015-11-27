const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

var devFlagPlugin = new webpack.DefinePlugin({
    __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'false'))
});

module.exports = {
    entry: {
        app: ['webpack-dev-server/client?http://localhost:8080', './js/index.js']
    },
    contentBase: 'dist',
    output: {
        filename: 'js/app.min.js',
        path: __dirname + '/dist',
        publicPath: '/',
    },
    devtool: 'cheap-module-source-map',
    plugins: [
        new ExtractTextPlugin('style', 'css/[name].min.css'),
        devFlagPlugin
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
