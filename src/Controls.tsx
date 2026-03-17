import { TICKERS } from './types'

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
        <select
          id="ticker-select"
          value={ticker}
          onChange={(e) => onTickerChange(e.target.value)}
        >
          {TICKERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="control-group">
        <label htmlFor="date-from">From</label>
        <input
          type="date"
          id="date-from"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </div>
      <div className="control-group">
        <label htmlFor="date-to">To</label>
        <input
          type="date"
          id="date-to"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>
      <div className="control-group">
        <label>&nbsp;</label>
        <button onClick={onFetch} disabled={loading}>
          {loading ? 'Loading…' : 'Fetch'}
        </button>
      </div>
    </div>
  );
}
