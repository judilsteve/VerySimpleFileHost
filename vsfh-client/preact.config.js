// TODO_JU Configure pre-rendering (https://preactjs.com/cli/pre-rendering), audit output
// TODO_JU Investigate https://github.com/pluscubed/preact-cli-plugin-fast-async
// TODO_JU Do I need the ssr-build folder? I want to get rid of it. Same with push-manifest.json and preact_prerender_data.json

const path = require('path');

export default (config, env, helpers) => {
  let { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
  let babelConfig = rule.options;

  // These should work by default with preact-cli but the browserslist config breaks them somehow
  babelConfig.plugins.push(require.resolve("@babel/plugin-proposal-nullish-coalescing-operator"));
  babelConfig.plugins.push(require.resolve("@babel/plugin-proposal-optional-chaining"));

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