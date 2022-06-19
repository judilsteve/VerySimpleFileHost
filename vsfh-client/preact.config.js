const path = require('path');
const FontminPlugin = require('fontmin-webpack');
const PushManifestPlugin = require('preact-cli/lib/lib/webpack/push-manifest');
const CopyWebpackPlugin = require('copy-webpack-plugin');

export default (config, env, helpers) => {
  const { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
  const babelConfig = rule.options;

  // These should work by default with preact-cli but the browserslist config breaks them somehow
  babelConfig.plugins.push(require.resolve("@babel/plugin-proposal-nullish-coalescing-operator"));
  babelConfig.plugins.push(require.resolve("@babel/plugin-proposal-optional-chaining"));

  config.plugins = config.plugins.filter(p =>
    // Disable generation of push-manifest.json and preact_prerender_data.json files
    !(p instanceof PushManifestPlugin) && !(p.constructor.name === 'PrerenderDataExtractPlugin'));

  // Copy assets to root of build output instead of the `assets` folder (preact-cli's default)
  // Required to get robots.txt and favicons to work
  const copyPlugin = config.plugins.find(p => p instanceof CopyWebpackPlugin);
  if(copyPlugin) { // We make multiple passes through this file, and the copy plugin isn't always here
    const assetsPattern = copyPlugin.patterns.find(p => p.from === 'assets');
    assetsPattern.to = '.';
  }

  config.plugins.unshift(new FontminPlugin({
    autodetect: false, // Does not work with this build pipeline
    glyphs: [ // https://fontawesome.com/v5/cheatsheet/free/solid
      '\uf07c', // folder-open
      '\uf0c0', // users
      '\uf084', // key
      '\uf2f6', // sign-in-alt
      '\uf101', // angle-double-right
      '\uf07b', // folder
      '\uf019', // download
      '\uf0c1', // linkify
      '\uf15b', // file
      '\uf00d', // remove + close
      '\uf00c', // check
      '\uf007', // user
      '\uf09c', // unlock
      '\uf235', // remove-user
      '\uf023', // lock
      '\uf234', // add-user
      '\uf015', // home
      '\uf2f5', // sign-out-alt
      '\uf0b0', // filter
      '\uf303', // pencil-alt
      '\uf0c5', // copy
      '\uf09b', // github
      '\uf3a5', // gem
    ],
    allowedFilesRegex: new RegExp('icons')
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