import { createApp } from '/node_modules/vue-ssr-tools/dist/index.js';
import Vue from '/node_modules/vue/dist/vue.esm.browser.min.js';
import Router from '/node_modules/vue-router/dist/vue-router.esm.browser.min.js';
import mainComponentFactory from './components/main.js';
import routesFactory from './routes.js';

Vue.use(Router);

(async () => {
	const { app } = await createApp({
		mainComponent: mainComponentFactory(),
		Router,
		routes: routesFactory(),
		url: window.location.pathname,
		Vue,
	});
	app.$mount('#vue-main')
})();