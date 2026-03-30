import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@haderach/shared-ui'
import { BarChart3, Table2, Download } from 'lucide-react'
import { TICKERS } from './types'

export type PriceViewMode = 'chart' | 'table'

interface PriceToolbarProps {
  ticker: string
  dateFrom: string
  dateTo: string
  loading: boolean
  viewMode: PriceViewMode
  onTickerChange: (ticker: string) => void
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onFetch: () => void
  onViewModeChange: (mode: PriceViewMode) => void
  onDownload?: () => void
}

export function PriceToolbar({
  ticker,
  dateFrom,
  dateTo,
  loading,
  viewMode,
  onTickerChange,
  onDateFromChange,
  onDateToChange,
  onFetch,
  onViewModeChange,
  onDownload,
}: PriceToolbarProps) {
  return (
    <div className="flex flex-wrap items-end gap-6 px-4 py-2">
      <div className="flex flex-col gap-0.5 min-w-[120px]">
        <label className="text-xs font-medium text-muted-foreground">
          Ticker
        </label>
        <Select value={ticker} onValueChange={onTickerChange}>
          <SelectTrigger className="h-8 w-full rounded-none border-0 border-b border-border bg-transparent px-0 pb-1 text-xs shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <input
            type="date"
            className="h-8 w-[120px] border-b border-border bg-transparent pb-1 text-xs outline-none [&::-webkit-calendar-picker-indicator]:h-3.5 [&::-webkit-calendar-picker-indicator]:w-3.5 [&::-webkit-calendar-picker-indicator]:opacity-60"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <input
            type="date"
            className="h-8 w-[120px] border-b border-border bg-transparent pb-1 text-xs outline-none [&::-webkit-calendar-picker-indicator]:h-3.5 [&::-webkit-calendar-picker-indicator]:w-3.5 [&::-webkit-calendar-picker-indicator]:opacity-60"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
        <Button onClick={onFetch} disabled={loading} size="sm" className="text-xs">
          {loading ? 'Loading…' : 'Fetch'}
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1 self-end">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", viewMode === 'chart' && "bg-accent")}
          onClick={() => onViewModeChange('chart')}
          aria-label="Chart view"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", viewMode === 'table' && "bg-accent")}
          onClick={() => onViewModeChange('table')}
          aria-label="Table view"
        >
          <Table2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onDownload}
          disabled={viewMode === 'chart'}
          aria-label="Download CSV"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
