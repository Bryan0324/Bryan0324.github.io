import React, { useEffect, useRef, useState, useMemo } from 'react'
import cytoscape from 'cytoscape'

// ============================================================================
// Constants
// ============================================================================

const GRAPH_CONFIG = {
  nodes: [0, 1, 2, 3, 4],
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 1], // back edge
    [0, 4],
    [4, 2], // forward / cross
  ]
}

const EDGE_TYPES = {
  TREE: 'tree',
  BACK: 'back',
  FORWARD: 'forward',
  CROSS: 'cross'
}

const COLORS = {
  node: '#60a5fa',
  edgeDefault: '#9ca3af',
  tree: '#22c55e',
  back: '#ef4444',
  forward: '#3b82f6',
  cross: '#a855f7'
}

const STYLES = {
  container: {
    width: '100%',
    height: '420px',
    border: '1px solid #ddd',
    display: 'block',
    position: 'relative'
  },
  controls: {
    marginTop: 8
  },
  button: {
    marginLeft: 8
  }
}

const NODE_STATE = {
  UNVISITED: 0,
  VISITING: 1,
  VISITED: 2
}

// ============================================================================
// DFS Algorithm - Tarjan's Edge Classification
// ============================================================================

/**
 * Performs DFS traversal and classifies edges as tree, back, forward, or cross.
 * This is the foundation for Tarjan's algorithm visualization.
 */
function classifyEdges(nodes, edges) {
  let time = 0
  const dfn = {} // discovery time for each node
  const state = {} // current state of each node
  const adj = {} // adjacency list representation
  const events = [] // sequence of edge classification events

  // Initialize data structures
  nodes.forEach(v => {
    adj[v] = []
    state[v] = NODE_STATE.UNVISITED
  })
  edges.forEach(([u, v]) => adj[u].push(v))

  /**
   * Depth-first search traversal
   */
  function dfs(u) {
    dfn[u] = ++time
    state[u] = NODE_STATE.VISITING

    for (const v of adj[u]) {
      const edgeId = `${u}-${v}`

      if (state[v] === NODE_STATE.UNVISITED) {
        // Tree edge: leads to undiscovered node
        events.push({ id: edgeId, type: EDGE_TYPES.TREE })
        dfs(v)
      } else if (state[v] === NODE_STATE.VISITING) {
        // Back edge: leads to ancestor in DFS tree
        events.push({ id: edgeId, type: EDGE_TYPES.BACK })
      } else {
        // Forward or cross edge: leads to descendant or sibling
        if (dfn[v] > dfn[u]) {
          events.push({ id: edgeId, type: EDGE_TYPES.FORWARD })
        } else {
          events.push({ id: edgeId, type: EDGE_TYPES.CROSS })
        }
      }
    }

    state[u] = NODE_STATE.VISITED
  }

  // Process all unvisited nodes to handle disconnected components
  for (const node of nodes) {
    if (state[node] === NODE_STATE.UNVISITED) {
      dfs(node)
    }
  }

  return events
}

// ============================================================================
// Cytoscape Configuration
// ============================================================================

/**
 * Creates and configures the Cytoscape graph visualization
 */
function createCytoscapeInstance(container, nodes, edges) {
  const nodeElements = nodes.map(id => ({ data: { id: String(id) } }))
  const edgeElements = edges.map(([u, v]) => ({
    data: { id: `${u}-${v}`, source: String(u), target: String(v) }
  }))

  const styles = [
    {
      selector: 'node',
      style: {
        'background-color': COLORS.node,
        'label': 'data(id)',
        'font-size': 14,
        'color': '#000'
      }
    },
    {
      selector: 'edge',
      style: {
        'line-color': COLORS.edgeDefault,
        'target-arrow-shape': 'triangle',
        'target-arrow-color': COLORS.edgeDefault,
        'width': 2
      }
    },
    { selector: `.${EDGE_TYPES.TREE}`, style: { 'line-color': COLORS.tree, 'width': 4 } },
    { selector: `.${EDGE_TYPES.BACK}`, style: { 'line-color': COLORS.back, 'width': 4 } },
    { selector: `.${EDGE_TYPES.FORWARD}`, style: { 'line-color': COLORS.forward, 'width': 4 } },
    { selector: `.${EDGE_TYPES.CROSS}`, style: { 'line-color': COLORS.cross, 'width': 4 } }
  ]

  return cytoscape({
    container,
    elements: [...nodeElements, ...edgeElements],
    style: styles,
    layout: {
      name: 'breadthfirst',
      directed: true,
      roots: ['0']
    }
  })
}

// ============================================================================
// Control Component
// ============================================================================

function Controls({ onNext, onReset, isComplete }) {
  return (
    <div style={STYLES.controls}>
      <button onClick={onNext} disabled={isComplete}>
        Next
      </button>
      <button onClick={onReset} style={STYLES.button}>
        Reset
      </button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function TarjanVisualization() {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Memoize edge classification events
  const events = useMemo(() => 
    classifyEdges(GRAPH_CONFIG.nodes, GRAPH_CONFIG.edges),
    []
  )

  // Ensure component is mounted before initializing Cytoscape
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize Cytoscape when mounted and container is ready
  useEffect(() => {
    if (!mounted || !containerRef.current) return

    // Add a small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      if (!containerRef.current) return

      try {
        console.log('Initializing Cytoscape...')
        cyRef.current = createCytoscapeInstance(
          containerRef.current,
          GRAPH_CONFIG.nodes,
          GRAPH_CONFIG.edges
        )
        console.log('Cytoscape initialized successfully')
      } catch (error) {
        console.error('Failed to initialize Cytoscape:', error)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [mounted])

  const handleNextStep = () => {
    if (!cyRef.current || step >= events.length) return

    const event = events[step]
    cyRef.current.getElementById(event.id).addClass(event.type)
    setStep(step + 1)
  }

  const handleReset = () => {
    if (!cyRef.current) return

    cyRef.current
      .edges()
      .removeClass(EDGE_TYPES.TREE)
      .removeClass(EDGE_TYPES.BACK)
      .removeClass(EDGE_TYPES.FORWARD)
      .removeClass(EDGE_TYPES.CROSS)
    setStep(0)
  }

  const isComplete = step >= events.length

  return (
    <div>
      <div ref={containerRef} style={STYLES.container} />
      <Controls 
        onNext={handleNextStep} 
        onReset={handleReset} 
        isComplete={isComplete} 
      />
    </div>
  )
}