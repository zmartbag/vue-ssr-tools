import { VueRender } from '../../dist/index.js';
import vueServerRenderer from 'vue-server-renderer';
import Router from 'vue-router';
import Vue from 'vue';
import express from 'express';

// The router must be attached to the vue before anything else happends
// this is ugly as **** and will most likely be removed in Vue 3
Vue.use(Router);

const server = express();

// Instance of a SSR vue render thingie with routes and all
const vueRender = new VueRender({
	// Router constructor, must be compatible with vue-router
	// but you can hack your own if you like
	Router,

	// The base template all pages will share.
	// {{ title }} and {{{ head }}} will be covered later
	// <!-- vue-ssr-outlet --> will be replaced with
	// your main component (see above)
	template: `<!DOCTYPE html>
		<html lang="en">
			<head>
				<title>{{ title }}</title>
				<meta charset="utf-8" />
				{{{ head }}}
			</head>
			<body>
				<!--vue-ssr-outlet-->
			</body>
		</html>`,

	// Vue constructor
	Vue,

	// Vue server side renderer
	vueServerRenderer,
});

// Instantiate main component and routes for each request,
// since they might need request specific data.
// They are also async since when they get more complex in the
// future might need to resolve data and other async stuff
// before they are ready
// Then run the vue render minddleware
server.get('*', (req, res, cb) => {

	// The main vue component is the vue component that
	// will be mounted in the html template
	res.mainComponent = {
		template: `<div id="vue-main">
			<ul>
				<li><router-link to="/">Home</router-link></li>
				<li><router-link to="/foo">Foo</router-link></li>
			</ul>
			<router-view></router-view>
		</div>`
	};

	// Routes sent to the router, see vue-router documentation for
	// more options and how these actually work
	res.routes = [
		{ path: '/', component: { template: '<p>Home</p>' }},
		{ path: '/foo', component: { template: '<p>Foo</p>' }}
	];

	vueRender.middleware(req, res, cb);
});

server.listen(3000, err => {
	if (err) throw err;
	console.log('HTTP server started on port: "3000"');
});