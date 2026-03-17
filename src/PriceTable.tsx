import type { FxRow } from './types';

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

interface PriceTableProps {
  rows: FxRow[];
}

export function PriceTable({ rows }: PriceTableProps) {
  if (rows.length === 0) return null;

  return (
    <table className="results-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Close</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.date}>
            <td>{row.date}</td>
            <td>{currencyFmt.format(Math.round(row.close))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
