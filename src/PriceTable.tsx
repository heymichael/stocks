import { DataTable } from '@haderach/shared-ui';
import { priceColumns } from './price-columns';
import type { FxRow } from './types';

interface PriceTableProps {
  rows: FxRow[];
}

export function PriceTable({ rows }: PriceTableProps) {
  if (rows.length === 0) return null;
  return <DataTable columns={priceColumns} data={rows} />;
}
