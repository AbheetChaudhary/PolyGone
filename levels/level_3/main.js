// Sample graph data (nodes and links)
const graphData = {
  nodes: [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 },
    // Add more nodes as needed
  ],
  links: [
    { source: 1, target: 2 },
    { source: 1, target: 6 },
    { source: 2, target: 3 },
    { source: 2, target: 4 },
    { source: 2, target: 6 },
    { source: 3, target: 4 },
    { source: 4, target: 5 },
    { source: 4, target: 6 },
    { source: 5, target: 6 },
    // Define links between nodes
  ],
};

// Dimensions for the SVG container
const width = 800;
const height = 800;

// Create an SVG container
const svg = d3.select("#graph").attr("width", width).attr("height", height);

// Create the simulation for the graph
const simulation = d3
  .forceSimulation(graphData.nodes)
  .force(
    "link",
    d3
      .forceLink(graphData.links)
      .id((d) => d.id)
      .distance(100),
  )
  .force("charge", d3.forceManyBody().strength(-1000))
  .force("center", d3.forceCenter(width / 2, height / 2));

// Add drag functionality to nodes
const dragHandler = d3
  .drag()
  .on("start", (event, d) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  })
  .on("drag", (event, d) => {
    d.fx = event.x;
    d.fy = event.y;
  })
  .on("end", (event, d) => {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  });

// Create the links
const links = svg
  .selectAll("line")
  .data(graphData.links)
  .enter()
  .append("line")
  .attr("stroke", "#999")
  .attr("stroke-width", 10);

// Create the nodes
const nodes = svg
  .selectAll("circle")
  .data(graphData.nodes)
  .enter()
  .append("circle")
  .attr("r", 20)
  .attr("fill", "skyblue");

nodes.call(dragHandler);

// Update positions of nodes and links in the simulation
simulation.on("tick", () => {
  links
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
});

let selectedLinks = []; // To keep track of selected links
let chainFormed = false; // Flag to track if a closed chain has been formed

// Function to handle link selection
function handleLinkClick(d) {
  const linkData = d.srcElement.__data__;
  const linkElement = d3.select(this);
  console.log("Clicked link data: ", linkData);

  // Check if the link is already selected
  const isSelected = selectedLinks.some(
    (link) =>
      (link.source.id === linkData.source.id &&
        link.target.id === linkData.target.id) ||
      (link.target.id === linkData.source.id &&
        link.source.id === linkData.target.id),
  );

  if (!isSelected) {
    if (chainFormed) {
      console.log("Chain has formed. Can't selected an unselected link");
      return;
    }
    if (
      selectedLinks.length > 0 &&
      !isLinkConnectedToSelected(linkData, selectedLinks)
    ) {
      console.log("Link not connected to Chain");
      console.log("Selected links: ", selectedLinks);
      return;
    }
    selectedLinks.push(linkData);
    if (hasClosedChain(selectedLinks)) {
      console.log("Chain has formed");
      chainFormed = true;
      removeChainButton.attr("disabled", null); // Enable the Remove Chain button
    }
    console.log("Updated selected links: ", selectedLinks);
    linkElement.classed("selected", true).attr("stroke", "orange");
  } else {
    selectedLinks = selectedLinks.filter(
      (link) =>
        !(
          (link.source.id === linkData.source.id &&
            link.target.id === linkData.target.id) ||
          (link.target.id === linkData.source.id &&
            link.source.id === linkData.target.id)
        ),
    );
    console.log("Updated selected links: ", selectedLinks);
    linkElement.classed("selected", false).attr("stroke", "#999");
    if (!hasClosedChain(selectedLinks)) {
      console.log("Chain is broken formed");
      chainFormed = false;
      removeChainButton.attr("disabled", "disabled"); // Enable the Remove Chain button
    }
  }
}

function hasClosedChain(links) {
  if (links.length === 0) {
    return false; // No links, hence no closed chain
  }

  const adjacencyList = {}; // Create an adjacency list to represent the graph

  // Build the adjacency list from the selected links
  links.forEach((link) => {
    if (!adjacencyList[link.source.id]) {
      adjacencyList[link.source.id] = [];
    }
    if (!adjacencyList[link.target.id]) {
      adjacencyList[link.target.id] = [];
    }
    adjacencyList[link.source.id].push(link.target.id);
    adjacencyList[link.target.id].push(link.source.id);
  });

  // Depth-first search (DFS) to check for a closed chain
  function dfs(node, parent, visited) {
    visited.add(node);
    for (const neighbor of adjacencyList[node]) {
      if (neighbor !== parent) {
        if (visited.has(neighbor)) {
          return true; // Found a closed chain
        }
        if (dfs(neighbor, node, visited)) {
          return true;
        }
      }
    }
    return false;
  }

  // Check if adding the last selected link forms a closed chain
  const lastLink = links[links.length - 1];
  return dfs(lastLink.source.id, -1, new Set());
}

function isLinkConnectedToSelected(link, selectedLinks) {
  return selectedLinks.some(
    (selectedLink) =>
      selectedLink.source.id === link.source.id ||
      selectedLink.source.id === link.target.id ||
      selectedLink.target.id === link.source.id ||
      selectedLink.target.id === link.target.id,
  );
}

// Add click event listener to links for selection
const linkElements = links.nodes();
linkElements.forEach((link) => {
  d3.select(link).on("click", function (d) {
    handleLinkClick.call(this, d);
  });
});

// Function to reset selected links
function resetSelection() {
  // Decolorize selected links
  console.log("Inside reset selection");
  svg.selectAll("line").each(function (d) {
    const link = d;
    if (
      selectedLinks.some(
        (selectedLink) =>
          (link.source.id === selectedLink.source.id &&
            link.target.id === selectedLink.target.id) ||
          (link.target.id === selectedLink.source.id &&
            link.source.id === selectedLink.target.id),
      )
    ) {
      d3.select(this).attr("stroke", "#999");
    }
  });

  // Empty selected links list
  selectedLinks = [];
}

// Function to remove the selected chain
function removeChain() {
  if (selectedLinks.length > 0) {
    const closedChainLinks = []; // Store links forming the closed chain

    // Check for the closed chain within the selected links
    for (let i = 0; i < selectedLinks.length; i++) {
      const linksWithoutCurrent = selectedLinks
        .slice(0, i)
        .concat(selectedLinks.slice(i + 1));
      if (!hasClosedChain(linksWithoutCurrent)) {
        closedChainLinks.push(selectedLinks[i]);
      }
    }

    // Remove links from the graph data
    graphData.links = graphData.links.filter(
      (link) =>
        !closedChainLinks.some(
          (closedLink) =>
            (link.source.id === closedLink.source.id &&
              link.target.id === closedLink.target.id) ||
            (link.target.id === closedLink.source.id &&
              link.source.id === closedLink.target.id),
        ),
    );

    // Get the nodes connected to the remaining links
    const nodesConnectedToLinks = new Set();
    graphData.links.forEach((link) => {
      nodesConnectedToLinks.add(link.source.id).add(link.target.id);
    });

    // Remove nodes that are not connected to any links
    graphData.nodes = graphData.nodes.filter(
      (node) =>
        nodesConnectedToLinks.has(node.id) ||
        selectedLinks.some(
          (link) => link.source.id === node.id || link.target.id === node.id,
        ),
    );

    // Remove links from the SVG
    svg.selectAll("line").each(function (d) {
      const link = d;
      if (
        closedChainLinks.some(
          (closedLink) =>
            (link.source.id === closedLink.source.id &&
              link.target.id === closedLink.target.id) ||
            (link.target.id === closedLink.source.id &&
              link.source.id === closedLink.target.id),
        )
      ) {
        d3.select(this).remove();
      }
    });

    // Remove nodes from the SVG
    svg.selectAll("circle").each(function (d) {
      const node = d;
      if (!nodesConnectedToLinks.has(node.id)) {
        d3.select(this).remove();
      }
    });

    resetSelection();
  } else {
    console.log("No links selected to remove.");
  }

  chainFormed = false;
  removeChainButton.attr("disabled", "disabled"); // Disable the Remove Chain button
}

// Example: Create a button to remove selected chain
const removeChainButton = d3
  .select("body")
  .append("button")
  .text("Remove Chain")
  .attr("disabled", "disabled"); // Initially disable the button
removeChainButton.on("click", removeChain);
