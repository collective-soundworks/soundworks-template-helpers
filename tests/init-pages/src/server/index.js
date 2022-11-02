import 'source-map-support/register';

import { Server } from '@soundworks/core/server';
import pluginPlatform from '@soundworks/plugin-platform/server';
import pluginPosition from '@soundworks/plugin-position/server';
// use `ENV=myconfigfile npm run dev` to run with a specific env config file
import config from '../utils/load-config.js';

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${process.env.ENV || 'default'}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

// API documentation: https://collective-soundworks.github.io/soundworks/
const server = new Server(config);
// configure server for usage within soundworks template
server.setDefaultTemplateConfig();

// -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------
server.pluginManager.register('platform', pluginPlatform);

server.pluginManager.register('position-default', pluginPosition);

server.pluginManager.register('position-xrange', pluginPosition, {
  xRange: [0.25, 0.75],
  yRange: [0, 1],
});

server.pluginManager.register('position-yrange', pluginPosition, {
  xRange: [0, 1],
  yRange: [0.25, 0.75],
});

server.pluginManager.register('position-background', pluginPosition, {
  backgroundImage: 'images/seating-map.png',
});

server.pluginManager.register('default-inited', (Plugin) => {
  return class DefaultPlugin extends Plugin {};
});

server.pluginManager.register('default-errored', (Plugin) => {
  return class DefaultPlugin extends Plugin {};
});

server.pluginManager.register('default-sync', (Plugin) => {
  return class PluginSync extends Plugin {};
});
server.pluginManager.register('default-audio-buffer-loader', (Plugin) => {
  return class PluginAudioBufferLoader extends Plugin {};
});
server.pluginManager.register('default-checkin-errored', (Plugin) => {
  return class PluginCheckin extends Plugin {};
});

// small test to just make sure the screen stays on the error page
server.pluginManager.register('failing-plugin', (Plugin) => {
  return class FailingPlugin extends Plugin {};
});

// -------------------------------------------------------------------
// register schemas
// -------------------------------------------------------------------
server.stateManager.registerSchema('router', {
  context: {
    type: 'string',
    default: 'alpha',
  },
});

(async function launch() {
  try {
    await server.init();

    await server.start();

    // pupetter
  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
