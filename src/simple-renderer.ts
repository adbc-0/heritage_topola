import { select } from "d3-selection";
import {
  Renderer,
  RendererOptions,
  TreeEntry,
  TreeNode,
  TreeNodeSelection,
} from "./api";
import { FamDetails, IndiDetails } from "./data";
import { CompositeRenderer } from "./composite-renderer";

const MIN_HEIGHT = 27;
const MIN_WIDTH = 50;

/** Calculates the length of the given text in pixels when rendered. */
function getLength(text: string) {
  const g = select("svg").append("g").attr("class", "simple node");
  const x = g.append("text").attr("class", "name").text(text);
  const w = (x.node() as SVGTextContentElement).getComputedTextLength();
  g.remove();
  return w;
}

function getName(indi: IndiDetails) {
  return [indi.getFirstName() || "", indi.getLastName() || ""].join(" ");
}

function getFirstName(indi: IndiDetails) {
  return indi.getFirstName() ?? "";
}

function getLastName(indi: IndiDetails) {
  return indi.getLastName() ?? "";
}

function createPersonHyperLink(indi: IndiDetails) {
  return "http://localhost:3000/person/" + indi.getId();
}

function getYears(indi: IndiDetails) {
  const birthDate = indi.getBirthDate();
  const birthYear = birthDate && birthDate.date && birthDate.date.year;

  const deathDate = indi.getDeathDate();
  const deathYear = deathDate && deathDate.date && deathDate.date.year;

  if (!birthYear && !deathYear) {
    return "";
  }
  return `${birthYear || ""} – ${deathYear || ""}`;
}

/**
 * Simple rendering of an individual box showing only the person's name and
 * years of birth and death.
 */
export class SimpleRenderer extends CompositeRenderer implements Renderer {
  constructor(readonly options: RendererOptions<IndiDetails, FamDetails>) {
    super(options);
  }

  getPreferredIndiSize(id: string): [number, number] {
    const indi = this.options.data.getIndi(id)!;
    const years = getYears(indi);
    const nameLength = Math.max(
      getLength(getFirstName(indi)),
      getLength(getLastName(indi))
    );
    const width = Math.max(nameLength + 8, getLength(years), MIN_WIDTH);
    const height = MIN_HEIGHT + 14;
    return [width, height];
  }

  render(enter: TreeNodeSelection, update: TreeNodeSelection): void {
    const selection = enter.merge(update).append("g").attr("class", "simple");
    this.renderIndi(selection, (node) => node.indi!);
    const spouseSelection = selection
      .filter((node) => !!node.data.spouse)
      .append("g")
      .attr("transform", (node) =>
        this.options.horizontal
          ? `translate(0, ${node.data.indi!.height})`
          : `translate(${node.data.indi!.width}, 0)`
      );
    this.renderIndi(spouseSelection, (node) => node.spouse!);
  }

  getCss() {
    return `
.simple text {
  font: 12px sans-serif;
}

.simple .name {
  font-weight: bold;
}

.simple rect {
  stroke: #000;
}

.link {
  fill: none;
  stroke: #000;
  stroke-width: 1px;
}

.link-dotted {
    fill: none;
    stroke: #000;
    stroke-width: 1px;
    stroke-dasharray: 4;
}

.invisible {
  opacity: 0;
}

.additional-marriage {
  stroke-dasharray: 2;
}`;
  }

  private renderIndi(
    selection: TreeNodeSelection,
    indiFunc: (node: TreeNode) => TreeEntry
  ): void {
    // Optionally add a link.
    const group = this.options.indiHrefFunc
      ? selection
          .append("a")
          .attr("href", (node) =>
            this.options.indiHrefFunc!(indiFunc(node.data).id)
          )
      : selection;

    // Box.
    group
      .append("rect")
      .attr("width", (node) => indiFunc(node.data).width!)
      .attr("height", (node) => indiFunc(node.data).height!)
      .attr(
        "fill",
        (node) =>
          (this.options.data.getIndi(indiFunc(node.data).id) as any).json
            .color ?? "#FFF"
      )
      .on("click", (_, node) => {
        console.log(
          "reroute to different page:",
          createPersonHyperLink(
            this.options.data.getIndi(indiFunc(node.data).id)!
          )
        );
      });

    // Text.
    group
      .append("text")
      .attr("text-anchor", "middle")
      .attr("class", "name")
      .attr(
        "transform",
        (node) => `translate(${indiFunc(node.data).width! / 2}, 17)`
      )
      .text((node) =>
        getFirstName(this.options.data.getIndi(indiFunc(node.data).id)!)
      )
      .on("click", (_, node) => {
        console.log(
          "reroute to different page:",
          createPersonHyperLink(
            this.options.data.getIndi(indiFunc(node.data).id)!
          )
        );
      });

    group
      .append("text")
      .attr("text-anchor", "middle")
      .attr("class", "name")
      .attr(
        "transform",
        (node) => `translate(${indiFunc(node.data).width! / 2}, 33)`
      )
      .text((node) =>
        getLastName(this.options.data.getIndi(indiFunc(node.data).id)!)
      )
      .on("click", (_, node) => {
        console.log(
          "reroute to different page:",
          createPersonHyperLink(
            this.options.data.getIndi(indiFunc(node.data).id)!
          )
        );
      });

    group
      .append("text")
      .attr("text-anchor", "middle")
      .attr("class", "details")
      .attr(
        "transform",
        (node) => `translate(${indiFunc(node.data).width! / 2}, 33)`
      )
      .text((node) =>
        getYears(this.options.data.getIndi(indiFunc(node.data).id)!)
      );
  }
}
