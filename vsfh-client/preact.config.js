// TODO_JU Configure pre-rendering (https://preactjs.com/cli/pre-rendering), audit output
// TODO_JU Investigate https://github.com/pluscubed/preact-cli-plugin-fast-async
// TODO_JU Investigate https://www.npmjs.com/package/fontmin-webpack
// TODO_JU Do I need the ssr-build folder? I want to get rid of it. Same with push-manifest.json and preact_prerender_data.json

const path = require('path');
const FontminPlugin = require('fontmin-webpack')

export default (config, env, helpers) => {
  const { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
  const babelConfig = rule.options;

  // These should work by default with preact-cli but the browserslist config breaks them somehow
  babelConfig.plugins.push(require.resolve("@babel/plugin-proposal-nullish-coalescing-operator"));
  babelConfig.plugins.push(require.resolve("@babel/plugin-proposal-optional-chaining"));

  // Insert before MiniCssExtractPlugin as it causes issues,
  // see https://github.com/patrickhulce/fontmin-webpack/issues/53
  // TODO_JU This breaks the build
  config.plugins.splice(helpers.getPluginsByName(config, 'MiniCssExtractPlugin')[0].index, 0, new FontminPlugin({
    autodetect: true,
    allowedFilesRegex: new RegExp('brand-icons*') // TODO_JU This name is probably already mangled at this point
  }));

  config.resolve.alias['../../theme.config$'] = path.join(config.context, 'semantic-ui/theme.config');

  // devServer doesn't exist on production builds
  if (!env.isProd) {
    config.devServer.proxy = [
      {
        path: '/api/**',
        target: 'http://localhost:5299'
      }
    ];
  }
};