import { LogInstance } from 'larvitutils';
import { ServerResponse } from 'http';
import Router, { RouteConfig } from 'vue-router';
import Vue from 'vue';
import vueServerRenderer, { RendererOptions, Renderer } from 'vue-server-renderer';
import { Store } from 'vuex';

/**
 * @param log - For logging
 * @param mainComponent - main vue component to be rendered
 * @param Router - Vuerouter, non instanciated
 * @param routes - to be sent to Vuerouter
 * @param url - what url we are on right now
 * @param Vue - Vue
 */
type CreateAppOptions = {
	log?: LogInstance;
	mainComponent: Vue.Component | Promise<Vue.Component>;
	Router: typeof Router;
	routes: RouteConfig[] | Promise<RouteConfig[]>;
	store?: Store<any>;
	url: string;
	Vue: typeof Vue;
}

/**
 * @param log logging
 * @param publicHost Full protocol and hostname to the external site, Example: https://mysite.com
 */
type GetVueTmplOptions = {
	log?: LogInstance;
	publicHost: string;
	templatesBasePath: string;
}

type MwRes = ServerResponse & {
	__SHARED_STATE__: any,
	mainComponent: Vue.Component,
	routes: RouteConfig[],
	store?: Store<any>
}

type VueRenderOptions = {
	log?: LogInstance;
	mainComponent: Vue.Component;
	renderContext?: any;
	Router: typeof Router;
	template: string;
	Vue: typeof Vue;
	vueServerRenderer: VueServerRenderer;
}

type VueServerRenderer = {
	createRenderer: (options?: RendererOptions) => Renderer;
}

export {
	CreateAppOptions,
	GetVueTmplOptions,
	MwRes,
	Router as RouterType,
	Vue as VueType,
	VueRenderOptions,
	vueServerRenderer,
	VueServerRenderer,
}