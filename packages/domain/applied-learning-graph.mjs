function assertGraphRecord(record, type) {
  if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id) {
    throw new TypeError(`invalid ${type}`);
  }
}

export function projectGraph({ nodes = [], edges = [] } = {}) {
  const nodeIds = new Set();
  const projectedNodes = nodes.map((node) => {
    assertGraphRecord(node, 'graph node');
    if (nodeIds.has(node.id)) throw new Error(`duplicate graph node: ${node.id}`);
    nodeIds.add(node.id);
    return {
      data: {
        id: node.id,
        label: node.title ?? node.label ?? node.id,
        kind: node.kind ?? 'concept',
        status: node.status ?? 'draft',
        competencyIds: node.competencyIds ?? [],
        objectiveIds: node.objectiveIds ?? [],
        claimIds: node.claimIds ?? [],
        referenceIds: node.referenceIds ?? []
      }
    };
  });

  const edgeIds = new Set();
  const projectedEdges = edges.map((edge) => {
    assertGraphRecord(edge, 'graph edge');
    if (edgeIds.has(edge.id)) throw new Error(`duplicate graph edge: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`unresolved graph edge: ${edge.id}`);
    }
    return {
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        relationship: edge.relationship ?? 'related-to',
        evidenceIds: edge.evidenceIds ?? []
      }
    };
  });

  return {
    nodes: projectedNodes,
    edges: projectedEdges,
    elements: [...projectedNodes, ...projectedEdges]
  };
}

export function graphNeighborhood(graph, nodeId) {
  const projected=projectGraph(graph);
  const edgeRows=projected.edges.filter(({data})=>data.source===nodeId||data.target===nodeId);
  const ids=new Set([nodeId]);
  for(const {data} of edgeRows){ ids.add(data.source); ids.add(data.target); }
  return {
    nodes: projected.nodes.filter(({data})=>ids.has(data.id)),
    edges: edgeRows
  };
}
