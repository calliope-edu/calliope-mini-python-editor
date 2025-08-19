/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
const path = require("path");
const fs = require("fs");
const webpack = require('webpack');

// Support optionally pulling in external branding if the module is installed.
const theme = "@calliope-edu/calliope-theme";
const external = `node_modules/${theme}`;
const internal = "src/deployment/default";

// Verzeichnis mit Python-Modulen
const moduleDir = path.resolve(__dirname, 'src/assets/source/modules');
let moduleFiles = fs.existsSync(moduleDir)
  ? fs.readdirSync(moduleDir).filter(f => f.endsWith('.py'))
  : [];

moduleFiles = moduleFiles.map((f)=>{
  return {
    name: f.replace('.py', ''),
    content: fs.readFileSync(path.resolve(moduleDir, f), 'utf8'),
  };
});

module.exports = {
  webpack: {
    alias: {
      "theme-package": fs.existsSync(external)
        ? theme
        : path.resolve(__dirname, internal),
    },
    configure: (webpackConfig) => {
      // Regel für .py-Dateien als Asset Source
      webpackConfig.module.rules.push({
        test: /\.py$/,
        type: 'assets/source',
      });
      // DefinePlugin für globale Dateiliste
      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.DefinePlugin({
          MODULE_FILE_LIST: JSON.stringify(moduleFiles),
        }),
      ];
      // Eventuelle bestehende Konfigurationen beibehalten
      webpackConfig.ignoreWarnings = [
        // Temporary version of https://github.com/facebook/create-react-app/pull/11752
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes("node_modules") &&
            warning.details &&
            warning.details.includes("source-map-loader")
          );
        },
      ];
      return webpackConfig;
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        "^theme-package(.*)$": `<rootDir>/${
          fs.existsSync(external) ? external : internal
        }$1`,
        "\\.worker": "<rootDir>/src/mocks/worker.js",
      },
    },
  },
};
