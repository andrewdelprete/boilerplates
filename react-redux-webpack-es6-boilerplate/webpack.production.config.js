const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
    entry: {
        app: () => {
            // if NODE_ENV is production than use a different entry file.
            if (process.env.NODE_ENV == 'production') {
                return './js/index.production.js'
            }

            return './js/index.js'
        }()
    },
    output: {
        path: __dirname + '/dist',
        filename: 'js/app.min.js',
        publicPath: '/'
    },
    devtool: 'source-map',
    plugins: [
        new ExtractTextPlugin('style', 'css/[name].min.css'),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ],
    module: {
        loaders: [
            {
                test: /\.(js|jsx|es6)$/,
                exclude: /(node_modules|bower_components)/,
                loaders: [
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
