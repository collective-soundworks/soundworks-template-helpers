// @todo - see if we really need these...
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import '@webcomponents/webcomponentsjs/webcomponents-bundle.js';
import 'lit/polyfill-support.js';

import { html, render } from 'lit/html.js';
import { Client } from '@soundworks/core/client.js';
// @todo - rename to @soundworks/helpers
// import { launcher, reload } from '@soundworks/helpers/index.js';
import launcher from '@soundworks/template-helpers/launcher.js';
import pluginPlatform from '@soundworks/plugin-platform/client';
import pluginPosition from '@soundworks/plugin-position/client';

// Grab the configuration object written by the server in the `index.html`
const config = window.soundworksConfig;
// If multiple clients are emulated you want to share the same context
const audioContext = new AudioContext();

const searchParams = new URLSearchParams(window.location.search);

const lang = searchParams.get('lang') || 'en'
const testCase = searchParams.get('case') || 'platform-1';

console.log('> configure the view you want to test with:');
console.log('> http://127.0.0.1:8000?lang=fr&case=platform-1')

async function bootstrap($container) {
  try {
    const client = new Client(config);

    launcher.language = lang;

    // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------
    if (testCase.startsWith('platform')) {
      client.pluginManager.register('platform', pluginPlatform, { audioContext });
    }

    if (testCase === 'position-default') {
      client.pluginManager.register('position-default', pluginPosition);
    } else if (testCase === 'position-xrange') {
      client.pluginManager.register('position-xrange', pluginPosition);
    } else if (testCase === 'position-yrange') {
      client.pluginManager.register('position-yrange', pluginPosition);
    } else if (testCase === 'position-background') {
      client.pluginManager.register('position-background', pluginPosition);
    }

    if (testCase === 'default-inited') {
      client.pluginManager.register('default-inited', (Plugin) => {
        return class PluginDefault extends Plugin {};
      });
    } else if (testCase === 'default-errored') {
      client.pluginManager.register('default-errored', (Plugin) => {
        return class PluginDefault extends Plugin {};
      });
    } else if (testCase === 'default-sync') {
      client.pluginManager.register('default-sync', (Plugin) => {
        return class PluginSync extends Plugin {};
      });
    } else if (testCase === 'default-audio-buffer-loader') {
      client.pluginManager.register('default-audio-buffer-loader', (Plugin) => {
        return class PluginAudioBufferLoader extends Plugin {};
      });
    } else if (testCase === 'default-checkin-errored') {
      client.pluginManager.register('default-checkin-errored', (Plugin) => {
        return class PluginCheckin extends Plugin {};
      });
    }


    // small test to just make sure the screen stays on the error page
    if (testCase === 'failing-plugin') {
      client.pluginManager.register('failing-plugin', (Plugin) => {
        return class FailingPlugin extends Plugin {
          async start() {
            await super.start();
            throw new Error('failing-plugin has failed');
          }
        };
      });
    }

    client.pluginManager.onStateChange(plugins => {
      switch (testCase) {
        case 'platform-inited': { // landing page do nothing
          break;
        }
        case 'platform-errored-1': { // first plugin error screen, before click
          if (plugins['platform'].state.check !== null) {
            plugins['platform'].state.check.result = false;
            plugins['platform'].status = 'errored';
          }
          break;
        }
        case 'platform-errored-2': { // second plugin error screen, after click
          if (plugins['platform'].state.activate !== null) {
            plugins['platform'].state.activate.result = false;
            plugins['platform'].status = 'errored';
          }
          break;
        }

        // default view
        case 'default-inited': {
          // prevent the plugin to go to started
          plugins['default-inited'].status = 'inited';
          break;
        }
        case 'default-errored': {
          // force plugin to errored status
          plugins['default-errored'].status = 'errored';
          break;
        }
        case 'default-sync': {
          plugins['default-sync'].status = 'inited';
          break;
        }
        case 'default-audio-buffer-loader': {
          plugins['default-audio-buffer-loader'].status = 'inited';
          break;
        }
        case 'default-checkin-errored': {
          plugins['default-checkin-errored'].status = 'errored';
          break;
        }

        case 'failing-plugin': {
          console.log(plugins['failing-plugin']);
        }
      }
    });

    launcher.render(client, $container);

    await client.init();
    // @note we do not start as the errors are faked and that `client.init()` would
    // resolve normally, 'failing-plugin' shows that it will behave correctly in
    // a real failure situation as nothing will be rendered after `launcher.render`
    // await client.start();

    // small test to just make sure the screen stays on the error page
    if (testCase === 'failing-plugin') {
      console.log('should never pass here');
      await client.start();
      render(html`<h1>Damn...</h1>`)
    }
  } catch(err) {
    console.error(err);
  }
}

launcher.execute(bootstrap);
