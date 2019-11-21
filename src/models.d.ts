import Vue from 'vue';
import Router, { RouteConfig } from 'vue-router';
import { LogInstance } from 'larvitutils';
import vueServerRenderer, { RendererOptions, Renderer } from 'vue-server-renderer';

type ComponentType = (initialData: any) => Promise<Vue.Component>;

type CreateAppOptions = {
	initialData?: any;
	log?: LogInstance;
	MainComponent: ComponentType;
	Router: typeof Router;
	routes: RouteConfig[];
	url: string;
	Vue: typeof Vue;
}

type RoutesType = (initialState: any) => Promise<RouteConfig[]>;

type VueRenderOptions = {
	log?: LogInstance;
	MainComponent: ComponentType;
	renderContext?: any;
	Router: typeof Router;
	routes: RoutesType;
	template: string;
	Vue: typeof Vue;
	vueServerRenderer: VueServerRenderer;
}

type VueServerRenderer = {
	createRenderer: (options?: RendererOptions) => Renderer;
}

export {
	ComponentType,
	CreateAppOptions,
	Router as RouterType,
	RoutesType,
	Vue as VueType,
	VueRenderOptions,
	vueServerRenderer,
	VueServerRenderer,
}