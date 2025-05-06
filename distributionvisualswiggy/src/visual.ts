import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";

import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;

export class Visual implements IVisual {
  private root: HTMLElement;
  private dropdowns: { [lvl: number]: HTMLSelectElement } = {};
  private allCols: string[] = [];
  private selected: { [lvl: number]: string } = {};
  private measureIndex = -1;
  private searchText = "";
  private summaryContainer: HTMLElement;
  private lastDataView: DataView | null = null;
  private expandedLevel1 = new Set<string>();
  private expandedLevel2 = new Set<string>();

  constructor(options: VisualConstructorOptions) {
    this.root = options.element;
    this.root.classList.add("controls-root");

    // Filters Row
    const filterRow = this.createRow("three-level-root");
    this.root.appendChild(filterRow);

    // Dropdowns
    for (let lvl = 1; lvl <= 3; lvl++) {
      const sel = document.createElement("select");
      sel.className = "three-level-dropdown";
      sel.setAttribute("data-level", lvl.toString());
      sel.innerHTML = `<option value="" disabled selected>Select…</option>`;
      sel.onchange = () => {
        this.selected[lvl] = sel.value;
        this.redrawDropdowns();
        if (this.lastDataView) this.renderSummary(this.lastDataView);
      };
      filterRow.appendChild(sel);
      this.dropdowns[lvl] = sel;

      if (lvl < 3) {
        const arrow = document.createElement("span");
        arrow.className = "three-level-arrow";
        arrow.textContent = "›";
        filterRow.appendChild(arrow);
      }
    }

    // Clear Filter Button
    const clearButton = document.createElement("button");
    clearButton.className = "clear-filter-btn";
    clearButton.textContent = "Clear Filter";
    clearButton.onclick = () => {
      this.selected = {};
      this.redrawDropdowns();
      if (this.lastDataView) this.renderSummary(this.lastDataView);
    };
    this.root.appendChild(clearButton);

    // Search Row
    const searchRow = this.createRow("search-root");
    this.root.appendChild(searchRow);
    const input = document.createElement("input");
    input.className = "three-level-search";
    input.placeholder = "Type a city or area";
    input.oninput = () => {
      this.searchText = input.value.trim().toLowerCase();
      if (this.lastDataView) this.renderSummary(this.lastDataView);
    };
    searchRow.appendChild(input);

    // Summary Container
    this.summaryContainer = document.createElement("div");
    this.summaryContainer.className = "summary-container";
    this.root.appendChild(this.summaryContainer);
  }

  public update(options: VisualUpdateOptions) {
    const dv = options.dataViews?.[0];
    if (!dv?.table || !dv.table.columns) return;
    this.lastDataView = dv;

    const cols = dv.table.columns as DataViewMetadataColumn[];
    if (this.measureIndex < 0) {
      const idx = cols.findIndex(c => !!c.roles?.ftu);
      this.measureIndex = idx >= 0 ? idx : cols.length - 1;
    }

    this.allCols = cols
      .filter((_, i) => i !== this.measureIndex)
      .map(c => c.displayName as string);

    this.redrawDropdowns();
    this.renderSummary(dv);
  }

  private redrawDropdowns() {
    const used = Object.values(this.selected).filter(v => v);
    for (let lvl = 1; lvl <= 3; lvl++) {
      const sel = this.dropdowns[lvl];
      while (sel.options.length > 1) sel.remove(1);
      this.allCols
        .filter(c => !used.includes(c) || this.selected[lvl] === c)
        .forEach(c => {
          const isSel = this.selected[lvl] === c;
          sel.add(new Option(c, c, isSel, isSel));
        });
    }
  }

  private renderSummary(dv: DataView) {
    this.summaryContainer.innerHTML = "";
    const lvl1Field = this.selected[1];
    if (!lvl1Field) return;
  
    const cols = dv.table.columns as DataViewMetadataColumn[];
    const idx1 = cols.findIndex(c => c.displayName === lvl1Field);
    const idx2 = this.selected[2]
      ? cols.findIndex(c => c.displayName === this.selected[2])
      : -1;
    const idx3 = this.selected[3]
      ? cols.findIndex(c => c.displayName === this.selected[3])
      : -1;
    const ft = this.measureIndex;
    const rows = dv.table.rows as any[][];
  
    // Compute grand total FTU (after search filter)
    const grandTotal = rows.reduce((sum, r) => {
      const key1 = String(r[idx1] ?? "");
      if (this.searchText && !key1.toLowerCase().includes(this.searchText))
        return sum;
      return sum + (Number(r[ft]) || 0);
    }, 0);
  
    // Group by level-1
    const map1 = new Map<string, any[]>();
    rows.forEach(r => {
      const k1 = String(r[idx1] ?? "");
      if (this.searchText && !k1.toLowerCase().includes(this.searchText))
        return;
      (map1.get(k1) ?? map1.set(k1, []).get(k1)!).push(r);
    });
  
    // Render each level-1 group
    map1.forEach((groupRows, k1) => {
      const total1 = groupRows.reduce((s, r) => s + (Number(r[ft]) || 0), 0);
      const pct1 = grandTotal ? (total1 / grandTotal) * 100 : 0;
  
      // Level-1 Header
      const grp = document.createElement("div");
      grp.className = "summary-group";
  
      const header = document.createElement("div");
      header.className = "summary-item";
      header.innerHTML = `
        <div class="summary-left">
          <div class="summary-label-row">
            <img src="https://raw.githubusercontent.com/Christin98/swiggydcompositiontree/refs/heads/main/distributionvisualswiggy/assets/filter.png" class="summary-icon"/>
            <span class="summary-label">${k1}</span>
          </div>
          <div class="summary-bar-container">
            <div class="summary-bar-fill" style="width:${pct1}%"></div>
          </div>
        </div>
        <div class="summary-value">${this.formatNum(total1)}</div>
      `;
  
      // Show the expand arrow only if filter 2 is selected
      const arrow1 = document.createElement("span");
      arrow1.className = "expand-arrow";
      const open1 = this.expandedLevel1.has(k1);
      if (this.selected[2]) { // Check if filter 2 is selected
        arrow1.textContent = open1 ? "˄" : "˅";
        arrow1.onclick = () => {
          open1
            ? this.expandedLevel1.delete(k1)
            : this.expandedLevel1.add(k1);
          this.renderSummary(dv);
        };
      } else {
        arrow1.style.display = "none"; // Hide the arrow if filter 2 is not selected
      }
      header.appendChild(arrow1);
      grp.appendChild(header);
  
      // Level-2 (accordion)
      if (idx2 >= 0 && this.expandedLevel1.has(k1)) {
        const map2 = new Map<string, any[]>();
        groupRows.forEach(r => {
          const k2 = String(r[idx2] ?? "");
          (map2.get(k2) ?? map2.set(k2, []).get(k2)!).push(r);
        });
  
        const subC = document.createElement("div");
        subC.className = "summary-subcontainer";
  
        map2.forEach((subRows, k2) => {
          const total2 = subRows.reduce((s, r) => s + (Number(r[ft]) || 0), 0);
          const key2 = `${k1}||${k2}`;
          const open2 = this.expandedLevel2.has(key2);
  
          const subHeader = document.createElement("div");
          subHeader.className = "summary-subitem";
          subHeader.innerHTML = `
            <div class="summary-left">
              <div class="summary-label-row">
                <img src="https://raw.githubusercontent.com/Christin98/swiggydcompositiontree/refs/heads/main/distributionvisualswiggy/assets/filter.png" class="summary-icon"/>
                <span class="summary-label">${k2}</span>
              </div>
            </div>
            <div class="summary-value">${this.formatNum(total2)}</div>
          `;
  
          // Show the expand arrow only if filter 3 is selected
          const arrow2 = document.createElement("span");
          arrow2.className = "expand-arrow";
          const open3 = this.expandedLevel2.has(key2);
          if (this.selected[3]) { // Check if filter 3 is selected
            arrow2.textContent = open3 ? "˄" : "˅";
            arrow2.onclick = () => {
              open3
                ? this.expandedLevel2.delete(key2)
                : this.expandedLevel2.add(key2);
              this.renderSummary(dv);
            };
          } else {
            arrow2.style.display = "none"; // Hide the arrow if filter 3 is not selected
          }
          subHeader.appendChild(arrow2);
          subC.appendChild(subHeader);
  
          // Level-3 items
          if (idx3 >= 0 && open2) {
            const thirdC = document.createElement("div");
            thirdC.className = "summary-thirdcontainer";
            const map3 = new Map<string, number>();
            subRows.forEach(r => {
              const k3 = String(r[idx3] ?? "");
              map3.set(k3, (map3.get(k3) || 0) + (Number(r[ft]) || 0));
            });
            map3.forEach((v3, k3) => {
              const row3 = document.createElement("div");
              row3.className = "summary-thirditem";
              row3.innerHTML = `
                <div class="lvl3summary-left">
                  <img src="https://raw.githubusercontent.com/Christin98/swiggydcompositiontree/refs/heads/main/distributionvisualswiggy/assets/filter.png" class="summary-icon"/>
                  <span class="third-label">${k3}</span>
                </div>
                <span class="third-value">${this.formatNum(v3)}</span>
              `;
              thirdC.appendChild(row3);
            });
            subC.appendChild(thirdC);
          }
        });
  
        grp.appendChild(subC);
      }
  
      this.summaryContainer.appendChild(grp);
    });
  }
  

  private formatNum(v: number) {
    if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
    return v.toString();
  }

  private createRow(cls: string) {
    const d = document.createElement("div");
    d.className = cls;
    return d;
  }
}
