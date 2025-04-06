module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // You can add other Babel plugins here if needed
      ],
    };
  };
  