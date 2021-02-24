const images = require('@rollup/plugin-image');
const url = require('@rollup/plugin-url');

module.exports = {
  rollup(config, options) {
    config.plugins = [
      images({ include: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.gif'] }),
      url({
        // by default, rollup-plugin-url will not handle font files
        include: ['**/*.ttf', '**/*.otf'],
        // setting infinite limit will ensure that the files
        // are always bundled with the code, not copied to /dist
        limit: Infinity,
      }),
      ...config.plugins,
    ];
    return config;
  },
};
