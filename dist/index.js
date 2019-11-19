import { Log } from 'larvitutils';
const topLogPrefix = 'vue-ssr-tools: ';
// !!! Vue.use(Router) must already be ran before this function is called !!!
async function createApp(options) {
    const { data, MainComponent, Router, routes, url, Vue, } = options;
    const main = await MainComponent({ data });
    const router = new Router({
        mode: 'history',
        routes,
    });
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
        this.defaultTitle = options.defaultTitle ? options.defaultTitle : 'Title';
        this.log = options.log ? options.log : new Log();
        this.MainComponent = options.MainComponent;
        this.Router = options.Router;
        this.routes = options.routes;
        this.template = options.template;
        this.Vue = options.Vue;
        this.vueServerRenderer = options.vueServerRenderer;
        this.vueRenderer = this.vueServerRenderer.createRenderer({ template: this.template });
    }
    async middleware(req, res) {
        const { classLogPrefix, defaultTitle, log, MainComponent, Router, routes, Vue, vueRenderer, } = this;
        const logPrefix = classLogPrefix + 'middleware() - ';
        const context = {
            url: req.url,
            title: defaultTitle,
            head: '',
        };
        let createdApp;
        log.debug(logPrefix + 'Trying to create the main app');
        try {
            const { app } = await createApp({
                data: { req: { url: req.url } },
                MainComponent,
                Router,
                routes,
                url: String(req.url),
                Vue,
            });
            createdApp = app;
        }
        catch (err) {
            if (err.code === 404) {
                log.debug(logPrefix + 'No vue route was matched');
                res.statusCode = 404;
                res.end('Not Found');
                return;
            }
            else {
                log.error(logPrefix + 'Error creating main app: "' + err.message + '"');
                throw err;
            }
        }
        log.debug(logPrefix + 'Main app created, rendering to string');
        vueRenderer.renderToString(createdApp, context, (err, html) => {
            if (err) {
                log.warn(logPrefix + 'Could not render to string, err: "' + err.message.replace(/(\r\n|\n|\r)/gm, ' ') + '"');
                if (process.env.NODE_ENV === 'development') {
                    throw err;
                }
                res.statusCode = 500;
                res.end('Internal server error');
                return;
            }
            log.debug(logPrefix + 'Rendered main vue app to string');
            res.end(html);
        });
    }
}
export { createApp, VueRender };
