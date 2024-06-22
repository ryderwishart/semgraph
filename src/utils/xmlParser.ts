import { parseStringPromise } from 'xml2js';

// Define the types
type Node = {
  id: string;
  type: string;
  class: string;
  nuclearLemmas: string;
  values?: string;
};

type Edge = {
  source: string;
  target: string;
  type: string | null;
  function: string | null;
};

type GraphData = {
  nodes: { [key: string]: Node };
  edges: Edge[];
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

  return graph;
};
