import { getAncestorsTree } from "./ancestor-chart";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import {
  Chart,
  ChartInfo,
  ChartOptions,
  ExpanderDirection,
  Fam,
  Indi,
} from "./api";
import { ChartUtil, getChartInfo } from "./chart-util";
import { layOutDescendants } from "./descendant-chart";

/**
 * Renders an hourglass chart. It consists of an ancestor chart and
 * a descendant chart for a family.
 */
export class HourglassChart<IndiT extends Indi, FamT extends Fam>
  implements Chart
{
  readonly util: ChartUtil;

  constructor(readonly options: ChartOptions) {
    this.util = new ChartUtil(options);
  }

  render(): ChartInfo {
    const ancestorsRoot = getAncestorsTree(this.options);
    const ancestorNodes = this.util.layOutChart(ancestorsRoot, {
      flipVertically: true,
    });
    const descendantNodes = layOutDescendants(this.options);

    // The first ancestor node and descendant node is the start node.
    if (ancestorNodes[0].data.indi?.expander !== undefined) {
      descendantNodes[0].data.indi!.expander =
        ancestorNodes[0].data.indi?.expander;
    }
    if (ancestorNodes[0].data.spouse?.expander !== undefined) {
      descendantNodes[0].data.spouse!.expander =
        ancestorNodes[0].data.spouse?.expander;
    }

    // slice(1) removes the duplicated start node.
    const nodes = ancestorNodes.slice(1).concat(descendantNodes);
    const animationPromise = this.util.renderChart(nodes);

    const info = getChartInfo(nodes);

    function zoomed(e: any) {
      return select("g").attr("transform", e.transform);
    }
    function move() {
      return zoomIdentity.translate(info.origin[0], info.origin[1]);
    }
    const svg = select("svg").attr("width", "100%").attr("height", "100%");
    const chartZoom = zoom().scaleExtent([0.25, 8]).on("zoom", zoomed);
    // @ts-ignore
    svg.call(chartZoom);
    // @ts-ignore
    svg.call(chartZoom.transform, move);

    return Object.assign(info, { animationPromise });
  }
}
