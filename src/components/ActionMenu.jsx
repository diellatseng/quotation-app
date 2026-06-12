// src/components/ActionMenu.jsx
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import IconButton from './IconButton'

// ── Hook: close menu on any outside click ────────────────────────────────────
export function useActionMenuClose(openId, onClose) {
  useEffect(() => {
    if (!openId) return
    const handler = () => onClose()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openId, onClose])
}

export default function ActionMenu({ id, openId, onOpen, onClose, children }) {
  const triggerRef = useRef(null)

  // 1. 🌟 Initialize as null to prevent rendering at default 0,0 positions
  const [coords, setCoords] = useState(null)
  const isOpen = openId === id

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 4,                 // 4px spacing below the button
        right: window.innerWidth - rect.right // Matches right alignment perfectly
      })
    } else if (!isOpen) {
      // 2. 🌟 Clear coordinates on close to keep calculations fresh for the next toggle
      setCoords(null)
    }
  }, [isOpen])

  return (
    <div className="action-menu" ref={triggerRef}>
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
      {/* 3. 🌟 Defensive check: Only render when open AND coordinates are fully computed */}
      {isOpen && coords && createPortal(
        <div
          className="action-menu__dropdown"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            left: 'auto', // overrides default CSS overrides if any
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>,
        document.body // Teleports the dropdown container to the body root
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