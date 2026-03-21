import { useState, useCallback } from 'react';
import {
  GlobalNav,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  Separator,
} from '@haderach/shared-ui';
import { Controls } from './Controls';
import { PriceChart } from './PriceChart';
import { PriceTable } from './PriceTable';
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
  const [ticker, setTicker] = useState(TICKERS[0].value);
  const [dateFrom, setDateFrom] = useState(weekAgoISO);
  const [dateTo, setDateTo] = useState(todayISO);
  const [rows, setRows] = useState<FxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState<string | null>(null);
  const [view, setView] = useState<"prices" | "watchlist">("prices");

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

  const authUser = useAuthUser();

  return (
    <div className="app-shell">
      <GlobalNav
        apps={authUser.accessibleApps}
        activeAppId="stocks"
        userEmail={authUser.email}
        userPhotoURL={authUser.photoURL}
        userDisplayName={authUser.displayName}
        onSignOut={authUser.signOut}
        logo={
          <img
            className="h-12 w-auto"
            src="/assets/landing/logo.svg"
            alt="Haderach"
          />
        }
      />

      <SidebarProvider className="min-h-0 flex-1">
        <Sidebar collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup className="pt-14">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={view === "watchlist"} onClick={() => setView("watchlist")}>
                    Watchlist
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={view === "prices"} onClick={() => setView("prices")}>
                    Prices
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {view === "prices" && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <Controls
                    ticker={ticker}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    loading={loading}
                    onTickerChange={setTicker}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onFetch={handleFetch}
                  />
                  {error && <div className="error">{error}</div>}
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <h1 className="text-lg font-semibold">
              Commodity Price Management
            </h1>
          </header>

          <div className="display-panel">
            {view === "prices" && (
              <>
                {noData && <p className="no-data">{noData}</p>}
                {rows.length > 0 && (
                  <PriceChart rows={rows} tickerLabel={tickerLabel} />
                )}
                <PriceTable rows={rows} />
              </>
            )}
            {view === "watchlist" && (
              <p className="no-data">No watchlist items yet.</p>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
