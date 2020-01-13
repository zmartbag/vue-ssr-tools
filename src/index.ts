import {
	CreateAppOptions,
	GetVueTmplOptions,
	RouterType,
	VueRenderOptions,
	vueServerRenderer,
	VueServerRenderer,
	VueType,
} from './models';
import { RouteConfig } from 'vue-router';
import { LogInstance } from 'larvitutils';
import { IncomingMessage, ServerResponse } from 'http';

const topLogPrefix = 'vue-ssr-tools: ';

// tslint:disable
const defaultLogger = {
	silly:   (msg: string) => console.log('silly: '   + msg),
	debug:   (msg: string) => console.log('debug: '   + msg),
	verbose: (msg: string) => console.log('verbose: ' + msg),
	info:    (msg: string) => console.log('info: '    + msg),
	warn:    (msg: string) => console.log('warn: '    + msg),
	error:   (msg: string) => console.log('error: '   + msg),
};
// tslint:enable

// !!! Vue.use(Router) must already be ran before this function is called !!!
async function createApp(options: CreateAppOptions) {
	const logPrefix = topLogPrefix + 'createApp() - ';
	const {
		mainComponent,
		Router,
		routes,
		url,
		Vue,
	} = options;

	const router = new Router({
		mode: 'history',
		routes: await Promise.resolve(routes),
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

	const resovledMainComponent = await Promise.resolve(mainComponent);

	const app = new Vue({
		// The root instance simply renders the App component.
		router,
		render: h => h(resovledMainComponent),
	});
	return { app, router };
}

/**
 * Tooling to get vue template strings from .html-files
 */
class GetVueTmpl {
	private logPrefix: string = topLogPrefix + 'GetVueTmpl: ';

	private log: LogInstance;
	private publicHost: string;
	private templatesBasePath: string;

	constructor(options: GetVueTmplOptions) {
		this.log = options.log ? options.log : defaultLogger;
		this.publicHost = options.publicHost;
		this.templatesBasePath = options.templatesBasePath;
	}

	public async getString(componentName: string): Promise<string> {
		const logPrefix = this.logPrefix + 'getString() - ';
		const { log, publicHost, templatesBasePath } = this;
		let fetch: (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
		let tmplPath;

		if (typeof window === 'undefined') {
			log.debug(logPrefix + 'Running server side');
			// const __dirname = import.meta.url.slice(7, import.meta.url.lastIndexOf('/'));
			// @ts-ignore
			const fetchModule = await import('./node-fetch.js');
			fetch = fetchModule.default;
			tmplPath = publicHost + templatesBasePath + componentName + '.html';
		} else {
			log.debug(logPrefix + 'Running client side');
			fetch = window.fetch;
			tmplPath = templatesBasePath + componentName + '.html';
		}

		const result = await fetch(tmplPath);
		return result.text();
	}
}

class VueRender {
	private classLogPrefix = topLogPrefix + 'VueRender: ';
	private log: LogInstance;
	private renderContext: any;
	private Router: typeof RouterType;
	private template: string;
	private Vue: typeof VueType;
	private vueRenderer: vueServerRenderer.Renderer;
	private vueServerRenderer: VueServerRenderer;

	constructor(options: VueRenderOptions) {
		this.log = options.log ? options.log : defaultLogger;
		this.renderContext = options.renderContext ? options.renderContext : {};
		this.Router = options.Router;
		this.template = options.template;
		this.Vue = options.Vue;
		this.vueServerRenderer = options.vueServerRenderer;

		this.vueRenderer = this.vueServerRenderer.createRenderer({ template: this.template });
	}

	public async middleware(req: IncomingMessage, res: ServerResponse & {__SHARED_STATE__: any, mainComponent: Vue.Component, routes: RouteConfig[] }) {
		const {
			classLogPrefix,
			renderContext,
			log,
			Router,
			Vue,
			vueRenderer,
		} = this;
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
				log,
				mainComponent: res.mainComponent,
				Router,
				routes: res.routes,
				url: String(req.url),
				Vue,
			});
			createdApp = app;
		} catch (err) {
			if (err.name === '404') {
				log.debug(logPrefix + 'No vue route was matched');
				res.statusCode = 404;
				res.end('Not Found');
				return;
			} else {
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
			log.debug(logPrefix + 'Rendered main vue app to string, setting __SHARED_STATE__');

			html = html.replace('<!--__SHARED_STATE__-->', '<script>window.__SHARED_STATE__ = ' + JSON.stringify(res.__SHARED_STATE__) + ';</script>');

			if (res.headersSent) {
				log.verbose(logPrefix + 'Headers are already sent, can not send vue app to client');
				return;
			}

			res.end(html);
		});
	}
}

export {
	createApp,
	GetVueTmpl,
	VueRender,
};
