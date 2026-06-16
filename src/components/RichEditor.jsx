// src/components/RichEditor.jsx
import { useRef, useEffect, useCallback } from 'react'
import { ICONS } from '@/lib/icons'
import IconTooltip from '@/components/IconTooltip'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const COLOR_PRESETS = ['#1a1916', '#c0392b', '#1a5fad', '#27ae60', '#e67e22', '#8e44ad', '#888888']

const FONT_SIZES = [
  { value: '1', label: '8px' },
  { value: '2', label: '10px' },
  { value: '3', label: '12px' },
  { value: '4', label: '14px' },
  { value: '5', label: '18px' },
  { value: '6', label: '24px' },
]

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
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted px-2 py-1.5">
        <ToolBtn title="粗體" onClick={() => exec('bold')}><strong>B</strong></ToolBtn>
        <ToolBtn title="斜體" onClick={() => exec('italic')}><em>I</em></ToolBtn>
        <ToolBtn title="底線" onClick={() => exec('underline')}><u>U</u></ToolBtn>
        <Sep />
        <ToolIconBtn title="靠左" icon="format_align_left" onClick={() => exec('justifyLeft')} />
        <ToolIconBtn title="置中" icon="format_align_center" onClick={() => exec('justifyCenter')} />
        <ToolIconBtn title="靠右" icon="format_align_right" onClick={() => exec('justifyRight')} />
        <Sep />
        <ToolIconBtn title="項目符號清單" icon="format_list_bulleted" onClick={() => exec('insertUnorderedList')} />
        <ToolIconBtn title="數字清單" icon="format_list_numbered" onClick={() => exec('insertOrderedList')} />
        <ToolIconBtn title="增加縮排" icon="format_indent_increase" onClick={() => exec('indent')} />
        <ToolIconBtn title="減少縮排" icon="format_indent_decrease" onClick={() => exec('outdent')} />
        <Sep />

        <Select onValueChange={(val) => exec('fontSize', val)}>
          <SelectTrigger size="sm" className="h-7 min-w-[3.25rem]" aria-label="字型大小">
            <SelectValue placeholder="大小" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map(({ value: sizeValue, label }) => (
              <SelectItem key={sizeValue} value={sizeValue}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Sep />

        {/* Color presets */}
        <span className="shrink-0 text-xs text-muted-foreground">字體顏色：</span>
        {COLOR_PRESETS.map(c => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => exec('foreColor', c)}
            className="size-5 shrink-0 cursor-pointer rounded-full border-[1.5px] border-border p-0"
            style={{ background: c }}
          />
        ))}

        {/* Custom colour picker */}
        <input
          type="color"
          title="自訂顏色"
          onChange={e => exec('foreColor', e.target.value)}
          className="size-7 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5"
        />
        <Sep />
        <ToolIconBtn title="清除格式" icon="format_clear" onClick={() => exec('removeFormat')} />
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
        className="cursor-text overflow-y-auto bg-card p-4 outline-none"
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

      <div className="border-t border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
        提示：選取文字後套用格式；清單中按 Tab / Shift+Tab 調整縮排
      </div>
    </div>
  )
}

function ToolBtn({ onClick, title, children }) {
  return (
    <IconTooltip label={title}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={title}
        onClick={onClick}
        className="text-xs font-bold leading-none"
      >
        {children}
      </Button>
    </IconTooltip>
  )
}

function ToolIconBtn({ onClick, title, icon }) {
  const LucideIcon = ICONS[icon]
  return (
    <IconTooltip label={title}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={title}
        onClick={onClick}
      >
        {LucideIcon ? <LucideIcon className="size-4 shrink-0" aria-hidden="true" /> : null}
      </Button>
    </IconTooltip>
  )
}

function Sep() {
  return <div className="mx-0.5 h-5 w-px shrink-0 self-center bg-border" />
}
