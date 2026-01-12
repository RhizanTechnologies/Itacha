import Graph from "graphology";

export function loadMockGraph(graph: Graph) {
  // Clear existing
  graph.clear();

  // Settings
  const NODE_COUNT = 100;
  const CLUSTERS = 5;

  // Colors
  const COLORS = [
    "#F94144", // Red
    "#F3722C", // Orange
    "#F9C74F", // Yellow
    "#90BE6D", // Green
    "#43AA8B", // Teal
  ];

  // Create Nodes
  for (let i = 0; i < NODE_COUNT; i++) {
    const cluster = Math.floor(Math.random() * CLUSTERS);
    const angle = (Math.PI * 2 * i) / NODE_COUNT;
    const radius = Math.random() * 100 + cluster * 50; // Distribute by cluster

    graph.addNode(i, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: Math.random() * 10 + 3,
      label: `Paper ${i}`,
      color: COLORS[cluster],
      cluster: cluster,
    });
  }

  // Create Edges
  // Connect within clusters tightly
  graph.forEachNode((node, attr) => {
    // Connect to 2 random nodes in same cluster
    for (let k = 0; k < 2; k++) {
      const target = Math.floor(Math.random() * NODE_COUNT);
      if (target !== Number(node)) {
        // Use mergeEdgeWithKey to handle duplicates gracefully
        graph.mergeEdgeWithKey(`${node}-${target}`, node, target, {
          size: 1,
          color: "#e5e7eb", // Light gray
          type: "arrow",
        });
      }
    }
  });

  console.log(
    `Graph loaded with ${graph.order} nodes and ${graph.size} edges.`
  );
  return graph;
}
