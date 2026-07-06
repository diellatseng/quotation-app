/** App color themes — values map to `[data-theme]` on `<html>`. */
export const APP_THEMES = [
  { value: 'default', label: '朵麗蘭 Doritis' },
  { value: 'high-contrast', label: '高對比' },
]

export const DEFAULT_THEME = 'default'

export function isAppTheme(value) {
  return APP_THEMES.some((t) => t.value === value)
}

export function getThemeLabel(value) {
  return APP_THEMES.find((t) => t.value === value)?.label ?? '主題'
}
