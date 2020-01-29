import { VueRender } from '../../dist/index.js';
import express from 'express';
import Router from 'vue-router';
import Vue from 'vue';
import vueServerRenderer from 'vue-server-renderer';
import Vuex from 'vuex';

// Imported stuff not needed when all was in the same file:
import mainComponentFactory from './public/vue/components/main.js';
import routesFactory from './public/vue/routes.js';
import fs from 'fs';

Vue.use(Router);
Vue.use(Vuex);

const server = express();

// Serve the public folder as static files directly
server.use(express.static('public'));

// Server node modules publicly
server.use('/node_modules', express.static('node_modules'));

// !!!!!!!! Only in this example file, special hosting of vue-ssr-tools since we are acutally inside this module in this example
server.use('/node_modules/vue-ssr-tools', express.static('../..'));

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
const renderContext = {};
renderContext.rendered = () => {
	renderContext.state = store.state;
};

// Instance of a SSR vue render thingie with routes and all
const vueRender = new VueRender({
	renderContext,
	Router,
	template: fs.readFileSync('./index.template.html', 'utf-8'),
	Vue,
	vueServerRenderer,
});

// Instantiate main component and routes for each request
// and register the vueRender middleware on the express server
server.get('*', (req, res, cb) => {
	res.mainComponent = mainComponentFactory({ store });
	res.routes = routesFactory();
	vueRender.middleware(req, res, cb);
});

server.listen(3000, err => {
	if (err) throw err;
	console.log('HTTP server started on port: "3000"');
});