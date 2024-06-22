import React, { useState, useEffect } from 'react';
import FileSelector from './components/FileSelector';
import GraphDisplay from './components/GraphDisplay';
import TextPanel from './components/TextPanel';
import ControlPanel from './components/ControlPanel';
import { parseXML, GraphData } from './utils/xmlParser';
import { getGraphDataFromDB } from './utils/dbOperations';
import './App.css';

interface Node {
  id: string;
  nuclearLemmas: string;
  type: string;
  class: string;
  label?: string; // Make label optional
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

export interface NetworkGraphData {
  nodes: { [key: string]: Node };
  edges: Edge[];
}

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [text, setText] = useState<string>('');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      try {
        const data = await getGraphDataFromDB();
        setGraphData(data as NetworkGraphData);
        setText(
          Object.values(data.nodes)
            .map((node) => node.nuclearLemmas)
            .join(' '),
        );
      } catch (error) {
        console.error('Error fetching graph data:', error);
        setError('Error fetching graph data');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  const handleWordSelect = (word: string) => {
    setSelectedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word],
    );
  };

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
            nodes: { ...acc.nodes, ...curr.nodes },
            edges: [...acc.edges, ...curr.edges],
          }),
          { nodes: {}, edges: [] },
        );
      } else {
        parsedData = await parseXML(fileContents);
      }

      setGraphData(parsedData as NetworkGraphData);
      setText(
        Object.values(parsedData.nodes)
          .map((node) => node.nuclearLemmas)
          .join(' '),
      );
    } catch (err) {
      setError(
        'Error parsing XML file(s): ' +
          (err instanceof Error ? err.message : String(err)),
      );
      setGraphData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportGraph = () => {
    if (!graphData) return;

    const exportData = {
      nodes: Object.values(graphData.nodes).filter((node) =>
        selectedWords.includes(node.nuclearLemmas),
      ),
      edges: graphData.edges.filter(
        (edge) =>
          selectedWords.includes(graphData.nodes[edge.source].nuclearLemmas) &&
          selectedWords.includes(graphData.nodes[edge.target].nuclearLemmas),
      ),
    };
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(exportData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'semantic_graph.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Semantic Graph Visualization</h1>
        <FileSelector onFileSelect={handleFileSelect} />
      </header>
      {loading && <div className="loading-overlay">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      <main className="app-main">
        <TextPanel
          text={text}
          onWordSelect={handleWordSelect}
          selectedWords={selectedWords}
        />
        {graphData && (
          <GraphDisplay graphData={graphData} selectedWords={selectedWords} />
        )}
      </main>
      <ControlPanel
        selectedWords={selectedWords}
        onClear={() => setSelectedWords([])}
        onExport={handleExportGraph}
      />
    </div>
  );
};

export default App;
