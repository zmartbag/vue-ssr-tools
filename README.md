# Vue SSR Tools

Tooling for working with Vue server side

## Table of Contents

* [Preparations](#preparations)
  - [Dependencies](#dependencies)
* [Installation](#installation)
* [Usage](#usage)
  1. [Basic server side render with router](#1-basic-server-side-render-with-router)
  2. [Client side hydration](#2-client-side-hydration)
     1. [Break apart the code we want to use both client- and serverside](#21-break-apart-the-code-we-want-to-use-both-client--and-serverside)
     2. [Create new files needed client side](#22-create-new-files-needed-client-side)
  3. [Write component templates in separate HTML file](#3-write-component-templates-in-separate-html-file)
  4. [Add Vuex](#4-add-vuex)

## Preparations

If you do not have a project already, create a new folder and initialize it:

```
mkdir my-cool-project
npm init
```

After you're done answerin the npm questions, edit your new `package.json` file and add a new line containing: `type="module"`.

### Dependencies

Some packages or some compatible equivalent needs to be installed:

`npm i vue vue-router vue-server-renderer express`

Node with ESM Module support needed. Node 8 and up supports this under the flag `--experimental-modules` and from Node 13.2 ESM Modules should be supported without the flag (as I write this Node 13.1 is the latest release).

## Installation

`npm i vue-ssr-tools`

## Usage

### 1. Basic server side render with router

This is the most basic implementation without client side hydration (Vue only runs server side)

**index.js**
```javascript
import { VueRender } from 'vue-ssr-tools';
import express from 'express';
import Router from 'vue-router';
import Vue from 'vue';
import vueServerRenderer from 'vue-server-renderer';

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
```

test it out by running it from the console: `node index.js` (or for node 8-12: `node --experimental-modules index.js`)

### 2. Client side hydration

Make vue work on the client as well

#### 2.1. Break apart the code we want to use both client- and serverside

In this step, we make no change to the actual code, just splitting it up in different files.

---

The main vue component is the vue component that will be mounted in the html template.

**public/vue/components/main.js**
```javascript
export default async function () {
	return {
		template: `<div id="vue-main">
			<ul>
				<li><router-link to="/">Home</router-link></li>
				<li><router-link to="/foo">Foo</router-link></li>
			</ul>
			<router-view></router-view>
		</div>`
	};
}
```

---

Routes sent to the router, see vue-router documentation for more options and how these actually work.

**public/vue/routes.js**
```javascript
export default async function () {
	return [
		{ path: '/', component: { template: '<p>Home</p>' }},
		{ path: '/foo', component: { template: '<p>Foo</p>' }}
	];
}
```

---

The base template all pages will share. {{ title }} and {{{ head }}} will be covered later. `<!-- vue-ssr-outlet -->` will be replaced with
your main component (see above).

**index.template.html**
```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>{{ title }}</title>
		<meta charset="utf-8" />
		{{{ head }}}
	</head>
	<body>
		<!--vue-ssr-outlet-->
	</body>
</html>
```

---

Tie it all together in the index file.

**index.js**
```javascript
import { VueRender } from 'vue-ssr-tools';
import express from 'express';
import Router from 'vue-router';
import Vue from 'vue';
import vueServerRenderer from 'vue-server-renderer';

// Imported stuff not needed when all was in the same file:
import fs from 'fs';
import mainComponentFactory from './public/vue/components/main.js';
import routesFactory from './public/vue/routes.js';

Vue.use(Router);

const server = express();

// Instance of a SSR vue render thingie with routes and all
const vueRender = new VueRender({
	Router,
	template: fs.readFileSync('./index.template.html', 'utf-8').toString(),
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
```

#### 2.2. Create new files needed client side

First we need to modify our index to serve our node_modules and public folders to the browser.

**index.js**
```javascript
import { VueRender } from 'vue-ssr-tools';
import express from 'express';
import Router from 'vue-router';
import Vue from 'vue';
import vueServerRenderer from 'vue-server-renderer';

// Imported stuff not needed when all was in the same file:
import mainComponentFactory from './public/vue/components/main.js';
import routesFactory from './public/vue/routes.js';import fs from 'fs';

Vue.use(Router);

const server = express();

// Serve the public folder as static files directly
server.use(express.static('public'));

// Server node modules publicly
server.use('/node_modules', express.static('node_modules'));

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
```

---

This file is only ran client side to create the vue app in the browser.

**public/vue/entry.js**
```javascript
import { createApp } from '/node_modules/vue-ssr-tools/dist/index.js';
import mainComponentFactory from './components/main.js';
import Router from '/node_modules/vue-router/dist/vue-router.esm.browser.min.js';
import routesFactory from './routes.js';
import Vue from '/node_modules/vue/dist/vue.esm.browser.min.js';

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
```

---

We also need to modify our base template to include our client entry file.

**index.template.html**
```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>{{ title }}</title>
		<meta charset="utf-8" />
		<script defer src="/vue/entry.js" type="module"></script>
		{{{ head }}}
	</head>
	<body>
		<!--vue-ssr-outlet-->
	</body>
</html>
```
### 3. Write component templates in separate HTML file

In this section we use a handy tool to write the vue component template part in a HTML file for better editor support and maintainability.

First we load a little tool that fetches html-files for us, we do this in index.js and public/vue/entry.js

**index.js**
```javascript
import { VueRender, GetVueTmpl } from 'vue-ssr-tools';
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
const getVueTmpl = new GetVueTmpl({
	publicHost: 'http://localhost:3000',
	templatesBasePath: '/vue/templates/'
});

// Serve the public folder as static files directly
server.use(express.static('public'));

// Server node modules publicly
server.use('/node_modules', express.static('node_modules'));

// Instance of a SSR vue render thingie with routes and all
const vueRender = new VueRender({
	Router,
	template: fs.readFileSync('./index.template.html', 'utf-8').toString(),
	Vue,
	vueServerRenderer,
});

// Instantiate main component and routes for each request
// and register the vueRender middleware on the express server
server.get('*', (req, res, cb) => {
	res.mainComponent = mainComponentFactory({ getVueTmpl });
	res.routes = routesFactory();
	vueRender.middleware(req, res, cb);
});

server.listen(3000, err => {
	if (err) throw err;
	console.log('HTTP server started on port: "3000"');
});
```

**public/vue/components/main.js**
```javascript
export default async function (options) {
	const { getVueTmpl } = options;

	return {
		template: await getVueTmpl.getString('main')
	};
}
```

**public/vue/templates/main.html**
```HTML
<div id="vue-main">
	<ul>
		<li><router-link to="/">Home</router-link></li>
		<li><router-link to="/foo">Foo</router-link></li>
	</ul>
	<router-view></router-view>
</div>
```

**public/vue/entry.js**
```javascript
import { createApp, GetVueTmpl } from '/node_modules/vue-ssr-tools/dist/index.js';
import Vue from '/node_modules/vue/dist/vue.esm.browser.min.js';
import Router from '/node_modules/vue-router/dist/vue-router.esm.browser.min.js';
import mainComponentFactory from './components/main.js';
import routesFactory from './routes.js';

Vue.use(Router);

const getVueTmpl = new GetVueTmpl({
	publicHost: 'http://localhost:3000',
	templatesBasePath: '/vue/templates/'
});

(async () => {
	const { app } = await createApp({
		mainComponent: mainComponentFactory({ getVueTmpl }),
		Router,
		routes: routesFactory(),
		url: window.location.pathname,
		Vue,
	});
	app.$mount('#vue-main')
})();
```

### 4. Add Vuex

Add store to createApp in `public/vue/entry.js`:
```javascript
... // other code
import Vue from '/node_modules/vue/dist/vue.esm.browser.js';
import Vuex from '/node_modules/vuex/dist/vuex.esm.browser.js';

... // other code
Vue.use(Vuex);

... // other code
const store = new Vuex.Store({ ... }); // <-- new
const { app } = await createApp({
	mainComponent: mainComponentFactory({ store }), // "store" is added here
	Router,
	routes: routesFactory(),
	store, // <-- new
	url: window.location.pathname,
	Vue,
});
```

On the server side we need to add state to the renderContext in VueRender. See [2.2. Create new files needed client side](#22-create-new-files-needed-client-side) for full example. Below is the additions to that code.

Add renderContext to VueRender in `index.js`:
```javascript
import Vuex from 'vuex';
... // other code

Vue.use(Router);
Vue.use(Vuex); // <-- new

... // other code

const store = new Vuex.Store({ ... }); // <-- new
const renderContext = {}; // <-- new
renderContext.rendered = () => { // <-- new
	renderContext.state = store.state; // <-- new
}; // <-- new

const vueRender = new VueRender({
	... // other code
	renderContext, // <-- new
	... // other code
});

... // other code
server.get('*', (req, res, cb) => {
	res.mainComponent = mainComponentFactory({ store }); // "store" is added here
	res.routes = routesFactory();
	vueRender.middleware(req, res, cb);
});
```

Add state to the main component in `public/vue/components/main.js`:
```javascript
export default async function (options) { // "options" is added here
	const { store } = options; // <-- new
	return {
		store, // <-- new
		template: `<div id="vue-main">
			<ul>
				<li><router-link to="/">Home</router-link></li>
				<li><router-link to="/foo">Foo</router-link></li>
			</ul>
			<router-view></router-view>
		</div>`
	};
}
```