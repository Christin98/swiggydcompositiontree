import { Visual } from "../../src/visual";
import powerbiVisualsApi from "powerbi-visuals-api";
import IVisualPlugin = powerbiVisualsApi.visuals.plugins.IVisualPlugin;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import DialogConstructorOptions = powerbiVisualsApi.extensibility.visual.DialogConstructorOptions;
var powerbiKey: any = "powerbi";
var powerbi: any = window[powerbiKey];
var distributionvisualswiggyEFB7F2422A0641C7A27BAC90EC208426_DEBUG: IVisualPlugin = {
    name: 'distributionvisualswiggyEFB7F2422A0641C7A27BAC90EC208426_DEBUG',
    displayName: 'distribution_visual_swiggy',
    class: 'Visual',
    apiVersion: '5.11.0',
    create: (options?: VisualConstructorOptions) => {
        if (Visual) {
            return new Visual(options);
        }
        throw 'Visual instance not found';
    },
    createModalDialog: (dialogId: string, options: DialogConstructorOptions, initialState: object) => {
        const dialogRegistry = (<any>globalThis).dialogRegistry;
        if (dialogId in dialogRegistry) {
            new dialogRegistry[dialogId](options, initialState);
        }
    },
    custom: true
};
if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["distributionvisualswiggyEFB7F2422A0641C7A27BAC90EC208426_DEBUG"] = distributionvisualswiggyEFB7F2422A0641C7A27BAC90EC208426_DEBUG;
}
export default distributionvisualswiggyEFB7F2422A0641C7A27BAC90EC208426_DEBUG;