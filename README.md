# Vue SSR Tools

Tooling for working with Vue server side

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

	// The main vue component is the vue component that
	// will be mounted in the html template
	MainComponent: () => {
		return {
			template: `<div id="vue-main">
				<ul>
					<li><router-link to="/">Home</router-link></li>
					<li><router-link to="/foo">Foo</router-link></li>
				</ul>
				<router-view></router-view>
			</div>`
		}
	},

	// Router constructor, must be compatible with vue-router
	// but you can hack your own if you like
	Router,

	// Routes sent to the router, see vue-router documentation for
	// more options and how these actually work
	routes: [
		{ path: '/', component: { template: '<p>Home</p>' }},
		{ path: '/foo', component: { template: '<p>Foo</p>' }}
	],

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

// Register the vueRender middleware on the express server
server.get('*', vueRender.middleware.bind(vueRender));

server.listen(3000, err => {
	if (err) throw err;
	console.log('HTTP server started on port: "3000"');
});
```

test it out bu running it from the console: `node --experimental-modules index.js`

### 2. Client side hydration

Make vue work on the client as well

#### 2.1. Break apart the code we want to use both client- and serverside

In this step, we make no change to the actual code, just splitting it up in different files.

---

The main vue component is the vue component that will be mounted in the html template.

**public/vue/components/main.js**
```javascript
export default function () {
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
export default [
	{ path: '/', component: { template: '<p>Home</p>' }},
	{ path: '/foo', component: { template: '<p>Foo</p>' }}
]
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
import vueServerRenderer from 'vue-server-renderer';
import Router from 'vue-router';
import Vue from 'vue';
import express from 'express';

// Imported stuff not needed when all was in the same file:
import MainComponent from './public/vue/components/main.js';
import routes from './public/vue/routes.js';
import fs from 'fs';

Vue.use(Router);

const server = express();

// Instance of a SSR vue render thingie with routes and all
const vueRender = new VueRender({
	MainComponent,
	Router,
	routes,
	template: fs.readFileSync('./index.template.html', 'utf-8'),
	Vue,
	vueServerRenderer,
});

// Register the vueRender middleware on the express server
server.get('*', vueRender.middleware.bind(vueRender));

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
import vueServerRenderer from 'vue-server-renderer';
import Router from 'vue-router';
import Vue from 'vue';
import express from 'express';

// Imported stuff not needed when all was in the same file:
import MainComponent from './public/vue/components/main.js';
import routes from './public/vue/routes.js';
import fs from 'fs';

Vue.use(Router);

const server = express();

// Serve the public folder as static files directly
server.use(express.static('public'));

// Server node modules publicly
server.use('/node_modules', express.static('node_modules'));

// Instance of a SSR vue render thingie with routes and all
const vueRender = new VueRender({
	MainComponent,
	Router,
	routes,
	template: fs.readFileSync('./index.template.html', 'utf-8'),
	Vue,
	vueServerRenderer,
});

// Register the vueRender middleware on the express server
server.get('*', vueRender.middleware.bind(vueRender));

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
import Vue from '/node_modules/vue/dist/vue.esm.browser.min.js';
import Router from '/node_modules/vue-router/dist/vue-router.esm.browser.min.js';
import MainComponent from './components/main.js';
import routes from './routes.js';

Vue.use(Router);

(async () => {
	const { app } = await createApp({
		MainComponent,
		Router,
		routes,
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
