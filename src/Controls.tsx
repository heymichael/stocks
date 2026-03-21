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
    <div className="controls">
      <div className="control-group">
        <label htmlFor="ticker-select">Ticker</label>
        <Select value={ticker} onValueChange={onTickerChange}>
          <SelectTrigger id="ticker-select" className="w-[140px]">
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
      <div className="control-group">
        <label htmlFor="date-from">From</label>
        <Input
          type="date"
          id="date-from"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </div>
      <div className="control-group">
        <label htmlFor="date-to">To</label>
        <Input
          type="date"
          id="date-to"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>
      <div className="control-group">
        <label>&nbsp;</label>
        <Button onClick={onFetch} disabled={loading}>
          {loading ? 'Loading…' : 'Fetch'}
        </Button>
      </div>
    </div>
  );
}
