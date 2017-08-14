var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/main.jsx',
    target: 'node-webkit',
//    devtool: 'source-map',
//    node: {__dirname: true},
    output: {
        path: 'nwjs-sdk-v0.13.4-win-x64',
        filename: 'index.js'
    },
    module: {
        loaders: [
            { test: /\.(jsx|es6)$/,   loader: 'babel', query: {
                presets:['react'],
                plugins:[
                    'transform-strict-mode',
                    'check-es2015-constants',
                    'transform-es2015-block-scoping',
                    'transform-es2015-block-scoped-functions',
                    'transform-es2015-destructuring',
                    'transform-es2015-modules-commonjs',
                    'transform-es2015-unicode-regex',
                    'transform-async-to-generator',
                    'transform-exponentiation-operator'
                ]
            }},
            { test: /\.(jpg|jpeg|png)$/,  loader: 'url-loader' },
            { test: /\.ppm$/,  loader: 'raw-loader' },
            { test: /\.css$/,  loaders: ['style','css'] },
            { test: /\.(ttf|eot|svg|woff)(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader'},
        ]
    },
    plugins: [
        new webpack.DefinePlugin({'process.env.NODE_ENV': '"production"'}),
        //new webpack.optimize.UglifyJsPlugin({
        //    compress: { warnings: false },
        //    comments: function() { return false; }
        //}),
        new CopyWebpackPlugin([{from:'package.json'}]), 
        new HtmlWebpackPlugin({template: 'template.html', inject:'body'}),
    ],
    externals: {
        '../config.js': 'commonjs ../config.js',
    },
}
