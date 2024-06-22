import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { NetworkGraphData } from '../App';

// Keep existing interfaces (Node, Edge, GraphData, Filters)
interface Node {
  id: string;
  type: string;
  class: string;
  nuclearLemmas: string;
  values?: string;
  x?: number;
  y?: number;
}

interface Edge {
  source: string;
  target: string;
  type: string | null;
  function: string | null;
}

interface GraphData {
  nodes: { [key: string]: Node };
  edges: Edge[];
}

interface Filters {
  nodes: string[];
  edges: string[];
}

interface GraphDisplayProps {
  graphData: NetworkGraphData;
  selectedWords: string[];
}

const GraphDisplay: React.FC<GraphDisplayProps> = ({ graphData, selectedWords }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [filters, setFilters] = useState<Filters>({ nodes: [], edges: [] });
  const [egoCenter, setEgoCenter] = useState<string | null>(null);
  const [egoDepth, setEgoDepth] = useState<number>(1);

  // Set the first node as the default ego center
  useEffect(() => {
    if (graphData && graphData.nodes) {
      const nodeIds = Object.keys(graphData.nodes);
      if (nodeIds.length > 0) {
        setEgoCenter(nodeIds[0]);
      } else {
        setEgoCenter(null);
      }
    }
  }, [graphData]);

  const uniqueNodeTypes = useMemo(() => {
    if (!graphData || !graphData.nodes) return [];
    return [
      ...new Set(Object.values(graphData.nodes).map((node) => node.type)),
    ];
  }, [graphData]);

  const filteredData = useMemo(() => {
    let nodes = Object.values(graphData?.nodes || {});
    let edges = graphData?.edges || [];

    if (filters.nodes.length > 0) {
      nodes = nodes.filter((node) => filters.nodes.includes(node.type));
    }

    if (filters.edges.length > 0) {
      edges = edges.filter((edge) => filters.edges.includes(edge.type || ''));
    }

    if (egoCenter) {
      const egoNodes = new Set<string>([egoCenter]);
      const egoEdges = new Set<Edge>();

      const addNodesAndEdges = (nodeId: string, currentDepth: number) => {
        if (currentDepth > egoDepth) return;

        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            egoEdges.add(edge);
            if (!egoNodes.has(edge.target)) {
              egoNodes.add(edge.target);
              addNodesAndEdges(edge.target, currentDepth + 1);
            }
          } else if (edge.target === nodeId) {
            egoEdges.add(edge);
            if (!egoNodes.has(edge.source)) {
              egoNodes.add(edge.source);
              addNodesAndEdges(edge.source, currentDepth + 1);
            }
          }
        });
      };

      addNodesAndEdges(egoCenter, 0);

      nodes = nodes.filter((node) => egoNodes.has(node.id));
      edges = Array.from(egoEdges);
    }

    return { nodes, edges };
  }, [graphData, filters, egoCenter, egoDepth]);

  useEffect(() => {
    if (!filteredData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svg.node()?.getBoundingClientRect().width || 800;
    const height = svg.node()?.getBoundingClientRect().height || 600;

    const simulation = d3
      .forceSimulation(filteredData.nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3.forceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>(filteredData.edges).id((d) => (d as Node).id),
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append('g')
      .selectAll('line')
      .data(filteredData.edges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    const nodeGroup = svg
      .append('g')
      .selectAll('g')
      .data(filteredData.nodes)
      .enter()
      .append('g');

    nodeGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', (d) => 
        selectedWords.includes(d.nuclearLemmas) ? '#ff0000' : 
        (d.id === egoCenter ? '#ff8c00' : '#1f77b4')
      );

    nodeGroup
      .append('text')
      .attr('dy', -10)
      .attr('text-anchor', 'middle')
      .text((d) => d.type)
      .attr('font-size', '10px');

    nodeGroup
      .append('text')
      .attr('dy', 15)
      .attr('text-anchor', 'middle')
      .text((d) => d.nuclearLemmas)
      .attr('font-size', '8px')
      .attr('fill', '#666');

    link.append('title').text((d) => d.type || '');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as unknown as Node).x ?? 0)
        .attr('y1', (d) => (d.source as unknown as Node).y ?? 0)
        .attr('x2', (d) => (d.target as unknown as Node).x ?? 0)
        .attr('y2', (d) => (d.target as Node).y ?? 0);

      nodeGroup.attr('transform', (d) => `translate(${(d as Node).x ?? 0},${(d as Node).y ?? 0})`);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        svg.selectAll('g').attr('transform', event.transform.toString());
      });

    svg.call(zoom);
  }, [filteredData, egoCenter, selectedWords]);

  const handleFilterChange = (type: 'nodes' | 'edges', value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: prevFilters[type].includes(value)
        ? prevFilters[type].filter((item) => item !== value)
        : [...prevFilters[type], value],
    }));
  };

  const handleEgoCenterChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setEgoCenter(event.target.value || null);
  };

  const handleEgoDepthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEgoDepth(parseInt(event.target.value));
  };

  return (
    <div className="graph-display">
      <h2>Graph Visualization</h2>
      <div>
        <h3>Node Filters</h3>
        {uniqueNodeTypes.map((type, index) => (
          <label key={`${type}-${index}`}>
            <input
              type="checkbox"
              checked={filters.nodes.includes(type)}
              onChange={() => handleFilterChange('nodes', type)}
            />
            {type}
          </label>
        ))}
      </div>
      <div>
        <h3>Ego Graph</h3>
        <select onChange={handleEgoCenterChange} value={egoCenter || ''}>
          <option value="">View full graph</option>
          {Object.values(graphData.nodes).map((node) => (
            <option key={node.id} value={node.id}>
              {node.type} ({node.id})
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          max="5"
          value={egoDepth}
          onChange={handleEgoDepthChange}
        />
      </div>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
};

export default GraphDisplay;
