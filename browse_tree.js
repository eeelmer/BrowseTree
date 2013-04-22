// --------------------------------------------------------
// Handlers

$(window).ready(function() {
  updateHeights();
  recalculateAndRender();
});
$(window).resize(function() {
  updateHeights();
  recalculateAndRender();
});
document.addEventListener('DOMContentLoaded', function() {
  setup();
});

chrome.tabs.onCreated.addListener(function(tab) {
  // console.log('CREATE' + tab.index);
  // console.log('TAB: ' + tab.id + ' OID: ' + tab.openerTabId);
  // console.log('URL: ' + tab.url);
  // console.log('TITLE: ' + tab.title);
});

// --------------------------------------------------------
// State and Setup
//
function setup() {
  width = 960;
  height = 600;

  tree = d3.layout.tree()
    .size([$(window).height() - 96, width]);


  // Set up initial node data and layout
  root = {};
  nodeData = tree.nodes(root);
  root.parent = root;
  root.previousX = root.y;
  root.previousY = root.x;
  root.title = "root";

  diagonal = d3.svg.diagonal()
      .projection(function(d)
        {
          return [d.y, d.x];
        });

  svg = d3.select("#tree").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(10, 0)");

  duration = 750;

  recalculateAndRender();
}


// --------------------------------------------------------
// Modifiers
//
function updateHeights()
{
  // update the height of the svg container div
  var windowHeight = $(window).height() - 96;
  $('#tree').attr('height', windowHeight);

  // update the height of the root svg element
  var adjustedHeight = $(window).height() - 96;
  $("#tree svg").attr("height", adjustedHeight);

  // update the size attribute of the tree for accurate layout
  //    recalculations
  tree.size([adjustedHeight, width]);
}

function updateWidth(maxDepth) {
  $("#tree svg").attr("width", maxDepth * 200 + 200);
}

function toggleDisplay(infoWindow) {
  currentOpacity = infoWindow.attr("opacity")
  if(currentOpacity == 0)
    infoWindow.attr("opacity", 1.0);
  else
    infoWindow.attr("opacity", 0);
}


//
// Setup event listener
//
chrome.tabs.onUpdated.addListener(function(tabId, updates, tab) {

  // console.log('UPDATE: ' + updates.status)
  // console.log('TAB: ' + tab.id + ' OID: ' + tab.openerTabId);
  // console.log('URL: ' + tab.url);
  // console.log('TITLE: ' + tab.title);

  if(updates.status == 'complete') {

    // Is the node for this tab already in the tree?
    var currentNode = document.getElementById(tab.id);

    if(currentNode == null) {

      addNode(tab.openerTabId, tab.id, tab.title); // TREE CODE

      var attachNode = document.getElementById('log');
      var openerTabNode = document.getElementById(tab.openerTabId);

      if(openerTabNode != null) {
        attachNode = openerTabNode;
      } else {
        // Parent Node was never created. Create it.
        // Occurs due to inconsistent Chrome API behavior.
      }

      // Create Node for the new tab and attach it to the attach Node.
      var newTabNode = document.createElement('li');
      newTabNode.id = tab.id;
      var titleSpan = document.createElement('span')
      titleSpan.innerText = tab.title
      newTabNode.appendChild(titleSpan)
      newTabNode.appendChild(document.createElement('ul'));

      attachNode.getElementsByTagName('ul')[0].appendChild(newTabNode);
    } else {
      updateNode(tab.id, tab.title) // TREE CODE

      currentNode.getElementsByTagName('span')[0].innerText = tab.title;
    }
  }
});


// --------------------------------------------------------
// TREE Node Addition
//
function addNode(parentId, newId, newTitle) {

  // Create a new node
  var newNode = {id: newId,
                 title: newTitle};

  // Find the parent node
  var parentIndex = 0;
  if(parentId != 0) { // WILL NEED TO ADJUST FOR null parentId
    for(var i = 0; i < nodeData.length; i++) {
      if(nodeData[i].id == parentId) {
        parentIndex = i;
        break;
      }
    }
  }
  var parentNode = nodeData[parentIndex];

  // Add the new node to the node data
  if(parentNode.children) parentNode.children.push(newNode); else parentNode.children = [newNode];
  nodeData.push(newNode);

  recalculateAndRender();
}

// --------------------------------------------------------
// TREE Node Update
//

function updateNode(id, title) {
  for(var i = 0; i < nodeData.length; i++) {
    if(nodeData[i].id == id) {
      nodeData[i].title = title;
      break;
    }
  }
  recalculateAndRender();
}


// --------------------------------------------------------
// TREE Calculations and Rendering
//
function recalculateAndRender() {
  // Calculate Layout
  nodeData = tree.nodes(root);
  linkData = tree.links(nodeData);

  // Normalize for fixed-depth and find maximum depth
  var maxDepth = 0;
  nodeData.forEach(function(d) {
    if (d.depth > maxDepth)
      maxDepth = d.depth;
    d.y = d.depth * 200;
  });
  updateWidth(maxDepth);

  // Selection
  nodes = svg.selectAll(".node"),
  links = svg.selectAll(".link");

  // Compute data join.
  nodes = nodes.data(nodeData, function(d) { return d.id; });
  links = links.data(linkData, function(d) { return d.source.id + "-" + d.target.id; });

  // Perform any needed updates
  nodes.select("text")
      .text(function(d) { return d.title; });

  // Perform any needed additions
  var nodeGroup = nodes.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + d.parent.previousX + "," + d.parent.previousY + ")";
      });

  nodeGroup.append("circle")
      .attr("fill", "whitesmoke")
      .attr("r", 4)
      .on("click", function() {
        toggleDisplay($(this).next());
      });

  nodeGroup.append("text")
      .attr("stroke", "none")
      .attr("y", 20)
      .text(function(d) { return d.title; })
      .attr("opacity", 0);

  // Add entering links in the parent’s old position.
  links.enter().insert("path", ".node")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: d.source.previousY, y: d.source.previousX};
        return diagonal({source: o, target: o});
      });

  // Transition nodes and links to their new positions.
  var t = svg.transition()
      .duration(duration);

  t.selectAll(".link")
      .attr("d", diagonal);

  t.selectAll(".node")
      .attr("transform", function(d) {
        d.previousX = d.y;
        d.previousY = d.x;
        return "translate(" + d.y + "," + d.x + ")";
      });
}
