/** @typedef {'ready' | 'duplicate' | 'error' | 'empty'} ClientImportRowStatus */

export const CLIENT_IMPORT_MAX_ROWS = 500

export const CLIENT_IMPORT_COLUMNS = [
  { header: '公司名稱', field: 'company_name', required: true },
  { header: '地址', field: 'address' },
  { header: '電話', field: 'phone' },
  { header: '傳真', field: 'fax' },
  { header: '電子郵件', field: 'email' },
  { header: '負責人姓名', field: 'responsible_person_name' },
  { header: '負責人手機', field: 'responsible_person_mobile' },
  { header: '負責人職稱', field: 'responsible_person_title' },
]

export const CONTACT_IMPORT_COLUMNS = [
  { header: '聯絡人姓名', field: 'contact_name' },
  { header: '聯絡人手機', field: 'contact_mobile' },
  { header: '聯絡人辦公室電話', field: 'contact_office_phone' },
  { header: '聯絡人傳真', field: 'contact_fax' },
  { header: '聯絡人電子郵件', field: 'contact_email' },
]

export const ALL_IMPORT_COLUMNS = [...CLIENT_IMPORT_COLUMNS, ...CONTACT_IMPORT_COLUMNS]

const HEADER_TO_FIELD = Object.fromEntries(
  ALL_IMPORT_COLUMNS.map(col => [col.header, col.field]),
)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeCompanyName(name) {
  return String(name ?? '').trim().toLowerCase()
}

function cellString(value) {
  if (value == null) return ''
  return String(value).trim()
}

export function hasContactData(record) {
  return CONTACT_IMPORT_COLUMNS.some(col => cellString(record[col.field]))
}

function isRowEmpty(record) {
  return ALL_IMPORT_COLUMNS.every(col => !cellString(record[col.field]))
}

function mapRawRow(raw, rowIndex) {
  const record = { rowIndex }
  for (const [header, field] of Object.entries(HEADER_TO_FIELD)) {
    record[field] = cellString(raw[header] ?? raw[field] ?? '')
  }
  return record
}

/** @returns {{ message: string } | null} */
export function validateClientRecord(record) {
  if (!cellString(record.company_name)) {
    return { message: '公司名稱為必填' }
  }

  const email = cellString(record.email)
  if (email && !EMAIL_RE.test(email)) {
    return { message: '電子郵件格式不正確' }
  }

  if (hasContactData(record) && !cellString(record.contact_name)) {
    return { message: '已填寫聯絡人欄位時，聯絡人姓名為必填' }
  }

  const contactEmail = cellString(record.contact_email)
  if (contactEmail && !EMAIL_RE.test(contactEmail)) {
    return { message: '聯絡人電子郵件格式不正確' }
  }

  return null
}

export function clientRecordToPayload(record) {
  const client = {}
  for (const col of CLIENT_IMPORT_COLUMNS) {
    const value = cellString(record[col.field])
    client[col.field] = value || null
  }
  client.company_name = cellString(record.company_name)

  let contact = null
  if (cellString(record.contact_name)) {
    contact = {
      name: cellString(record.contact_name),
      mobile: cellString(record.contact_mobile) || null,
      office_phone: cellString(record.contact_office_phone) || null,
      fax: cellString(record.contact_fax) || null,
      email: cellString(record.contact_email) || null,
      is_primary: true,
    }
  }

  return { client, contact }
}

function readyRowMessage(payload) {
  return payload.contact ? '可匯入（含主要聯絡人）' : '可匯入'
}

/**
 * @param {Record<string, unknown>[]} rawRows
 * @param {{ company_name: string }[]} existingClients
 */
export function buildClientImportPreview(rawRows, existingClients = []) {
  if (rawRows.length > CLIENT_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      error: `單次最多匯入 ${CLIENT_IMPORT_MAX_ROWS} 筆，請分批上傳`,
    }
  }

  const existingNames = new Set(
    existingClients.map(c => normalizeCompanyName(c.company_name)),
  )
  const seenInFile = new Set()
  /** @type {Array<{ rowIndex: number, company_name: string, contact_name: string, status: ClientImportRowStatus, message: string, payload: ReturnType<typeof clientRecordToPayload> | null }>} */
  const rows = []

  rawRows.forEach((raw, index) => {
    const record = mapRawRow(raw, index + 2)
    if (isRowEmpty(record)) return

    const validation = validateClientRecord(record)
    if (validation) {
      rows.push({
        rowIndex: record.rowIndex,
        company_name: cellString(record.company_name) || '—',
        contact_name: cellString(record.contact_name) || '—',
        status: 'error',
        message: validation.message,
        payload: null,
      })
      return
    }

    const normalized = normalizeCompanyName(record.company_name)
    if (seenInFile.has(normalized)) {
      rows.push({
        rowIndex: record.rowIndex,
        company_name: record.company_name,
        contact_name: cellString(record.contact_name) || '—',
        status: 'error',
        message: '檔案內公司名稱重複',
        payload: null,
      })
      return
    }
    seenInFile.add(normalized)

    if (existingNames.has(normalized)) {
      rows.push({
        rowIndex: record.rowIndex,
        company_name: record.company_name,
        contact_name: cellString(record.contact_name) || '—',
        status: 'duplicate',
        message: '與現有客戶重複，將略過',
        payload: null,
      })
      return
    }

    const payload = clientRecordToPayload(record)
    rows.push({
      rowIndex: record.rowIndex,
      company_name: record.company_name,
      contact_name: payload.contact?.name || '—',
      status: 'ready',
      message: readyRowMessage(payload),
      payload,
    })
  })

  return { rows, error: null }
}

export async function parseClientImportFile(file) {
  const name = file?.name?.toLowerCase() || ''
  if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
    return { rawRows: [], error: '請上傳 .xlsx 或 .xls 檔案' }
  }

  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rawRows: [], error: '找不到工作表' }
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  return { rawRows, error: null }
}

export async function downloadClientImportTemplate() {
  const XLSX = await import('xlsx')
  const headers = ALL_IMPORT_COLUMNS.map(col => col.header)
  const example = [
    '範例建設股份有限公司',
    '高雄市前金區中正四路211號',
    '07-1234567',
    '07-1234568',
    'sample@example.com',
    '王小明',
    '0912345678',
    '負責人',
    '李小姐',
    '0922333444',
    '07-7654321',
    '',
    'contact@example.com',
  ]
  const worksheet = XLSX.utils.aoa_to_sheet([headers, example])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '客戶資料')
  XLSX.writeFile(workbook, '客戶匯入範本.xlsx')
}

const INSERT_BATCH_SIZE = 50

export async function importClientRows(supabase, previewRows) {
  const ready = previewRows.filter(row => row.status === 'ready' && row.payload)
  let success = 0
  let contactsCreated = 0
  let failed = 0
  const errors = []

  for (let i = 0; i < ready.length; i += INSERT_BATCH_SIZE) {
    const slice = ready.slice(i, i + INSERT_BATCH_SIZE)
    const clientBatch = slice.map(row => row.payload.client)

    const { data: inserted, error } = await supabase
      .from('clients')
      .insert(clientBatch)
      .select('id')

    if (error) {
      failed += slice.length
      errors.push(error.message)
      continue
    }

    success += inserted.length

    const contactRows = inserted.flatMap((client, idx) => {
      const contact = slice[idx].payload.contact
      if (!contact) return []
      return [{ ...contact, client_id: client.id }]
    })

    if (contactRows.length > 0) {
      const { error: contactErr } = await supabase.from('contact_persons').insert(contactRows)
      if (contactErr) {
        errors.push(`聯絡人寫入失敗：${contactErr.message}`)
      } else {
        contactsCreated += contactRows.length
      }
    }
  }

  const skipped = previewRows.filter(row => row.status === 'duplicate').length
  const invalid = previewRows.filter(row => row.status === 'error').length

  return { success, contactsCreated, skipped, failed, invalid, errors }
}

export function clientImportStatusLabel(status) {
  switch (status) {
    case 'ready': return '可匯入'
    case 'duplicate': return '重複略過'
    case 'error': return '無法匯入'
    default: return '—'
  }
}

export function clientImportFieldSummary() {
  const clientFields = CLIENT_IMPORT_COLUMNS.map(col => col.header).join('、')
  const contactFields = CONTACT_IMPORT_COLUMNS.map(col => col.header).join('、')
  return { clientFields, contactFields }
}
