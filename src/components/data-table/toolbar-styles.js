/** Compact controls for data-table toolbars — keep toolbar buttons on one size tier. */
export const DATA_TABLE_TOOLBAR_BUTTON_SIZE = 'sm'

export const dataTableToolbarButtonClassName = 'font-medium'

/** Outer height shared by search input and filter segmented bar (matches mockup). */
export const DATA_TABLE_TOOLBAR_FIELD_HEIGHT = 'h-11 sm:h-12'

export const dataTableSearchClassName = `flex-1 bg-card sm:max-w-md ${DATA_TABLE_TOOLBAR_FIELD_HEIGHT}`

export const dataTableToolbarControlClassName = `${DATA_TABLE_TOOLBAR_FIELD_HEIGHT} ${dataTableToolbarButtonClassName}`

export const dataTableToolbarIconControlClassName = `${DATA_TABLE_TOOLBAR_FIELD_HEIGHT} aspect-square w-11 shrink-0 px-0 sm:w-12`
