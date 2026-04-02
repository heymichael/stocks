import { useState, useCallback, useRef } from 'react';
import {
  AppRail,
  useRailExpanded,
  PaneToolbar,
  PaneLayout,
  ChatPanel,
} from '@haderach/shared-ui';
import type { PaneLayoutHandle, PaneId } from '@haderach/shared-ui';
import { Loader2 } from 'lucide-react';

import { PriceToolbar } from './PriceToolbar';
import type { PriceViewMode } from './PriceToolbar';
import { PriceDataView } from './PriceDataView';
import { useAuthUser } from './auth/AuthUserContext';
import { TICKERS } from './types';
import type { FxRow, FxRangeResponse, FxErrorResponse } from './types';
import './App.css';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekAgoISO(): string {
  return new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
}

export function App() {
  const authUser = useAuthUser();

  const [ticker, setTicker] = useState(TICKERS[0].value);
  const [dateFrom, setDateFrom] = useState(weekAgoISO);
  const [dateTo, setDateTo] = useState(todayISO);
  const [rows, setRows] = useState<FxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<PriceViewMode>('chart');

  const [railExpanded, toggleRail] = useRailExpanded();
  const [chatOpen, setChatOpen] = useState(true);
  const [detailPane, setDetailPane] = useState<'analytics' | 'data' | null>('analytics');

  const paneRef = useRef<PaneLayoutHandle>(null);

  const tickerLabel =
    TICKERS.find((t) => t.value === ticker)?.label ?? ticker;

  const handleFetch = useCallback(async () => {
    if (!dateFrom || !dateTo) {
      setError('Please select both a start and end date.');
      return;
    }
    if (dateFrom > dateTo) {
      setError("'From' date must be on or before 'To' date.");
      return;
    }

    setError(null);
    setNoData(null);
    setRows([]);
    setLoading(true);

    const params = new URLSearchParams({
      ticker,
      from: dateFrom,
      to: dateTo,
    });

    try {
      const resp = await fetch(`/stocks/api/fx-range?${params}`);
      const body: FxRangeResponse | FxErrorResponse = await resp.json();

      if (!resp.ok) {
        const err = body as FxErrorResponse;
        setError(`Error ${resp.status}: ${err.error} — ${err.details}`);
        return;
      }

      const data = body as FxRangeResponse;
      if (!data.rows || data.rows.length === 0) {
        setNoData(
          `No data found for ${data.ticker} (${data.name}) in that date range.`,
        );
        return;
      }

      setRows(data.rows);
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoading(false);
    }
  }, [ticker, dateFrom, dateTo]);

  const handlePaneToggle = useCallback((id: PaneId) => {
    paneRef.current?.togglePane(id);
  }, []);

  const handleLayoutChange = useCallback((chat: boolean, detail: 'analytics' | 'data' | null) => {
    setChatOpen(chat);
    setDetailPane(detail);
  }, []);

  const handleDownloadCsv = useCallback(() => {
    if (rows.length === 0) return;
    const header = 'date,close';
    const csvRows = rows.map((r) => `${r.date},${r.close}`);
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prices.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  return (
    <div className="app-shell">
      <AppRail
        apps={authUser.accessibleApps}
        activeAppId="stocks"
        expanded={railExpanded}
        onToggle={toggleRail}
        userEmail={authUser.email}
        userPhotoURL={authUser.photoURL}
        userDisplayName={authUser.displayName}
        onSignOut={authUser.signOut}
        openPanes={{ chat: chatOpen, analytics: detailPane === 'analytics', data: detailPane === 'data' }}
        getIdToken={authUser.getIdToken}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <PaneToolbar
          activePanes={{
            chat: chatOpen,
            analytics: detailPane === 'analytics',
            data: detailPane === 'data',
          }}
          onPaneToggle={handlePaneToggle}
        />

        <PaneLayout
          ref={paneRef}
          chatOpen={chatOpen}
          detailPane={detailPane}
          onLayoutChange={handleLayoutChange}
          chatContent={
            <ChatPanel
              mode="panel"
              disabled
              appContext="stocks"
              placeholderMessage="Chat capabilities coming soon."
            />
          }
          analyticsContent={
            <div className="flex flex-1 min-h-0 flex-col p-2">
              <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-border bg-card shadow-sm">
                <PriceToolbar
                  ticker={ticker}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  loading={loading}
                  viewMode={viewMode}
                  onTickerChange={setTicker}
                  onDateFromChange={setDateFrom}
                  onDateToChange={setDateTo}
                  onFetch={handleFetch}
                  onViewModeChange={setViewMode}
                  onDownload={handleDownloadCsv}
                />
                {error && (
                  <div className="px-4 pt-2 text-sm text-red-600">{error}</div>
                )}
                <div className="flex flex-1 min-h-0 flex-col px-4">
                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {noData && <p className="no-data">{noData}</p>}
                  {!loading && (
                    <PriceDataView rows={rows} tickerLabel={tickerLabel} viewMode={viewMode} />
                  )}
                </div>
              </div>
            </div>
          }
          dataContent={
            <div className="flex flex-1 items-center justify-center p-8">
              <p className="text-sm text-muted-foreground italic">
                Data view coming soon.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}
