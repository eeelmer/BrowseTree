// --------------------------------------------------------
//
document.addEventListener('DOMContentLoaded', function() {
  setup();
  updateDimensions();
  recalculateAndRender();
});

$(window).resize(function() {
  updateDimensions();
  recalculateAndRender();
});

// --------------------------------------------------------
// State and Setup
//
function setup() {

  width = 960;
  height = 500;
  node = null;
  link = null;
  nodeData = null;

  radiusScale = d3.scale.linear()
    .domain([1, 10])
    .range([4, 15]);

  linkDistanceScale = d3.scale.linear()
    .domain([1, 10])
    .range([30, 100]);

  force = d3.layout.force()
    .size([width, height])
    .on("tick", tick)
    .gravity(0.01)
    .linkDistance(function(d) {
      var maxWeight = Math.max(d.source.weight, d.target.weight);
      return linkDistanceScale(maxWeight);
    })

  vis = d3.select("#force-visualization").append("svg:svg")
    .attr("width", width)
    .attr("height", height);

  // Initialize a starter data set
  rootDateTime = new Date().toString("MM/dd/yyyy HH:mm")

  dataSet = { id: "root",
              title: "the root",
              dateTime: rootDateTime };
}

// --------------------------------------------------------
// Modifiers
//
function updateDimensions()
{
  height = $(window).height() - 66;
  width = $(window).width() - 40;

  var forceVisualization = $("#force-visualization svg");
  forceVisualization.attr("height", height);
  forceVisualization.attr("width", width);

  force.size([width, height]);
}

// --------------------------------------------------------
// Calculations and Rendering
//
function recalculateAndRender() {

  nodeData = flatten(dataSet)

  // Calculate layout for links
  links = d3.layout.tree().links(nodeData);

  // Restart the force layout
  force
      .nodes(nodeData)
      .links(links)
      .start();

  // Select links and calculate data join
  link = vis.selectAll("line.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links
  link.enter().insert("svg:line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  // Exit any old links
  link.exit().remove();

  // Select nodes and calculate data join
  node = vis.selectAll("circle.node")
      .data(nodeData, function(d) { return d.id; })
      .style("fill", color);

  // Enter any new nodes
  node.enter().append("svg:circle")
      .attr("class", "node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", color)
      .on("click", updateInfoWindow)
      .call(force.drag);

  // Update the nodes
  node
    .attr("r", function(d) {
      return radiusScale(d.weight);
    });

  // Exit any old nodes.
  node.exit().remove();
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

//
function color(d) {
  if(d.id == "root") return "#444";
  return d._children ? "#3182bd" : d.children ? "#c00" : "#c00";
}

//
// Setup event listener for Node addition
//
chrome.tabs.onUpdated.addListener(function(tabId, updates, tab) {

  var devToolsRegex = /chrome-devtools:/

  if(updates.status == 'complete' &&
     tab.title != "New Tab" && tab.title != "Browse Tree" &&
     !devToolsRegex.exec(tab.title) ) {

    // Does the nodeData for this tab already exist?
    var dataExists = false;
    for(var i = 0; i < nodeData.length; i++) {
      if(nodeData[i].id  == tab.id) {
        dataExists = true;
        break;
      }
    }
    if(!dataExists) {
      addNodeData(tab.openerTabId, tab.id, tab.title, tab.url);
    } else {
      updateNodeData(tab.id, tab.title, tab.url)
    }
  }
});

// --------------------------------------------------------
// TREE Node Addition
//
function addNodeData(parentId, newId, newTitle, newUrl) {

  var creationDateTime = new Date().toString("MM/dd/yyyy HH:mm")

  // Create a new node
  var newNode = { id:    newId,
                  title: newTitle,
                  url:   newUrl,
                  dateTime: creationDateTime };

  // Find the parent node
  var parentIndex = 0;
  for(var i = 0; i < nodeData.length; i++) {
    if(nodeData[i].id == parentId) {
      parentIndex = i;
      break;
    }
  }
  var parentNode = nodeData[parentIndex];

  // Add the new node to the node data
  if(parentNode.children) parentNode.children.push(newNode); else parentNode.children = [newNode];
  nodeData.push(newNode);

  recalculateAndRender();
}

// --------------------------------------------------------
// Node Update
//

function updateNodeData(id, title, url) {
  for(var i = 0; i < nodeData.length; i++) {
    if(nodeData[i].id == id) {
      nodeData[i].title = title;
      break;
    }
  }
  recalculateAndRender();
}

// --------------------------------------------------------
// Info Window
//
function updateInfoWindow(d) {
  var infoWindow = d3.select("#info-window");

  var updateInfoWindowContents = function() {
    infoWindow
      .select("#node-id")
      .text(d.id);
    infoWindow
      .select("#node-url")
      .text(d.title)
      .attr("href", d.url);
    infoWindow
      .select("#node-date-time")
      .text(d.dateTime)
  }

  if ( infoWindow.classed("hidden") ) {
    var xPosition = 10;
    var yPosition = 20;

    updateInfoWindowContents();

    infoWindow.classed("hidden", false);
  } else {
    if ( d.id == d3.select("#node-id").text() ) {
      infoWindow.classed("hidden", true);
    } else {
      updateInfoWindowContents();
    }
  }
}

// --------------------------------------------------------
// Returns a list of all nodes under the root in a flat array
//
function flatten(root) {
  var nodes = [],
      i = 0;

  function recurse(node) {
    nodes.push(node);
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
  }

  recurse(root);
  return nodes;
}
