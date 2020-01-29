/// <reference types="node" />
import { CreateAppOptions, GetVueTmplOptions, MwRes, RouterType, VueRenderOptions, VueType } from './models';
import { IncomingMessage } from 'http';
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
    middleware(req: IncomingMessage, res: MwRes): Promise<void>;
}
export { createApp, GetVueTmpl, VueRender, };
//# sourceMappingURL=index.d.ts.map