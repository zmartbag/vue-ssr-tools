import Vue from 'vue';
import Router, { RouteConfig } from 'vue-router';
import { LogInstance } from 'larvitutils';
import vueServerRenderer, { RendererOptions, Renderer } from 'vue-server-renderer';

/**
 * @param MainComponent Function that returns a promise that resolves to a vue component
 */
type CreateAppOptions = {
	initialData?: any;
	log?: LogInstance;
	MainComponent: MainComponentType;
	Router: typeof Router;
	routes: RouteConfig[];
	url: string;
	Vue: typeof Vue;
}

type MainComponentOptions = {
	initialData?: any;
}

type MainComponentType = (options?: MainComponentOptions) => Promise<Vue.Component>;

type VueRenderOptions = {
	defaultTitle?: string;
	log?: LogInstance;
	MainComponent: MainComponentType;
	Router: typeof Router;
	routes: RouteConfig[];
	template: string;
	Vue: typeof Vue;
	vueServerRenderer: VueServerRenderer;
}

type VueServerRenderer = {
	createRenderer: (options?: RendererOptions) => Renderer;
}

export {
	CreateAppOptions,
	MainComponentOptions,
	MainComponentType,
	RouteConfig,
	Router as RouterType,
	Vue as VueType,
	VueRenderOptions,
	vueServerRenderer,
	VueServerRenderer,
}