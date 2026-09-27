import { ChevronRight, Crown, UserX } from 'lucide-react'
import { useState } from 'react'
import type { DepartementResponse } from '@/types/departement'

export interface TreeNode extends DepartementResponse {
  children: TreeNode[]
}

export function buildTree(flat: DepartementResponse[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  flat.forEach((d) => map.set(d.id, { ...d, children: [] }))
  const roots: TreeNode[] = []
  flat.forEach((d) => {
    const node = map.get(d.id)!
    if (d.idParent != null && map.has(d.idParent)) {
      map.get(d.idParent)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

interface DepartementTreeProps {
  nodes: TreeNode[]
  onSelect: (node: TreeNode) => void
  selectedId?: number | null
}

export function DepartementTree({ nodes, onSelect, selectedId }: DepartementTreeProps) {
  return (
    <div className="flex flex-col">
      {nodes.map((node) => (
        <TreeRow key={node.id} node={node} depth={0} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  )
}

function TreeRow({
  node, depth, onSelect, selectedId,
}: { node: TreeNode; depth: number; onSelect: (n: TreeNode) => void; selectedId?: number | null }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 rounded-lg py-1.5 pr-2 cursor-pointer text-[13px] ${
          isSelected ? 'bg-accent-light text-accent-dark' : 'hover:bg-[#F4F5F7] text-ink'
        }`}
        style={{ paddingLeft: `${depth * 20 + 6}px` }}
        onClick={() => onSelect(node)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen((o) => !o)
          }}
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded transition-transform ${
            hasChildren ? 'text-[#9CA0AC] hover:bg-[#E4E6EB]' : 'invisible'
          } ${open ? 'rotate-90' : ''}`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <span className="flex-1 truncate font-medium">{node.nomDepartement}</span>
        <span className="flex-shrink-0 text-[11px] text-[#9CA0AC]">{node.niveau}</span>
        {node.nomChef ? (
          <span className="flex flex-shrink-0 items-center gap-1 text-[11px] text-[#6B7180]" title={`Chef : ${node.nomChef}`}>
            <Crown className="h-3 w-3 text-warning" />
          </span>
        ) : (
          <span title="Poste de chef vacant">
            <UserX className="h-3 w-3 flex-shrink-0 text-[#C4C7D0]" />
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  )
}
