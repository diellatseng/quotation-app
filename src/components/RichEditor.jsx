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
    onChange(editorRef.current?.innerHTML || '')
  }, [onChange])

  const handleInput = () => onChange(editorRef.current?.innerHTML || '')

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
        <ToolBtn title="靠左"  onClick={() => exec('justifyLeft')}>⬅</ToolBtn>
        <ToolBtn title="置中"  onClick={() => exec('justifyCenter')}>☰</ToolBtn>
        <ToolBtn title="靠右"  onClick={() => exec('justifyRight')}>➡</ToolBtn>
        <Sep />
        <ToolBtn title="無序清單" onClick={() => exec('insertUnorderedList')}>• 清單</ToolBtn>
        <Sep />

        {/* Font size */}
        <select
          title="字型大小"
          onChange={e => exec('fontSize', e.target.value)}
          defaultValue=""
          style={{ fontSize: 11, padding: '2px 4px', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', background: 'var(--color-bg)' }}
        >
          <option value="" disabled>大小</option>
          {[1,2,3,4,5,6].map((n, i) => (
            <option key={n} value={n}>{['8','10','12','14','18','24'][i]}px</option>
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
        style={{
          minHeight,
          maxHeight,
          overflowY: 'auto',
          padding: '10px 12px',
          fontSize: 13,
          lineHeight: 1.7,
          outline: 'none',
          color: 'var(--color-text)',
          background: 'var(--color-bg)',
          wordBreak: 'break-word',
        }}
      />

      <div style={{
        fontSize: 10, color: 'var(--color-text-muted)',
        padding: '3px 8px',
        background: 'var(--color-bg-subtle)',
        borderTop: '1px solid var(--color-border)',
      }}>
        提示：選取文字後點擊工具列按鈕可套用格式
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
