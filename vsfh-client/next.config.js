// Thanks anna: https://annacoding.com/article/6FndBILqMD16Bp7w95WJrd/Customize-the-Semantic-UI-React-theme-in-Next.js-Part-1

const path = require('path');
const withPlugins = require('next-compose-plugins');
const withLess = require("next-with-less");

const nextConfig = {
    webpack(config) {
        config.module.rules.push({
            test: /\.(png|svg|eot|otf|ttf|woff|woff2)$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 8192,
                    publicPath: '/_next/static/',
                    outputPath: 'static/',
                    name: '[name].[ext]?[hash]',
                },
            },
        });
        config.resolve.alias['../../theme.config$'] = path.join(config.context, 'src/semantic-ui/theme.config');
        return config;
    },
};

const plugins = [[withLess, {
    // See https://github.com/layershifter/semantic-ui-tools/blob/60b209943abde43ee207a4b8acdbe050e8f2f219/packages/craco-less/src/index.js#L11
    lessLoaderOptions: { lessOptions: { math: "always" } }
}]];
module.exports = withPlugins(plugins, nextConfig);