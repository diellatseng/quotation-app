// src/components/ActionMenu.jsx
//
// A "⋯ More actions" trigger + dropdown menu, reusable across views.
//
// Usage:
//   import ActionMenu, { ActionMenuItem } from './ActionMenu'
//
//   const [openId, setOpenId] = useState(null)
//
//   <ActionMenu
//     id={row.id}
//     openId={openId}
//     onOpen={(id) => setOpenId(id)}
//     onClose={() => setOpenId(null)}
//   >
//     <ActionMenuItem icon="task_alt" label="結案" onClick={() => archive(row.id)} />
//     <ActionMenuItem icon="delete"   label="刪除" danger onClick={() => del(row.id)} />
//   </ActionMenu>
//
// The parent owns `openId` so it can close any open menu when another opens,
// or close on outside-click via the exported `useActionMenuClose` hook.

import { useEffect } from 'react'
import IconButton from './IconButton'

// ── Hook: close menu on any outside click ────────────────────────────────────
// Call this once in the parent component that owns `openId`.
//
//   const [openId, setOpenId] = useState(null)
//   useActionMenuClose(openId, () => setOpenId(null))
//
export function useActionMenuClose(openId, onClose) {
  useEffect(() => {
    if (!openId) return
    const handler = () => onClose()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openId, onClose])
}

// ── ActionMenu ────────────────────────────────────────────────────────────────
export default function ActionMenu({ id, openId, onOpen, onClose, children }) {
  const isOpen = openId === id

  return (
    <div className="action-menu">
      <IconButton
        icon="more_horiz"
        tooltip="更多操作"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation() // prevent outside-click handler from firing immediately
          isOpen ? onClose() : onOpen(id)
        }}
      />
      {isOpen && (
        <div className="action-menu__dropdown" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── ActionMenuItem ────────────────────────────────────────────────────────────
export function ActionMenuItem({ icon, label, onClick, danger = false }) {
  return (
    <IconButton
      icon={icon}
      label={label}
      tooltip={label}
      variant="ghost"
      size="sm"
      className={`action-menu__item${danger ? ' action-menu__item--danger' : ''}`}
      onClick={onClick}
    />
  )
}
