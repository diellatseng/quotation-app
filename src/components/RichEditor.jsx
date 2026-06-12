// src/components/RichEditor.jsx
import { useRef, useEffect, useCallback } from 'react'

const COLOR_PRESETS = ['#1a1916', '#c0392b', '#1a5fad', '#27ae60', '#e67e22', '#8e44ad', '#888888']

/**
 * RichEditor — lightweight contentEditable rich-text editor.
 *
 * Props:
 *   value      {string}   HTML string (controlled)
 *   onChange   {fn}       Called with new HTML string on every change
 *   minHeight  {number}   Min height of editable area in px (default: 100)
 *   maxHeight  {number}   Max height of editable area in px (default: 260)
 *   placeholder {string}  Hint shown when empty (default: none)
 */
/**
 * Add Tailwind list classes to ul, ol, and li elements in HTML.
 * This ensures lists render correctly when the HTML is displayed elsewhere
 * (ServiceTable, A4Preview, PDF export) since Tailwind utilities only apply
 * to elements with the class names.
 */
function addTailwindListClasses(html) {
  if (!html) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Add classes to all ul elements
  doc.querySelectorAll('ul').forEach((ul) => {
    const level = getListNestingLevel(ul, 'ul')
    if (level === 0) {
      ul.className = 'list-disc list-outside pl-6'
    } else if (level === 1) {
      ul.className = 'list-[circle] list-outside pl-6'
    } else if (level >= 2) {
      ul.className = 'list-square list-outside pl-6'
    }
  })

  // Add classes to all ol elements
  doc.querySelectorAll('ol').forEach((ol) => {
    const level = getListNestingLevel(ol, 'ol')
    if (level === 0) {
      ol.className = 'list-decimal list-outside pl-6'
    } else if (level >= 1) {
      ol.className = 'list-[lower-alpha] list-outside pl-6'
    }
  })

  // Add classes to all li elements
  doc.querySelectorAll('li').forEach((li) => {
    li.className = 'list-item'
  })

  return doc.body.innerHTML
}

/**
 * Get the nesting level of a list element (0 = top-level, 1 = nested, etc.)
 */
function getListNestingLevel(el, type) {
  let level = 0
  let parent = el.parentElement
  while (parent) {
    if (parent.tagName === type.toUpperCase()) {
      level++
    }
    parent = parent.parentElement
  }
  return level
}

export default function RichEditor({ value, onChange, minHeight = 100, maxHeight = 260, placeholder }) {
  const editorRef = useRef(null)

  // Sync external value into DOM without clobbering cursor position
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || ''
    }
  }, [value])

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    const html = editorRef.current?.innerHTML || ''
    onChange(addTailwindListClasses(html))
  }, [onChange])

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || ''
    onChange(addTailwindListClasses(html))
  }

  // Tab = indent inside list, Shift+Tab = outdent
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        exec('outdent')
      } else {
        exec('indent')
      }
    }
  }

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center',
        padding: '6px 8px',
        background: 'var(--color-bg-subtle)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <ToolBtn title="粗體" onClick={() => exec('bold')}><strong>B</strong></ToolBtn>
        <ToolBtn title="斜體" onClick={() => exec('italic')}><em>I</em></ToolBtn>
        <ToolBtn title="底線" onClick={() => exec('underline')}><u>U</u></ToolBtn>
        <Sep />
        <ToolBtn title="靠左" onClick={() => exec('justifyLeft')}>⬅</ToolBtn>
        <ToolBtn title="置中" onClick={() => exec('justifyCenter')}>☰</ToolBtn>
        <ToolBtn title="靠右" onClick={() => exec('justifyRight')}>➡</ToolBtn>
        <Sep />
        <ToolBtn title="項目符號清單" onClick={() => exec('insertUnorderedList')}>• 清單</ToolBtn>
        <ToolBtn title="數字清單" onClick={() => exec('insertOrderedList')}>1. 清單</ToolBtn>
        <ToolBtn title="增加縮排" onClick={() => exec('indent')}>⇥</ToolBtn>
        <ToolBtn title="減少縮排" onClick={() => exec('outdent')}>⇤</ToolBtn>
        <Sep />

        {/* Font size */}
        <select
          title="字型大小"
          onChange={e => exec('fontSize', e.target.value)}
          defaultValue=""
          style={{ fontSize: 11, padding: '2px 4px', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', background: 'var(--color-bg)' }}
        >
          <option value="" disabled>大小</option>
          {[1, 2, 3, 4, 5, 6].map((n, i) => (
            <option key={n} value={n}>{['8', '10', '12', '14', '18', '24'][i]}px</option>
          ))}
        </select>
        <Sep />

        {/* Color presets */}
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginRight: 2 }}>色：</span>
        {COLOR_PRESETS.map(c => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => exec('foreColor', c)}
            style={{
              width: 16, height: 16, borderRadius: '50%',
              background: c, border: '1.5px solid #ccc',
              cursor: 'pointer', flexShrink: 0, padding: 0,
            }}
          />
        ))}

        {/* Custom colour picker */}
        <input
          type="color"
          title="自訂顏色"
          onChange={e => exec('foreColor', e.target.value)}
          style={{ width: 20, height: 20, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
        />
        <Sep />
        <ToolBtn title="清除格式" onClick={() => exec('removeFormat')}>✕ 格式</ToolBtn>
      </div>

      {/* ── Editable area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        className="p-4 outline-none overflow-y-auto cursor-text"
        style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
      />

      {/* Scoped list styles injected via a style tag */}
      <style>{`
        [contenteditable] ul,
        [contenteditable] ol {
          padding-left: 1.6em;
          margin: 0.25em 0;
        }
        [contenteditable] ul { list-style-type: disc; }
        [contenteditable] ol { list-style-type: decimal; }
        [contenteditable] ul ul  { list-style-type: circle; }
        [contenteditable] ul ul ul { list-style-type: square; }
        [contenteditable] ol ol { list-style-type: lower-alpha; }
        [contenteditable] li { margin: 0.1em 0; }
      `}</style>

      <div className="text-[10px] text-zinc-500 px-2 py-1 bg-zinc-50 border-t border-zinc-200">
        提示：選取文字後套用格式；清單中按 Tab / Shift+Tab 調整縮排
      </div>
    </div>
  )
}

function ToolBtn({ onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '2px 6px', fontSize: 11, cursor: 'pointer',
        border: '1px solid var(--color-border)', borderRadius: 4,
        background: 'var(--color-bg)', color: 'var(--color-text)',
        lineHeight: 1.4,
      }}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 2px' }} />
}
