import type { ColumnDef } from '@haderach/shared-ui';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@haderach/shared-ui';
import type { FxRow } from './types';

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export const priceColumns: ColumnDef<FxRow>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-bold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Date
        <ArrowUpDown />
      </Button>
    ),
  },
  {
    accessorKey: 'close',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-bold"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        $ / oz.
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => currencyFmt.format(Math.round(row.getValue('close'))),
  },
  {
    id: 'pricePerGram',
    header: () => (
      <span className="font-bold text-sm">$ / gram</span>
    ),
    cell: () => '—',
  },
];
