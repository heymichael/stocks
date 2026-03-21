import { TICKERS } from './types'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@haderach/shared-ui'

interface ControlsProps {
  ticker: string;
  dateFrom: string;
  dateTo: string;
  loading: boolean;
  onTickerChange: (ticker: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onFetch: () => void;
}

export function Controls({
  ticker,
  dateFrom,
  dateTo,
  loading,
  onTickerChange,
  onDateFromChange,
  onDateToChange,
  onFetch,
}: ControlsProps) {
  return (
    <div className="flex flex-col gap-3 px-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="ticker-select" className="text-xs font-medium text-sidebar-foreground/70">
          Ticker
        </label>
        <Select value={ticker} onValueChange={onTickerChange}>
          <SelectTrigger id="ticker-select" className="w-full">
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

      <div className="flex flex-col gap-1">
        <label htmlFor="date-from" className="text-xs font-medium text-sidebar-foreground/70">
          From
        </label>
        <Input
          type="date"
          id="date-from"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="date-to" className="text-xs font-medium text-sidebar-foreground/70">
          To
        </label>
        <Input
          type="date"
          id="date-to"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>

      <Button onClick={onFetch} disabled={loading} className="w-full">
        {loading ? 'Loading…' : 'Fetch'}
      </Button>
    </div>
  );
}
