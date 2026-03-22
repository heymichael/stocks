import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@haderach/shared-ui';
import type { ChartConfig } from '@haderach/shared-ui';
import type { FxRow } from './types';

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
  const chartConfig = useMemo<ChartConfig>(
    () => ({
      close: {
        label: `${tickerLabel} Close`,
        color: 'var(--color-chart-line)',
      },
    }),
    [tickerLabel],
  );

  const domain = useMemo<[number, number]>(() => {
    const closes = rows.map((r) => r.close);
    return [Math.min(...closes) - 50, Math.max(...closes) + 50];
  }, [rows]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <ChartContainer config={chartConfig} className="h-[500px] w-full">
        <LineChart data={rows} accessibilityLayer margin={{ bottom: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={domain}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => currencyFmt.format(Math.round(v))}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  currencyFmt.format(Math.round(Number(value)))
                }
              />
            }
          />
          <Line
            dataKey="close"
            type="linear"
            stroke="var(--color-close)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-close)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
