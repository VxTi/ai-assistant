const path = require('path');

module.exports = {
    entry:
        [
            './src/Config.ts',
            './src/TextCompletion.ts',
            './src/SpeechGeneration.ts',
            './src/Transcriptions.ts',
            './src/App.ts'
        ]
    ,
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'build'),
    },
    target: 'web',
    node: {
        __dirname: false,
        __filename: false
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
        minimize: true,
        mergeDuplicateChunks: true,
    },
    devServer: {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
    },
    mode: 'production'
}