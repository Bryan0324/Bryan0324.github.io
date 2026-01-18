import React, { useEffect, useRef, useMemo, useState } from 'react'
import cytoscape from 'cytoscape'

const DEFAULT_TREE_DATA: TreeData = {
  "我的技能樹": {
    "競程": {
      "語法": {
        "C++": {},
        "Python": {},
      },
      "演算法": {
        "資料型態": {
          "linklist": {},
          "stack": {},
          "queue": {},
          "binary tree": {},
          "treap": {},
          "segment tree": {},
          "zkw segment tree": {},
          "fenwick tree": {},
        },
        "圖論": { 
          "DFS/BFS": {},
          "最短路徑": {},
          "最小生成樹": {},
          "拓撲排序": {},
        },
        "動態規劃": {
          "背包問題": {},
          "區間DP": {},
        },
      },
    },
    "前端": {
      "HTML": {},
      "CSS": {},
      "JS/TS": {},
      "React": {},
    },
    "後端": {
      "Node.js": {},
    },
    "資料庫": {}
  }
}

export interface TreeData {
  [key: string]: TreeData | undefined
}

interface CytoscapeTreeProps {
  data?: TreeData
  style?: cytoscape.StylesheetCSS[]
}

const defaultStyles: cytoscape.StylesheetCSS[] = [
  {
    selector: 'node',
    css: {
      'background-color': '#4a90e2',
      'label': 'data(id)',
      'text-valign': 'center',
      'text-halign': 'center',
      'color': '#fff',
      'padding': '10px',
      'font-size': '14px',
      'font-weight': 'bold',
      'text-wrap': 'wrap',
      'text-max-width': '100px',
      'border-width': 2,
      'border-color': '#2e5c8a',
    },
  },
  {
    selector: 'edge',
    css: {
      'line-color': '#999',
      'target-arrow-color': '#999',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'width': 2,
    },
  },
]



const convertToElements = (data: TreeData, parentId?: string): cytoscape.ElementDefinition[] => {
  if (!data || typeof data !== 'object') {
    return []
  }

  const elements: cytoscape.ElementDefinition[] = []
  let edgeId = 0
  const allNodes = new Set<string>()
  const parentNodes = new Set<string>()

  const traverse = (obj: TreeData, parent?: string) => {
    if (!obj || typeof obj !== 'object') return
    
    for (const [key, value] of Object.entries(obj)) {
      allNodes.add(key)
      
      // Add node
      elements.push({
        data: { id: key },
      })

      // Add edge if there's a parent
      if (parent) {
        parentNodes.add(key)
        elements.push({
          data: {
            id: `${parent}-${key}-${edgeId++}`,
            source: parent,
            target: key,
          },
        })
      }

      // Recursively process children
      if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        traverse(value, key)
      }
    }
  }

  traverse(data)
  return elements
}

export default function CytoscapeTree({ data, style = defaultStyles }: CytoscapeTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Use fallback data if none provided
  const treeData = data || DEFAULT_TREE_DATA

  const elements = useMemo(() => {
    try {
      const els = convertToElements(treeData)
      return els || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setError(`Data error: ${message}`)
      return []
    }
  }, [treeData])

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize Cytoscape
  useEffect(() => {
    if (!mounted || !containerRef.current || !elements.length) return

    const timer = setTimeout(() => {
      if (!containerRef.current) return

      try {
        const edges = elements.filter(el => 'source' in el.data)
        const targetNodes = new Set(edges.map(el => el.data.target))
        const nodeElements = elements.filter(el => !('source' in el.data))
        const rootNodes = nodeElements
          .filter(el => !targetNodes.has(el.data.id))
          .map(el => el.data.id as string)

        if (rootNodes.length === 0 && nodeElements.length > 0) {
          rootNodes.push(nodeElements[0].data.id as string)
        }

        const cy = cytoscape({
          container: containerRef.current,
          elements: elements as cytoscape.ElementDefinition[],
          style,
          layout: {
            name: 'cose',
            directed: true,
            animate: true,
            animationDuration: 500,
            nodeSpacing: 50,
            padding: 20,
          } as any,
        })

        cyRef.current = cy
        setError(null)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(`Init error: ${msg}`)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (cyRef.current) {
        try {
          cyRef.current.destroy()
        } catch {}
        cyRef.current = null
      }
    }
  }, [elements, style, mounted])

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height: '200px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c00',
          fontSize: '14px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '700px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
      }}
    />
  )
}
