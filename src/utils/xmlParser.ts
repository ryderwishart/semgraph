import { parseStringPromise } from 'xml2js';
import { addNodeToDB, addEdgeToDB, removeNodeFromDB, removeEdgeFromDB, getGraphDataFromDB } from './dbOperations';

// Define the types
export type Node = {
  id: string;
  type: string;
  class: string;
  nuclearLemmas: string;
  values?: string;
};

export type Edge = {
  id: string;
  source: string;
  target: string;
  type: string | null;
  function: string | null;
};

export type GraphData = {
  nodes: { [key: string]: Node };
  edges: Edge[];
};

const storeGraphInIndexedDB = async (graph: GraphData): Promise<void> => {
  const existingGraph = await getGraphDataFromDB();

  // Remove nodes that exist in the database but not in the new graph
  for (const nodeId in existingGraph.nodes) {
    if (!graph.nodes[nodeId]) {
      await removeNodeFromDB(nodeId);
    }
  }

  // Remove edges that exist in the database but not in the new graph
  for (const edge of existingGraph.edges) {
    if (!graph.edges.some(e => e.source === edge.source && e.target === edge.target)) {
      await removeEdgeFromDB(edge.id);
    }
  }

  // Add or update nodes
  for (const node of Object.values(graph.nodes)) {
    await addNodeToDB(node);
  }

  // Add or update edges
  for (const edge of graph.edges) {
    await addEdgeToDB(edge);
  }
};

export const parseXML = async (xml: string): Promise<GraphData> => {
  const result = await parseStringPromise(xml);

  const graph: GraphData = {
    nodes: {},
    edges: []
  };

  function processNode(node: any, parentId: string | null = null) {
    const nodeId = node.$.id || `node_${Object.keys(graph.nodes).length}`;

    graph.nodes[nodeId] = {
      id: nodeId,
      type: node.$.type,
      class: node.$.class,
      nuclearLemmas: node.$.nuclear_lemmas,
      values: node.$.values
    };

    if (parentId) {
      graph.edges.push({
        id: `edge_${Object.keys(graph.edges).length}`,
        source: parentId,
        target: nodeId,
        type: node.edge ? node.edge[0].$.type : null,
        function: node.edge ? node.edge[0].$.function : null
      });
    }

    if (node.node) {
      node.node.forEach((childNode: any) => processNode(childNode, nodeId));
    }

    if (node.edge && node.edge[0].node) {
      node.edge[0].node.forEach((childNode: any) => processNode(childNode, nodeId));
    }
  }

  processNode(result.OpenText.text[0].node[0]);

  await storeGraphInIndexedDB(graph);

  return graph;
};
