const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    if (androidManifest.application && androidManifest.application[0]) {
      androidManifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
};
