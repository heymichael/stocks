import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { FxRow } from './types';

const MIN_CHART_HEIGHT = 400;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const measure = useCallback(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth);
      setHeight(containerRef.current.clientHeight);
    }
  }, []);

  useEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const domain = useMemo<[number, number]>(() => {
    const closes = rows.map((r) => r.close);
    return [Math.min(...closes) - 50, Math.max(...closes) + 50];
  }, [rows]);

  const chartHeight = Math.max(height - 32, MIN_CHART_HEIGHT);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 p-4"
    >
      {width > 0 && height > 0 && (
        <LineChart
          width={width - 32}
          height={chartHeight}
          data={rows}
          margin={{ top: 10, right: 10, bottom: 20, left: 20 }}
        >
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis
            domain={domain}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
            tickFormatter={(v: number) => currencyFmt.format(Math.round(v))}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-lg">
                  <p className="font-medium">{label}</p>
                  <p className="text-muted-foreground">
                    {tickerLabel}: {currencyFmt.format(Math.round(Number(payload[0].value)))}
                  </p>
                </div>
              );
            }}
          />
          <Line
            dataKey="close"
            type="linear"
            stroke="var(--color-chart-line)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-chart-line)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      )}
    </div>
  );
}

