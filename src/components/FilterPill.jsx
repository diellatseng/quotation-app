export default function FilterPill({ pressed = false, onChange, children, ...rest }) {
  return (
    <button
      className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${pressed
          ? 'bg-zinc-900 text-white border-zinc-900'
          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
        }`}
      aria-pressed={pressed}
      onClick={onChange}
      {...rest}
    >
      {children}
    </button>
  )
}