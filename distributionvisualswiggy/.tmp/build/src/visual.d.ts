import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
export declare class Visual implements IVisual {
    private root;
    private dropdowns;
    private allCols;
    private selected;
    private measureIndex;
    private searchText;
    private summaryContainer;
    private lastDataView;
    private expandedLevel1;
    private expandedLevel2;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private redrawDropdowns;
    private renderSummary;
    private formatNum;
    private createRow;
}
