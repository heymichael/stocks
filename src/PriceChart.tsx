import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { FxRow } from './types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

interface PriceChartProps {
  rows: FxRow[];
  tickerLabel: string;
}

export function PriceChart({ rows, tickerLabel }: PriceChartProps) {
  const labels = rows.map((r) => r.date);
  const data = rows.map((r) => r.close);
  const min = Math.min(...data);
  const max = Math.max(...data);

  return (
    <div className="chart-container">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: `${tickerLabel} Close`,
              data,
              borderColor: '#0057ff',
              backgroundColor: 'rgba(0, 87, 255, 0.1)',
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: '#0057ff',
              fill: false,
              tension: 0.1,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => currencyFmt.format(Math.round(ctx.parsed.y ?? 0)),
              },
            },
          },
          scales: {
            x: { ticks: { maxRotation: 45, autoSkip: true } },
            y: {
              min: min - 50,
              max: max + 50,
              ticks: {
                callback: (value) =>
                  currencyFmt.format(Math.round(Number(value))),
              },
            },
          },
        }}
      />
    </div>
  );
}
