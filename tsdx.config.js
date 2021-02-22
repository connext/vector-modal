const images = require('@rollup/plugin-image');
const font = require('rollup-plugin-font');

module.exports = {
  rollup(config, options) {
    config.plugins = [
      images({ include: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.gif'] }),
      font({ unicode: { include: ['**/*.ttf', '**/*.otf'] } }),
      ...config.plugins,
    ];
    return config;
  },
};
