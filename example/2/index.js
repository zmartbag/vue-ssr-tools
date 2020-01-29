import { VueRender } from '../../dist/index.js';
import vueServerRenderer from 'vue-server-renderer';
import Router from 'vue-router';
import Vue from 'vue';
import express from 'express';

// Imported stuff not needed when all was in the same file:
import mainComponentFactory from './public/vue/components/main.js';
import routesFactory from './public/vue/routes.js';
import fs from 'fs';

Vue.use(Router);

const server = express();

// Serve the public folder as static files directly
server.use(express.static('public'));

// Server node modules publicly
server.use('/node_modules', express.static('node_modules'));

// !!!!!!!! Only in this example file, special hosting of vue-ssr-tools since we are acutally inside this module in this example
server.use('/node_modules/vue-ssr-tools', express.static('../..'));

// Instance of a SSR vue render thingie with routes and all
const vueRender = new VueRender({
	Router,
	template: fs.readFileSync('./index.template.html', 'utf-8'),
	Vue,
	vueServerRenderer,
});

// Instantiate main component and routes for each request
// and register the vueRender middleware on the express server
server.get('*', (req, res, cb) => {
	res.mainComponent = mainComponentFactory();
	res.routes = routesFactory();
	vueRender.middleware(req, res, cb);
});

server.listen(3000, err => {
	if (err) throw err;
	console.log('HTTP server started on port: "3000"');
});