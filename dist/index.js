const topLogPrefix = 'vue-ssr-tools: ';
// tslint:disable
const defaultLogger = {
    silly: (msg) => console.log('silly: ' + msg),
    debug: (msg) => console.log('debug: ' + msg),
    verbose: (msg) => console.log('verbose: ' + msg),
    info: (msg) => console.log('info: ' + msg),
    warn: (msg) => console.log('warn: ' + msg),
    error: (msg) => console.log('error: ' + msg),
};
// tslint:enable
// !!! Vue.use(Router) must already be ran before this function is called !!!
async function createApp(options) {
    const logPrefix = topLogPrefix + 'createApp() - ';
    const { initialData, MainComponent, Router, routes, url, Vue, } = options;
    const main = await MainComponent(initialData);
    const router = new Router({
        mode: 'history',
        routes,
    });
    const log = options.log ? options.log : defaultLogger;
    log.debug(logPrefix + 'Pushing router url explicitly to: "' + url + '"');
    router.push(url);
    await new Promise((resolve, reject) => {
        router.onReady(() => {
            const matchedComponents = router.getMatchedComponents();
            // No matched routes, reject with 404
            if (!matchedComponents.length) {
                const err = new Error('Not Found');
                err.name = '404';
                reject(err);
                return;
            }
            resolve();
        }, reject);
    });
    const app = new Vue({
        // The root instance simply renders the App component.
        router,
        render: h => h(main),
    });
    return { app, router };
}
class VueRender {
    constructor(options) {
        this.classLogPrefix = topLogPrefix + 'VueRender: ';
        this.log = options.log ? options.log : defaultLogger;
        this.MainComponent = options.MainComponent;
        this.renderContext = options.renderContext ? options.renderContext : {};
        this.Router = options.Router;
        this.routes = options.routes;
        this.template = options.template;
        this.Vue = options.Vue;
        this.vueServerRenderer = options.vueServerRenderer;
        this.vueRenderer = this.vueServerRenderer.createRenderer({ template: this.template });
    }
    async middleware(req, res) {
        const { classLogPrefix, renderContext, log, MainComponent, Router, routes, Vue, vueRenderer, } = this;
        const logPrefix = classLogPrefix + 'middleware() - ';
        if (!renderContext.url) {
            renderContext.url = req.url;
        }
        if (!renderContext.title) {
            renderContext.title = 'Title';
        }
        if (!renderContext.head) {
            renderContext.head = '';
        }
        let createdApp;
        log.debug(logPrefix + 'Trying to create the main app');
        try {
            const { app } = await createApp({
                initialData: res.__INITIAL_STATE__,
                log,
                MainComponent,
                Router,
                routes: await routes(res.__INITIAL_STATE__),
                url: String(req.url),
                Vue,
            });
            createdApp = app;
        }
        catch (err) {
            if (err.name === '404') {
                log.debug(logPrefix + 'No vue route was matched');
                res.statusCode = 404;
                res.end('Not Found');
                return;
            }
            else {
                log.error(logPrefix + 'Error creating main app: "' + err.message + '" on url: "' + req.url + '"');
                throw err;
            }
        }
        log.debug(logPrefix + 'Main app created, rendering to string');
        vueRenderer.renderToString(createdApp, renderContext, (err, html) => {
            if (err) {
                log.warn(logPrefix + 'Could not render to string, err: "' + err.message.replace(/(\r\n|\n|\r)/gm, ' ') + '"');
                res.statusCode = 500;
                res.end('Internal server error');
                if (process.env.NODE_ENV === 'development') {
                    throw err;
                }
                return;
            }
            log.debug(logPrefix + 'Rendered main vue app to string, setting __INITIAL_STATE__');
            html = html.replace('<!--__INITIAL_STATE__-->', '<script>window.__INITIAL_STATE__ = ' + JSON.stringify(res.__INITIAL_STATE__) + ';</script>');
            res.end(html);
        });
    }
}
export { createApp, VueRender };
