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
      // Only occurs because of inconsistent Chrome API behavior.
    }

    // Create Node for the new tab and attach it to the attach Node.
    var newTabNode = document.createElement('li')
    newTabNode.id = tab.id;
    newTabNode.innerText = tab.title;
    newTabNode.appendChild(document.createElement('ul'));

    attachNode.getElementsByTagName('ul')[0].appendChild(newTabNode);

    // addNode(parentIdForTree, newTabNode.id); // TREE CODE
    addNode(attachNode.id, newTabNode.id); // TREE CODE
  }
});

//
// TREE Initialization
//
function initialize() {
  width = 960,
  height = 500;

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

//
// TREE Node Addition
//
function addNode(parentId, newId) {

  // Create a new node
  var newNode = {id: newId};

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

  // Recalculate layouts with new node added
  nodeData = tree.nodes(root);
  linkData = tree.links(nodeData);

  // Compute data join.
  nodes = nodes.data(nodeData, function(d) { return d.id; });
  links = links.data(linkData, function(d) { return d.source.id + "-" + d.target.id; });

  // Add entering nodes in the parent’s old position.
  nodes.enter().append("circle")
      .attr("class", "node")
      .attr("r", 3)
      .attr("cx", function(d) { return d.parent.previousX; })
      .attr("cy", function(d) { return d.parent.previousY; });

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
      .attr("cx", function(d) { return d.previousX = d.y; })
      .attr("cy", function(d) { return d.previousY = d.x; });
}

// Initialize the tree

document.addEventListener('DOMContentLoaded', function() {
  initialize();
});
