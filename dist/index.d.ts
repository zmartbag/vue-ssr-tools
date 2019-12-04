/// <reference types="node" />
import { CreateAppOptions, GetVueTmplOptions, RouterType, VueRenderOptions, VueType } from './models';
import { RouteConfig } from 'vue-router';
import { IncomingMessage, ServerResponse } from 'http';
declare function createApp(options: CreateAppOptions): Promise<{
    app: import("vue/types/vue").CombinedVueInstance<VueType, object, object, object, Record<never, any>>;
    router: RouterType;
}>;
/**
 * Tooling to get vue template strings from .html-files
 */
declare class GetVueTmpl {
    private logPrefix;
    private log;
    private publicHost;
    private templatesBasePath;
    constructor(options: GetVueTmplOptions);
    getString(componentName: string): Promise<string>;
}
declare class VueRender {
    private classLogPrefix;
    private log;
    private renderContext;
    private Router;
    private template;
    private Vue;
    private vueRenderer;
    private vueServerRenderer;
    constructor(options: VueRenderOptions);
    middleware(req: IncomingMessage, res: ServerResponse & {
        __INITIAL_STATE__: any;
        mainComponent: Vue.Component;
        routes: RouteConfig[];
    }): Promise<void>;
}
export { createApp, GetVueTmpl, VueRender, };
//# sourceMappingURL=index.d.ts.map