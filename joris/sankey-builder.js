import {
  allGenres,
  filterByGenres,
  makeGenreSelectOptions,
  fetchUniqueGenres,
  genreSelectionListener,
} from "./sankey-filter.js";

// Prepare Sankey
var units = "occurences";

// set the dimensions and margins of the graph
var margin = { top: 10, right: 10, bottom: 10, left: 10 },
  // width = document.documentElement.clientWidth-70,
  // height = document.documentElement.clientHeight-30;
  width = document.documentElement.clientWidth - margin.left - margin.right,
  height =
    0.8 * document.documentElement.clientHeight -
    0 -
    margin.top -
    margin.bottom;

// format variables
var formatNumber = d3.format(",.0f"), // zero decimal places
  format = function (d) {
    return formatNumber(d) + " " + units;
  },
  color = d3.scaleOrdinal(d3.schemeCategory10);

// append the svg object to the body of the page
var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("display", "block")
  .attr("margin", "auto")
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
// Set the sankey diagram properties
var sankey = d3.sankey().nodeWidth(30).nodePadding(20).size([width, height]);

var path = sankey.link();

// Main

fetchUniqueGenres(); // computes allGenres
makeGenreSelectOptions(allGenres); // add genres to select options
drawSankey(allGenres);
genreSelectionListener(allGenres); // listen for filter changes and redraw diagram

export function drawSankey(genres) {
  
  svg.selectAll("*").remove(); // delete previous diagram

  d3.json("sankey-genre.json", function (error, graph) {
    // --- start custom code ---

    graph = filterByGenres(graph, genres);

    // --- end custom code ---

    sankey.nodes(graph.nodes).links(graph.links).layout(32);

    // add in the links
    var link = svg
      .append("g")
      .selectAll(".link")
      .data(graph.links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function (d) {
        return Math.max(1, d.dy);
      })
      .sort(function (a, b) {
        return b.dy - a.dy;
      });

    // add the link titles
    link.append("title").text(function (d) {
      return d.source.name + " → " + d.target.name + "\n" + format(d.value);
    });

    // add in the nodes
    var node = svg
      .append("g")
      .selectAll(".node")
      .data(graph.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .call(
        d3
          .drag()
          .subject(function (d) {
            return d;
          })
          .on("start", function () {
            this.parentNode.appendChild(this);
          })
          .on("drag", dragmove)
      );

    // add the rectangles for the nodes
    node
      .append("rect")
      .attr("height", function (d) {
        return d.dy;
      })
      .attr("width", sankey.nodeWidth())
      .style("fill", function (d) {
        return (d.color = color(d.name.replace(/ .*/, "")));
      })
      .style("stroke", function (d) {
        return d3.rgb(d.color).darker(2);
      })
      .append("title")
      .text(function (d) {
        return d.name + "\n" + format(d.value);
      });

    // add in the title for the nodes
    node
      .append("text")
      .attr("x", -6)
      .attr("y", function (d) {
        return d.dy / 2;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function (d) {
        return d.name;
      })
      .filter(function (d) {
        return d.x < width / 2;
      })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

    // the function for moving the nodes
    function dragmove(d) {
      d3.select(this).attr(
        "transform",
        "translate(" +
          d.x +
          "," +
          (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) +
          ")"
      );
      sankey.relayout();
      link.attr("d", path);
    }

    // link.exit().remove();
  });
}
