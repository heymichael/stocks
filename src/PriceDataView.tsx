import { PriceChart } from './PriceChart';
import { PriceTable } from './PriceTable';
import type { FxRow } from './types';
import type { PriceViewMode } from './PriceToolbar';

interface PriceDataViewProps {
  rows: FxRow[];
  tickerLabel: string;
  viewMode: PriceViewMode;
}

export function PriceDataView({ rows, tickerLabel, viewMode }: PriceDataViewProps) {
  if (rows.length === 0) return null;

  return viewMode === 'chart'
    ? <PriceChart rows={rows} tickerLabel={tickerLabel} />
    : <PriceTable rows={rows} />;
}
