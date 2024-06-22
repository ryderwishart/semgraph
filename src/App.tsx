import React, { useState } from 'react';
import FileSelector from './components/FileSelector';
import GraphDisplay from './components/GraphDisplay';
import { parseXML } from './utils/xmlParser';
interface Node {
  id: string;
  label: string;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileSelect = async (fileContents: string | string[]) => {
    setLoading(true);
    setError(null);

    try {
      let parsedData: GraphData;
      if (Array.isArray(fileContents)) {
        const parsedFiles = await Promise.all(
          fileContents.map((content) => parseXML(content)),
        );
        parsedData = parsedFiles.reduce(
          (acc, curr) => ({
            nodes: [...acc.nodes, ...curr.nodes],
            edges: [...acc.edges, ...curr.edges],
          }),
          { nodes: [], edges: [] },
        );
      } else {
        parsedData = await parseXML(fileContents);
      }

      setGraphData(parsedData);
    } catch (err: any) {
      setError('Error parsing XML file(s): ' + (err.message || err));
      setGraphData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Graph Visualization</h1>
      <FileSelector onFileSelect={handleFileSelect} />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {graphData && <GraphDisplay graphData={graphData} />}
    </div>
  );
};

export default App;
