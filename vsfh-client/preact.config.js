// TODO_JU Fix build
// TODO_JU Configure pre-rendering (https://preactjs.com/cli/pre-rendering), audit output
// TODO_JU Investigate https://github.com/pluscubed/preact-cli-plugin-fast-async
// TODO_JU Investigate https://github.com/matthewlynch/preact-cli-plugin-critical-css

const path = require('path');

const babelPluginNullishCoalescingOperator = require("@babel/plugin-proposal-nullish-coalescing-operator");
const babelPluginOptionalChaining = require("@babel/plugin-proposal-optional-chaining");

export default (config, env, helpers) => {
  let { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
  let babelConfig = rule.options;

  // These should work by default with preact-cli but the browserslist config breaks them somehow
  babelConfig.plugins.push(babelPluginNullishCoalescingOperator);
  babelConfig.plugins.push(babelPluginOptionalChaining);

  config.resolve.alias['../../theme.config$'] = path.join(config.context, 'semantic-ui/theme.config');
};