import { html, render } from 'lit/html.js';
import { ifDefined } from 'lit/directives/if-defined.js';
// i18n
import en from './i18n/en.js';
import fr from './i18n/fr.js';
// views
import './components/sw-launcher.js';
import './components/sw-plugin-platform.js';
import './components/sw-plugin-position.js';
import './components/sw-plugin-default.js';

export default {
  _clients: new Set(),
  _language: null, // default to english
  _languageData: { en, fr },

  /**
   * Allow to launch multiple clients at once in the same brwoser window by
   * adding `?emulate=numberOfClient` at the end of the url
   * e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients in parallel
   */
  async execute(bootstrap) {
    const $container = document.body;
    $container.classList.remove('loading');

    const searchParams = new URLSearchParams(window.location.search);
    // enable instanciation of multiple clients in the same page to facilitate
    // development and testing (be careful in production...)
    const numEmulatedClients = parseInt(searchParams.get('emulate')) || 1;

    // special logic for emulated clients (1 click to rule them all)
    if (numEmulatedClients > 1) {
      // @note - we use raw lit-html and style injection to avoid problems
      // with shadow DOM, scoped styles and so on... As this is a development
      // tool only, we don't really care of hardcoding things here

      // create dynamic stylesheet
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerText = `
        .emulated-client-container {
          float: left;
          width: 20%;
          min-width: 300px;
          height: 500px;
          outline: 1px solid #aaaaaa;
          position: relative;
          overflow: auto;
        }

        .emulated-clients-init-all {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 10;
          width: 100%;
          height: 100%;
          background-color: rgba(45, 45, 45, 0.6);
          color: white;
          text-align: center;
          font-size: 2rem;
          cursor: pointer;
        }

        .emulated-clients-init-all p {
          line-height: 100px;
          max-width: 400px;
          margin: 200px auto;
          background-color: rgba(0, 0, 0, 1);
          border: 1px solid #454545;
          border-radius: 2px;
          box-shadow: 0px 0px 2px 0px #787878;
        }
      `;
      document.querySelector('head').appendChild(style);

      // we need to do this first to have access to the clients
      // which are registered in the render method
      render(html`
        <div class="emulated-clients-init-all" style="display: none">
          <p>
            click to start
          </p>
        </div>
        ${Array(numEmulatedClients).fill(null).map(() => {
          return html`
            <div class="emulated-client-container"></div>
          `;
        })}
      `, $container);

      // bootstrap clients
      const $containers = $container.querySelectorAll('.emulated-client-container');
      Array.from($containers).forEach($container => bootstrap($container));

      // check if platform plugins have been registered
      const platforms = [];

      await new Promise((resolve) => {
        this._clients.forEach(client => {
          const unsubscribe = client.pluginManager.onStateChange(plugins => {
            unsubscribe();

            for (let [id, plugin] of Object.entries(plugins)) {
              if (plugin.type === 'PluginPlatform') {
                platforms.push(plugin);
                resolve();
              }
            }
          });
        });
      });

      // if platform plugins found, show the big "rule them all" button
      if (platforms.length > 0) {
        const $startButton = $container.querySelector('.emulated-clients-init-all');
        $startButton.style.display = 'block';

        function initPlatforms(e) {
          platforms.forEach(platform => platform.onUserGesture(e));

          $startButton.removeEventListener('click', initPlatforms);
          $startButton.remove();
          // numEmulatedClients
        }

        $startButton.addEventListener('click', initPlatforms);
      }
    } else {
      bootstrap($container);
    }
  },

  render(client, $container) {
    // Record the client into the launcher, so that we can click / initialize
    // them all at once if needed, i.e. if the platform plugin is registered
    this._clients.add(client);

    let lang;

    // if language has not been set manually, pick language from the brwoser
    // and fallback to english if not supported
    if (this._language === null) {
      lang = navigator.language.split('-')[0];

      if (lang in this._languageData) {
        this._language = lang;
      } else {
        this._language = 'en';
      }
    } else {
      lang = this._language;
    }

    // random id for the component to be able to retrieve the right DOM
    // element in case of emulated clients
    const launcherId = `launcher-${parseInt(Math.random() * 1e6)}`;

    render(html`
      <sw-launcher
        id="${launcherId}"
      ></sw-launcher>
    `, $container);

    const $launcher = document.querySelector(`#${launcherId}`);

    client.pluginManager.onStateChange(async (plugins, updatedPlugin) => {
      const languageData = this._languageData[this._language];

      // then check if we have some platform plugin registered
      let platform = null;

      for (let instance of Object.values(plugins)) {
        if (instance.type === 'PluginPlatform') {
          platform = instance;
        }
      }

      if (platform && platform.status !== 'started') {
        const pluginTexts = languageData['PluginPlatform'];
        const common = languageData.common;
        const localizedTexts = Object.assign({}, pluginTexts, common);

        $launcher.setScreen(html`
          <sw-plugin-platform
            localized-texts="${JSON.stringify(localizedTexts)}"
            .client="${client}"
            .plugin="${platform}"
          ></sw-plugin-platform>
        `);

        return;
      }

      let position = null;

      for (let instance of Object.values(plugins)) {
        if (instance.type === 'PluginPosition') {
          position = instance;
        }
      }

      if (position && position.status !== 'started') {
        const pluginTexts = languageData['PluginPosition'];
        const common = languageData.common;
        const localizedTexts = Object.assign({}, pluginTexts, common);

        $launcher.setScreen(html`
          <sw-plugin-position
            localized-texts="${JSON.stringify(localizedTexts)}"
            .client="${client}"
            .plugin="${position}"
          ></sw-plugin-position>
        `);

        return;
      }

      // then show default plugin screen until all started
      let allStarted = true;

      for (let name in plugins) {
        if (plugins[name].status !== 'started') {
          allStarted = false;
        }
      }

      if (allStarted) {
        // all started, remove &launcher view
        $launcher.parentNode.removeChild($launcher);
        return;
      } else {
        // pick the first non started plugin and push it in default view
        // console.log('show plugins defaults init screens');
        let plugin = null;

        for (let instance of Object.values(plugins)) {
          if (instance.status !== 'started') {
            plugin = instance;
            break;
          }
        }

        const pluginTexts = languageData[plugin.type];
        const common = languageData.common;
        const localizedTexts = Object.assign({}, pluginTexts, common);

        $launcher.setScreen(html`
          <sw-plugin-default
            localized-texts="${JSON.stringify(localizedTexts)}"
            .client="${client}"
            .plugin="${plugin}"
          ></sw-plugin-default>
        `);

        return;
      }
    });
  },

  get language() {
    return this._language;
  },

  set language(lang) {
    if (!(lang in this._languageData)) {
      throw new Error(`[soundworks:helpers] Cannot set language to "${lang}", no data available`);
    }

    this._language = lang;
  },

  setLanguageData(lang, data) {
    this._languageData[lang] = data;
  },

  getLanguageData(lang = null) {
    if (lang !== null) {
      if (!(lang in this._languageData)) {
        throw new Error(`[soundworks:helpers] Undefined language data for "${lang}"`);
      }

      return this._languageData[lang];
    } else {
      return this._languageData;
    }
  },
};