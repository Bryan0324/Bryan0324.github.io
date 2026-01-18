import React, { useEffect, useRef, useState, useMemo, CSSProperties } from 'react'
import cytoscape, { Core } from 'cytoscape'

// ============================================================================
// Types
// ============================================================================

type ColorPalette = {
  node: string
  nodeVisiting: string
  nodeCurrent: string
  nodeVisited: string
  edgeDefault: string
  tree: string
  back: string
  forward: string
  cross: string
}

type Event = {
  id: string
  type: string
  status?: string
  parent?: number | null
}

type ControlsProps = {
  onNext: () => void
  onReset: () => void
  isComplete: boolean
  isDirected: boolean
  onToggleDirection: () => void
}

type LegendProps = {
  palette: ColorPalette
}

type LegendData = {
  type: string
  color: string
}

// ============================================================================
// Constants
// ============================================================================

const GRAPH_CONFIG = {
  nodes: [0, 1, 2, 3, 4, 5, 6, 7],
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 1], // back edge
    [0, 4],
    [4, 2], // forward / cross
    [4, 5],
    [5, 6],
    [6, 4], // back edge
    [5, 7],
    [0, 7]
  ] as Array<[number, number]>
}

const EDGE_TYPES = {
  TREE: 'tree',
  BACK: 'back',
  FORWARD: 'forward',
  CROSS: 'cross'
}

const DEFAULT_COLORS: ColorPalette = {
  node: '#60a5fa',
  nodeVisiting: '#fbbf24',
  nodeCurrent: '#f97316',
  nodeVisited: '#9ca3af',
  edgeDefault: '#9ca3af',
  tree: '#22c55e',
  back: '#ef4444',
  forward: '#3b82f6',
  cross: '#a855f7'
}

const STYLES: Record<string, CSSProperties | Record<string, CSSProperties>> = {
  container: {
    width: '100%',
    height: '420px',
    border: '1px solid #ddd',
    display: 'block',
    position: 'relative' as const
  },
  controls: {
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const
  },
  button: {
    marginLeft: 8
  },
  legend: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: 4
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14
  },
  legendItems: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 13
  },
  legendColor: {
    width: 20,
    height: 3,
    borderRadius: 2
  }
}

const NODE_STATE = {
  UNVISITED: 0,
  VISITING: 1,
  VISITED: 2
} as const

// ============================================================================
// DFS Algorithm - Tarjan's Edge Classification
// ============================================================================

function classifyEdges(
  nodes: number[],
  edges: Array<[number, number]>,
  isDirected: boolean = true
): Event[] {
  let time = 0
  const dfn: Record<number, number> = {} // discovery time for each node
  const state: Record<number, number> = {} // current state of each node
  const adj: Record<number, number[]> = {} // adjacency list representation
  const events: Event[] = [] // sequence of edge classification events
  const edgeIds = new Map<string, string>() // store original edge IDs
  // Initialize data structures
  nodes.forEach(v => {
    adj[v] = []
    state[v] = NODE_STATE.UNVISITED
  })
  
  // Build adjacency list
  edges.forEach(([u, v]) => {
    adj[u].push(v)
    edgeIds.set(`${u},${v}`, `${u}-${v}`)
    
    // For undirected graphs, add reverse edge
    if (!isDirected) {
      adj[v].push(u)
      edgeIds.set(`${v},${u}`, `${u}-${v}`) // use same edge ID
    }
  })

  /**
   * Depth-first search traversal
   */
  function dfs(u: number, fa: number | null = null) {
    dfn[u] = ++time
    state[u] = NODE_STATE.VISITING
    events.push({ id: String(u), type: 'node', status: 'visiting', parent: fa })
    
    for (const v of adj[u]) {
      const edgeId = edgeIds.get(`${u},${v}`)
      if(v === fa && !isDirected) {
        // Ignore the edge leading back to parent in undirected graph
        continue
      }
      if (state[v] === NODE_STATE.UNVISITED) {
        // Tree edge: leads to undiscovered node
        events.push({ id: edgeId as string, type: EDGE_TYPES.TREE })
        dfs(v, u)
      } else {
        if (state[v] === NODE_STATE.VISITING) {
          // Back edge: leads to ancestor in DFS tree
          events.push({ id: edgeId as string, type: EDGE_TYPES.BACK })
        } else if (isDirected) {
          if (dfn[v] > dfn[u]) {
            events.push({ id: edgeId as string, type: EDGE_TYPES.FORWARD })
          } else {
            events.push({ id: edgeId as string, type: EDGE_TYPES.CROSS })
          }
        }
      }
    }

    state[u] = NODE_STATE.VISITED
    events.push({ id: String(u), type: 'node', status: 'visited', parent: fa })
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
function createCytoscapeInstance(
  container: HTMLElement,
  nodes: number[],
  edges: Array<[number, number]>,
  isDirected: boolean,
  palette: ColorPalette
): Core {
  const nodeElements = nodes.map(id => ({ data: { id: String(id) } }))
  const edgeElements = edges.map(([u, v]) => ({
    data: { id: `${u}-${v}`, source: String(u), target: String(v) }
  }))

  const styles = [
    {
      selector: 'node',
      style: {
        'background-color': palette.node,
        'label': 'data(id)',
        'font-size': 16,
        'color': '#afff2e'
      }
    },
    {
      selector: 'node.visiting',
      style: {
        'background-color': palette.nodeVisiting
      }
    },
    {
      selector: 'node.visited',
      style: {
        'background-color': palette.nodeVisited
      }
    },
    {
      selector: 'node.current',
      style: {
        'background-color': palette.nodeCurrent,
        'border-width': 3,
        'border-color': '#ea580c',
        'box-shadow': `0 0 0 2px ${palette.nodeCurrent}`
      }
    },
    {
      selector: 'edge',
      style: {
        'line-color': palette.edgeDefault,
        'target-arrow-shape': isDirected ? 'triangle' : 'none',
        'curve-style': isDirected ? 'bezier' : 'straight',
        'target-arrow-color': palette.edgeDefault,
        'width': 2
      }
    },
    { 
      selector: `.${EDGE_TYPES.TREE}`, 
      style: { 
        'line-color': palette.tree, 
        'target-arrow-color': palette.tree, 
        'target-arrow-shape': isDirected ? 'triangle' : 'none',
        'curve-style': isDirected ? 'bezier' : 'straight',
        'width': 4 
      } 
    },
    { 
      selector: `.${EDGE_TYPES.BACK}`, 
      style: { 
        'line-color': palette.back, 
        'target-arrow-color': palette.back, 
        'target-arrow-shape': isDirected ? 'triangle' : 'none',
        'curve-style': isDirected ? 'bezier' : 'straight',
        'width': 4 
      } 
    },
    { 
      selector: `.${EDGE_TYPES.FORWARD}`, 
      style: { 
        'line-color': palette.forward, 
        'target-arrow-color': palette.forward, 
        'target-arrow-shape': isDirected ? 'triangle' : 'none',
        'curve-style': isDirected ? 'bezier' : 'straight',
        'width': 4 
      } 
    },
    { 
      selector: `.${EDGE_TYPES.CROSS}`, 
      style: { 
        'line-color': palette.cross, 
        'target-arrow-color': palette.cross, 
        'target-arrow-shape': isDirected ? 'triangle' : 'none',
        'curve-style': isDirected ? 'bezier' : 'straight',
        'width': 4 
      } 
    }
  ]

  return cytoscape({
    container,
    elements: [...nodeElements, ...edgeElements],
    style: styles,
    layout: {
      name: 'breadthfirst',
      directed: isDirected,
      roots: ['0']
    }
  })
}

// ============================================================================
// Control Component
// ============================================================================

function Controls({ onNext, onReset, isComplete, isDirected, onToggleDirection }: ControlsProps) {
  return (
    <div style={STYLES.controls as CSSProperties}>
      <button onClick={onNext} disabled={isComplete}>
        下一步
      </button>
      <button onClick={onReset} style={STYLES.button as CSSProperties}>
        重置
      </button>
      <button onClick={onToggleDirection} style={STYLES.button as CSSProperties}>
        切換為{isDirected ? '無向圖' : '有向圖'}
      </button>
    </div>
  )
}

// ============================================================================
// Legend Component
// ============================================================================

function Legend({ palette }: LegendProps) {
  const legendData: LegendData[] = [
    { type: '樹邊 (Tree)', color: palette.tree },
    { type: '回邊 (Back)', color: palette.back },
    { type: '前向邊 (Forward)', color: palette.forward },
    { type: '橫跨邊 (Cross)', color: palette.cross }
  ]

  return (
    <div style={STYLES.legend as CSSProperties}>
      <div style={STYLES.legendTitle as CSSProperties}>邊的類型圖例</div>
      <div style={STYLES.legendItems as CSSProperties}>
        {legendData.map(({ type, color }) => (
          <div key={type} style={STYLES.legendItem as CSSProperties}>
            <div style={{ ...STYLES.legendColor, backgroundColor: color } as CSSProperties} />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function TarjanVisualization() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const [step, setStep] = useState<number>(0)
  const [mounted, setMounted] = useState<boolean>(false)
  const [isDirected, setIsDirected] = useState<boolean>(true)
  const [graphNodes, setGraphNodes] = useState<number[]>(GRAPH_CONFIG.nodes)
  const [graphEdges, setGraphEdges] = useState<Array<[number, number]>>(GRAPH_CONFIG.edges)
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_COLORS)
  const [nodeCountInput, setNodeCountInput] = useState<string>(String(GRAPH_CONFIG.nodes.length))
  const [edgesInput, setEdgesInput] = useState<string>(GRAPH_CONFIG.edges.map(([u, v]) => `${u} ${v}`).join('\n'))
  const [configError, setConfigError] = useState<string>('')

  // Memoize edge classification events
  const events = useMemo(() => 
    classifyEdges(graphNodes, graphEdges, isDirected),
    [graphNodes, graphEdges, isDirected]
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
          containerRef.current as HTMLElement,
          graphNodes,
          graphEdges,
          isDirected,
          palette
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
  }, [mounted, isDirected, graphNodes, graphEdges, palette])

  const handleNextStep = () => {
    if (!cyRef.current || step >= events.length) return

    const event = events[step]
    const element = cyRef.current.getElementById(event.id)
    
    if (event.type === 'node') {
      // Handle node state changes
      if (event.status === 'visiting') {
        // Remove current class from all nodes
        cyRef.current.nodes().removeClass('current')
        // Add visiting and current to this node
        element.removeClass('visited').addClass('visiting').addClass('current')
      } else if (event.status === 'visited') {
        // Remove current class from this node
        element.removeClass('visiting').removeClass('current').addClass('visited')
        // Add current class back to parent if it exists
        if (event.parent !== null && event.parent !== undefined) {
          const parentElement = cyRef.current.getElementById(String(event.parent))
          parentElement.addClass('current')
        }
      }
    } else {
      // Handle edge classification
      element.addClass(event.type)
    }
    
    setStep(step + 1)
  }

  const handleReset = () => {
    if (!cyRef.current) return

    // Reset edges
    cyRef.current
      .edges()
      .removeClass(EDGE_TYPES.TREE)
      .removeClass(EDGE_TYPES.BACK)
      .removeClass(EDGE_TYPES.FORWARD)
      .removeClass(EDGE_TYPES.CROSS)
    
    // Reset nodes
    cyRef.current
      .nodes()
      .removeClass('visiting')
      .removeClass('visited')
      .removeClass('current')
    
    setStep(0)
  }

  const handleToggleDirection = () => {
    const newDirection = !isDirected
    setIsDirected(newDirection)
    setStep(0)
    
    // Update arrow styles immediately
    if (cyRef.current) {
      const arrowShape = newDirection ? 'triangle' : 'none'
      cyRef.current.style()
        .selector('edge')
        .style({
          'target-arrow-shape': arrowShape
        })
        .update()
      
      // Update for each edge type
      Object.values(EDGE_TYPES).forEach(type => {
        cyRef.current!.style()
          .selector(`.${type}`)
          .style({
            'target-arrow-shape': arrowShape
          })
          .update()
      })
    }
  }

  const isComplete = step >= events.length

  return (
    <div>
      <div ref={containerRef} style={STYLES.container as CSSProperties} />
      <Controls 
        onNext={handleNextStep} 
        onReset={handleReset} 
        isComplete={isComplete}
        isDirected={isDirected}
        onToggleDirection={handleToggleDirection}
      />
      <div style={{ marginTop: 12, width: '100%' } as CSSProperties}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 } as CSSProperties}>自訂圖形</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' } as CSSProperties}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 } as CSSProperties}>
            <span>節點數量</span>
            <input
              type="number"
              min={1}
              value={nodeCountInput}
              onChange={e => setNodeCountInput(e.target.value)}
              style={{ width: 80 } as CSSProperties}
            />
          </label>
          <div style={{ flex: 1, minWidth: 280 } as CSSProperties}>
            <div style={{ marginBottom: 4 } as CSSProperties}>邊清單（每行一條，格式：u v）</div>
            <textarea
              value={edgesInput}
              onChange={e => setEdgesInput(e.target.value)}
              rows={6}
              style={{ width: '100%', fontFamily: 'monospace' } as CSSProperties}
            />
          </div>
        </div>
        {configError && (
          <div style={{ color: '#ef4444', marginTop: 8 } as CSSProperties}>{configError}</div>
        )}
        <div style={{ marginTop: 8 } as CSSProperties}>
          <button
            style={{ marginRight: 8 } as CSSProperties}
            onClick={() => {
              // Validate and apply configuration
              const n = parseInt(nodeCountInput, 10)
              if (isNaN(n) || n <= 0) {
                setConfigError('節點數量無效，請輸入正整數')
                return
              }
              // Build nodes
              const newNodes = Array.from({ length: n }, (_, i) => i)
              // Parse edges
              const lines = edgesInput.split(/\r?\n/)
              const parsed: Array<[number, number]> = []
              const seen = new Set<string>()
              for (const line of lines) {
                const m = line.trim().match(/^(\d+)\s+(\d+)$/)
                if (!m) continue
                const u = parseInt(m[1], 10)
                const v = parseInt(m[2], 10)
                if (isNaN(u) || isNaN(v)) continue
                if (u < 0 || u >= n || v < 0 || v >= n) continue
                const key = isDirected ? `${u}-${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`
                if (seen.has(key)) continue
                seen.add(key)
                parsed.push([u, v])
              }
              if (parsed.length === 0) {
                setConfigError('邊清單為空或無效，至少需要一條合法邊')
                return
              }
              setConfigError('')
              setGraphNodes(newNodes)
              setGraphEdges(parsed)
              setStep(0)
              if (cyRef.current) {
                cyRef.current
                  .edges()
                  .removeClass(EDGE_TYPES.TREE)
                  .removeClass(EDGE_TYPES.BACK)
                  .removeClass(EDGE_TYPES.FORWARD)
                  .removeClass(EDGE_TYPES.CROSS)
                cyRef.current
                  .nodes()
                  .removeClass('visiting')
                  .removeClass('visited')
                  .removeClass('current')
              }
            }}
          >
            套用設定
          </button>
        </div>
      </div>
      <Legend palette={palette} />
    </div>
  )
}
