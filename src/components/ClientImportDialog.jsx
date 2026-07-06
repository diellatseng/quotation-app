import { useEffect, useId, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  buildClientImportPreview,
  clientImportFieldSummary,
  clientImportStatusLabel,
  downloadClientImportTemplate,
  importClientRows,
  parseClientImportFile,
} from '@/lib/clientImport'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DATA_TABLE_TOOLBAR_BUTTON_SIZE,
  dataTableToolbarButtonClassName,
} from '@/components/data-table/toolbar-styles'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, Download, FileSpreadsheet, Import, Upload } from 'lucide-react'

function statusBadgeVariant(status) {
  if (status === 'ready') return 'default'
  if (status === 'duplicate') return 'secondary'
  return 'destructive'
}

export default function ClientImportDialog({ open, onOpenChange, existingClients, onSuccess }) {
  const inputId = useId()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState('select')
  const [fileName, setFileName] = useState('')
  const [previewRows, setPreviewRows] = useState([])
  const [parseError, setParseError] = useState('')
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const readyCount = previewRows.filter(row => row.status === 'ready').length
  const duplicateCount = previewRows.filter(row => row.status === 'duplicate').length
  const errorCount = previewRows.filter(row => row.status === 'error').length

  useEffect(() => {
    if (!open) return
    setStep('select')
    setFileName('')
    setPreviewRows([])
    setParseError('')
    setParsing(false)
    setImporting(false)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open])

  const handleDownloadTemplate = async () => {
    try {
      await downloadClientImportTemplate()
    } catch (err) {
      toast.error('下載範本失敗：' + (err.message || '未知錯誤'), { duration: 6000 })
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setParsing(true)
    setParseError('')
    setPreviewRows([])
    setResult(null)
    setFileName(file.name)

    try {
      const { rawRows, error } = await parseClientImportFile(file)
      if (error) {
        setParseError(error)
        setStep('select')
        return
      }

      const preview = buildClientImportPreview(rawRows, existingClients)
      if (preview.error) {
        setParseError(preview.error)
        setStep('select')
        return
      }

      if (preview.rows.length === 0) {
        setParseError('找不到可匯入的資料列，請確認已填寫公司名稱')
        setStep('select')
        return
      }

      setPreviewRows(preview.rows)
      setStep('preview')
    } catch (err) {
      setParseError(err.message || '無法讀取檔案')
      setStep('select')
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (readyCount === 0) {
      toast.warning('沒有可匯入的資料列')
      return
    }

    setImporting(true)
    try {
      const summary = await importClientRows(supabase, previewRows)
      setResult(summary)
      setStep('done')

      if (summary.success > 0) {
        onSuccess?.()
      }

      const parts = [`成功 ${summary.success} 筆`]
      if (summary.contactsCreated > 0) parts.push(`聯絡人 ${summary.contactsCreated} 筆`)
      if (summary.skipped > 0) parts.push(`略過重複 ${summary.skipped} 筆`)
      if (summary.invalid > 0) parts.push(`錯誤 ${summary.invalid} 筆`)
      if (summary.failed > 0) parts.push(`寫入失敗 ${summary.failed} 筆`)

      if (summary.failed > 0) {
        toast.error(parts.join('、'), { duration: 6000 })
      } else {
        toast.success(parts.join('、'))
      }
    } catch (err) {
      toast.error('匯入失敗：' + (err.message || '未知錯誤'), { duration: 6000 })
    } finally {
      setImporting(false)
    }
  }

  const fieldSummary = clientImportFieldSummary()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>上傳 Excel 匯入客戶</DialogTitle>
          <DialogDescription>
            請使用範本格式。可同時匯入客戶與主要聯絡人；與現有客戶重複的列將自動略過。
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 'select' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="font-semibold"
                  onClick={handleDownloadTemplate}
                >
                  <Download data-icon="inline-start" />
                  下載範本
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="md"
                  className="font-semibold"
                  disabled={parsing}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload data-icon="inline-start" />
                  {parsing ? '讀取中…' : '選擇 Excel 檔案'}
                </Button>
                <input
                  ref={fileInputRef}
                  id={inputId}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>

              {fileName && !parseError && (
                <p className="text-sm text-muted-foreground">已選擇：{fileName}</p>
              )}

              {parseError && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {parseError}
                </p>
              )}

              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="mb-2 font-semibold text-foreground">範本欄位</p>
                <p className="mb-1"><span className="font-medium text-foreground">客戶：</span>{fieldSummary.clientFields}</p>
                <p><span className="font-medium text-foreground">聯絡人（選填）：</span>{fieldSummary.contactFields}</p>
                <p className="mt-2">填寫聯絡人欄位時，聯絡人姓名為必填；匯入後將設為主要聯絡人。單次最多 500 筆。</p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="default" className="rounded-full">可匯入 {readyCount}</Badge>
                <Badge variant="secondary" className="rounded-full">重複略過 {duplicateCount}</Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="rounded-full">錯誤 {errorCount}</Badge>
                )}
              </div>

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-16 p-3 text-xs font-semibold">列</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">公司名稱</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">聯絡人</TableHead>
                      <TableHead className="w-28 p-3 text-xs font-semibold">狀態</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">說明</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map(row => (
                      <TableRow key={`${row.rowIndex}-${row.company_name}`} className="border-border">
                        <TableCell className="p-3 text-muted-foreground">{row.rowIndex}</TableCell>
                        <TableCell className="p-3 font-medium">{row.company_name}</TableCell>
                        <TableCell className="p-3 text-muted-foreground">{row.contact_name}</TableCell>
                        <TableCell className="p-3">
                          <Badge variant={statusBadgeVariant(row.status)} className="rounded-full">
                            {clientImportStatusLabel(row.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3 text-sm text-muted-foreground">{row.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div className="space-y-3 text-sm">
              <p className="text-base font-semibold text-foreground">匯入完成</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>成功匯入 {result.success} 筆客戶</li>
                {result.contactsCreated > 0 && (
                  <li>建立主要聯絡人 {result.contactsCreated} 筆</li>
                )}
                <li>略過重複 {result.skipped} 筆</li>
                <li>格式錯誤 {result.invalid} 筆</li>
                {result.failed > 0 && <li className="text-destructive">寫入失敗 {result.failed} 筆</li>}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-3">
          {step === 'select' && (
            <Button variant="outline" size="sm" className="font-semibold" onClick={() => onOpenChange(false)}>
              取消
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="font-semibold"
                disabled={importing}
                onClick={() => {
                  setStep('select')
                  setPreviewRows([])
                  setFileName('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                重新選擇
              </Button>
              <Button
                variant="default"
                size="sm"
                className="font-semibold"
                disabled={importing || readyCount === 0}
                onClick={handleImport}
              >
                {importing ? '匯入中…' : `確認匯入（${readyCount} 筆）`}
              </Button>
            </>
          )}

          {step === 'done' && (
            <Button variant="default" size="sm" className="font-semibold" onClick={() => onOpenChange(false)}>
              關閉
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ClientImportToolbarMenu({ onUploadClick }) {
  const handleDownload = () => {
    downloadClientImportTemplate().catch(err => {
      toast.error('下載範本失敗：' + (err.message || '未知錯誤'), { duration: 6000 })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={DATA_TABLE_TOOLBAR_BUTTON_SIZE}
            className={dataTableToolbarButtonClassName}
            aria-label="匯入客戶資料"
          >
            <Import data-icon="inline-start" />
            匯入
            <ChevronDown data-icon="inline-end" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleDownload}>
            <Download />
            下載範本
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUploadClick}>
            <FileSpreadsheet />
            上傳 Excel
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
