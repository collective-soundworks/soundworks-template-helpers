/**
 * Declaration for browser clients
 */
declare namespace launcher {
    /**
     * Allow to launch multiple clients at once in the same brwoser window by
     * adding `?emulate=numberOfClient` at the end of the url
     * e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients in parallel
     *
     * @param {Function} bootstrap - Bootstrap function to execute.
     * @param {object} options - Configuration object.
     * @param {object} [options.numClients=1] - Number of parallel clients.
     * @param {object} [options.width='20%'] - If numClient > 1, width of the container.
     * @param {object} [options.height='599px'] - If numClient > 1, height of the container.
     */
    function execute(bootstrap: Function, { numClients, width, height, }?: {
      numClients?: number
      width?: string
      height?: string
    }): Promise<void>;
    /**
     * Register the client in the launcher.
     *
     * The launcher will do a bunch of stuff for you:
     * - Display default initialization screens. If you want to change the provided
     * initialization screens, you can import all the helpers directly in your
     * application by doing `npx soundworks --eject-helpers`. You can also
     * customise some global syles variables (background-color, text color etc.)
     * in `src/clients/components/css/app.scss`.
     * You can also change the default language of the intialization screen by
     * setting, the `launcher.language` property, e.g.:
     * `launcher.language = 'fr'`
     * - By default the launcher automatically reloads the client when the socket
     * closes or when the page is hidden. Such behavior can be quite important in
     * performance situation where you don't want some phone getting stuck making
     * noise without having any way left to stop it... Also be aware that a page
     * in a background tab will have all its timers (setTimeout, etc.) put in very
     * low priority, messing any scheduled events.
     *
     * @param {Function} client - The soundworks client.
     * @param {object} options - Configuration object.
     * @param {object} [options.initScreensContainer=1] - The HTML container for
     *  the initialization screens.
     * @param {object} [options.reloadOnVisibilityChange=true] - Define if the client
     *  should reload on visibility change.
     * @param {object} [options.reloadOnSocketError=true] - Define if the client
     *  should reload on socket error and disconnection.
     */
    function register(client: soundworks.Client, { initScreensContainer, reloadOnVisibilityChange, reloadOnSocketError, }?: {
        initScreensContainer?: HTMLElement;
        reloadOnVisibilityChange?: boolean;
        reloadOnSocketError?: boolean;
    }): void;
    /**
     * Language to be used in the initialization screens. By default, pick language
     * from the browser and fallback to english if not supported.
     *
     * For now, available languages are 'fr' and 'en'.
     *
     * @type {string}
     */
    language: string;
    /**
     * Set the text to be used for a given language. Allows to override an existing
     * language as well as define a new one.
     *
     * @param {string} lang - Key correspondig to the language (e.g. 'fr', 'en', 'es')
     * @param {object} data - Key/value pairs defining the text strings to be used.
     */
    function setLanguageData(lang: any, data: any): void;
    /**
     * Retrieve the data for a given language.
     *
     * @param {string} lang - Key correspondig to the language (e.g. 'fr', 'en', 'es')
     */
    function getLanguageData(lang?: any): any;
}
export default launcher;

/**
 * Declaration for node clients
 */
declare namespace launcher {
    /**
     * The "execute" function allows to fork multiple clients in the same terminal window
     * by defining the `EMULATE` env process variable
     * e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
     *
     * @param {Function} bootstrap - Bootstrap function to execute.
     * @param {object} options - Configuration object.
     * @param {object} options.moduleURL - Module url of the calling filr.
     * @param {object} [options.numClients=1] - Number of parallel clients.
     */
    function execute(bootstrap: Function, { numClients, moduleURL, }?: {
        numClients?: number;
        moduleURL?: string;
    }): Promise<void>;
    /**
     * Register the soundworks client into the launcher
     *
     * Automatically restarts the process when the socket closes or when an
     * uncaught error occurs in the program.
     *
     * @param {Function} client - The soundworks client.
     * @param {object} options - Configuration object.
     * @param {object} [options.restartOnError=true] - Define if the client should
     *  restart when on uncaught and socket errors.
     */
    function register(client: soundworks.Client, { restartOnError, }?: {
        restartOnError?: boolean;
    }): Promise<void>;
}
export default launcher;


