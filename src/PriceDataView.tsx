import { Tabs, TabsList, TabsTrigger, TabsContent } from '@haderach/shared-ui';
import { PriceChart } from './PriceChart';
import { PriceTable } from './PriceTable';
import type { FxRow } from './types';

interface PriceDataViewProps {
  rows: FxRow[];
  tickerLabel: string;
}

export function PriceDataView({ rows, tickerLabel }: PriceDataViewProps) {
  if (rows.length === 0) return null;

  return (
    <Tabs defaultValue="chart">
      <TabsList>
        <TabsTrigger value="chart">Chart</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
      </TabsList>
      <TabsContent value="chart">
        <PriceChart rows={rows} tickerLabel={tickerLabel} />
      </TabsContent>
      <TabsContent value="table">
        <PriceTable rows={rows} />
      </TabsContent>
    </Tabs>
  );
}
