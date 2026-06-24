export function bankAccountLabel(account) {
  if (!account) return '—'
  if (account.label?.trim()) return account.label.trim()
  const parts = [account.bank_name, account.account_number].filter(Boolean)
  return parts.join(' · ') || '—'
}

/** Pick default account, else first row. */
export function pickDefaultBankAccount(accounts = []) {
  if (!accounts.length) return null
  return accounts.find(a => a.is_default) || accounts[0]
}

/** Lines for PDF display. */
export function formatBankAccountLines(account) {
  if (!account) return []
  const lines = []
  if (account.bank_name) {
    const branch = account.branch_name ? `（${account.branch_name}）` : ''
    lines.push(`銀行：${account.bank_name}${branch}`)
  }
  if (account.account_name) lines.push(`戶名：${account.account_name}`)
  if (account.account_number) lines.push(`帳號：${account.account_number}`)
  if (account.notes?.trim()) lines.push(account.notes.trim())
  return lines
}
