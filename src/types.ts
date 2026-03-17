export interface FxRow {
  date: string;
  close: number;
}

export interface FxRangeResponse {
  ticker: string;
  name: string;
  massiveTicker: string;
  from: string;
  to: string;
  rows: FxRow[];
}

export interface FxErrorResponse {
  error: string;
  details: string;
}

export interface TickerOption {
  value: string;
  label: string;
}

export const TICKERS: TickerOption[] = [
  { value: 'XAUUSD', label: 'XAUUSD — Gold' },
  { value: 'XAGUSD', label: 'XAGUSD — Silver' },
];
