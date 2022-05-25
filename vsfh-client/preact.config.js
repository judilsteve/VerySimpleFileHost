// TODO_JU Audit pre-rendering output
// TODO_JU Do I need the ssr-build folder? I want to get rid of it. Same with push-manifest.json and preact_prerender_data.json
// TODO_JU Hot-reload is broken
// TODO_JU robots.txt is no longer going to the correct place
// Given all the above, I wonder if it's even worth continuing to use preact-cli or if I should build my own webpack config

const path = require('path');
const FontminPlugin = require('fontmin-webpack');

export default (config, env, helpers) => {
  const { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
  const babelConfig = rule.options;

  // These should work by default with preact-cli but the browserslist config breaks them somehow
  babelConfig.plugins.push(require.resolve("@babel/plugin-proposal-nullish-coalescing-operator"));
  babelConfig.plugins.push(require.resolve("@babel/plugin-proposal-optional-chaining"));

  //throw new Error(util.inspect(config.plugins.slice(0, 5)));

  // TODO_JU Patch this plugin somehow: https://github.com/patrickhulce/fontmin-webpack/pull/62/commits/005314cbd5da8b3e2a4442cd54a6206ee2b1301e
  // TODO_JU Audit icons to make sure they still show
  config.plugins.push(new FontminPlugin({
    autodetect: false, // Does not work with this build pipeline
    glyphs: [ // https://fontawesome.com/v5/cheatsheet/free/brands
      '\uf09b', // github
    ],
    allowedFilesRegex: new RegExp('brand-icons')
  }));

  config.plugins.push(new FontminPlugin({
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