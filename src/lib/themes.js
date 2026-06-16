/** App color themes — values map to `[data-theme]` on `<html>`. */
export const APP_THEMES = [
  { value: 'default', label: '蔚藍海岸' },
  { value: 'high-contrast', label: '高對比' },
]

export const DEFAULT_THEME = 'default'

export function isAppTheme(value) {
  return APP_THEMES.some((t) => t.value === value)
}

export function getThemeLabel(value) {
  return APP_THEMES.find((t) => t.value === value)?.label ?? '主題'
}
