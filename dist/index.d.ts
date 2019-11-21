/// <reference types="node" />
import { CreateAppOptions, RouterType, VueRenderOptions, VueType } from './models';
import { IncomingMessage, ServerResponse } from 'http';
declare function createApp(options: CreateAppOptions): Promise<{
    app: import("vue/types/vue").CombinedVueInstance<VueType, object, object, object, Record<never, any>>;
    router: RouterType;
}>;
declare class VueRender {
    private classLogPrefix;
    private log;
    private MainComponent;
    private renderContext;
    private Router;
    private routes;
    private template;
    private Vue;
    private vueRenderer;
    private vueServerRenderer;
    constructor(options: VueRenderOptions);
    middleware(req: IncomingMessage, res: ServerResponse & {
        __INITIAL_STATE__: any;
    }): Promise<void>;
}
export { createApp, VueRender };
//# sourceMappingURL=index.d.ts.map