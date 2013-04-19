// --------------------------------------------------------
// SETUP

$(window).ready(updateHeight);
$(window).resize(updateHeight);

document.addEventListener('DOMContentLoaded', function() {
  initialize();
});

function updateHeight()
{
  // update the height of the svg container div
  var windowHeight = $(window).height() - 96;
  // var div = $('#tree');
  // div.css('height', windowHeight);
  $('#tree').attr('height', windowHeight);

  // update the height of the root svg element
  var adjustedHeight = $(window).height() - 96;
  $("#tree svg").attr("height", adjustedHeight);

  // update the size attribute of the tree for accurate layout
  //    recalculations
  tree.size([adjustedHeight, width]);

  renderTree();
}

function updateWidth(maxDepth) {
  $("#tree svg").attr("width", 180 * maxDepth + 100);
}


//
// Setup event listener
//
chrome.tabs.onUpdated.addListener(function(tabId, updates, tab) {

  // Is the node for this tab already in the tree?
  currentNode = document.getElementById(tab.id);

  if(updates.status == 'complete' &&
     tab.title != 'New Tab' && tab.title != 'Browse Tree' &&
     currentNode == null) {

    // TESTING
    console.log('TAB: ' + tab.id + ' OID: ' + tab.openerTabId);

    // var parentIdForTree = 0; // TREE CODE

    var attachNode = document.getElementById('log');
    var openerTabNode = document.getElementById(tab.openerTabId);

    if(openerTabNode != null) {
      attachNode = openerTabNode;
      // parentIdForTree = openerTabNode.id; // TREE CODE
    } else {
      // Parent Node was never created. Create it.
      // Occurs due to inconsistent Chrome API behavior.
    }

    // Create Node for the new tab and attach it to the attach Node.
    var newTabNode = document.createElement('li');
    newTabNode.id = tab.id;
    newTabNode.innerText = tab.title;
    newTabNode.appendChild(document.createElement('ul'));

    attachNode.getElementsByTagName('ul')[0].appendChild(newTabNode);

    // addNode(parentIdForTree, newTabNode.id); // TREE CODE
    addNode(attachNode.id, newTabNode.id, tab.title); // TREE CODE
  }
});

// --------------------------------------------------------
// TREE Initialization
//
function initialize() {
  width = 960;
  height = 600;

  tree = d3.layout.tree()
    .size([height - 20, width - 20]);

  // Initial node data and layout
  root = {};
  nodeData = tree.nodes(root);

  root.parent = root;
  root.previousX = root.y;
  root.previousY = root.x;

  diagonal = d3.svg.diagonal()
      .projection(function(d)
        {
          return [d.y, d.x];
        });

  svg = d3.select("#tree").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(10,10)");

  // Selection
  nodes = svg.selectAll(".node"),
  links = svg.selectAll(".link");

  duration = 750;
}

// --------------------------------------------------------
// TREE Node Addition
//
function addNode(parentId, newId, newTitle) {

  // TESTING
  tree.size([$(window).height() - 96, width - 20]);;

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

  renderTree();
}

// update
function renderTree() {
  // Calculate Layout
  nodeData = tree.nodes(root);
  linkData = tree.links(nodeData);

  // Normalize for fixed-depth and find maximum depth
  var maxDepth = 0;
  nodeData.forEach(function(d) {
    if (d.depth > maxDepth)
      maxDepth = d.depth;
    d.y = d.depth * 180;
  });
  updateWidth(maxDepth);

  // Compute data join.
  nodes = nodes.data(nodeData, function(d) { return d.id; });
  links = links.data(linkData, function(d) { return d.source.id + "-" + d.target.id; });

  // Create and add nodes to hold and display data
  var nodeGroup = nodes.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + d.parent.previousX + "," + d.parent.previousY + ")";
      });

  nodeGroup.append("circle")
      .attr("fill", "whitesmoke")
      .attr("r", 3);

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
