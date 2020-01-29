import { createApp } from '/node_modules/vue-ssr-tools/dist/index.js';
import mainComponentFactory from './components/main.js';
import Router from '/node_modules/vue-router/dist/vue-router.esm.browser.js';
import routesFactory from './routes.js';
import Vue from '/node_modules/vue/dist/vue.esm.browser.js';
import Vuex from '/node_modules/vuex/dist/vuex.esm.browser.js';

Vue.use(Router);
Vue.use(Vuex);

const store = new Vuex.Store({
	state: () => ({
		foo: 'blipp'
	}),

	mutations: {
		setFoo(state, newFoo) {
			state.foo = newFoo;
		}
	}
});
if (window.__INITIAL_STATE__) {
	store.replaceState(window.__INITIAL_STATE__);
}

(async () => {
	const { app } = await createApp({
		mainComponent: mainComponentFactory({ store }),
		Router,
		routes: routesFactory(),
		store,
		url: window.location.pathname,
		Vue,
	});
	app.$mount('#vue-main')
})();