import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { CandidatesView } from "./components/CandidatesView";
import { PortfolioView } from "./components/PortfolioView";
import { LimitUpPoolView } from "./components/LimitUpPoolView";
import { SettingsView } from "./components/SettingsView";
import { IterationView } from "./components/IterationView";
import { ReviewAttributionView } from "./components/ReviewAttributionView";
import { SellAlertModal } from "./components/SellAlertModal";
import { BuyAlertModal } from "./components/BuyAlertModal";
import {
  SentimentData,
  CandidatesPayload,
  PortfolioState,
  CandidateStock,
  IterationData,
  SellAlertCardData,
  BuyAlertCardData,
  ReviewAttributionPayload,
  MarketSessionInfo
} from "./types";
import { Volume2, VolumeX } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("portfolio");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);

  // --- SILENT REFRESH CONTROL ---------------------------------------------
  // True once the very first "full" fetch finishes. From that point onwards
  // the interval heartbeat NEVER shows full-screen skeletons / spinners again.
  const [firstLoadDone, setFirstLoadDone] = useState<boolean>(false);
  // Guards against overlapping ticks inside the 3s / 15s loop.
  const pollInFlightRef = useRef<boolean>(false);
  const lastLivePoolFetchRef = useRef<number>(0);
  
  // Data States
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [candidatesPayload, setCandidatesPayload] = useState<CandidatesPayload | null>(null);
  const [limitupPool, setLimitupPool] = useState<CandidateStock[]>([]);
  const [limitupPoolStatus, setLimitupPoolStatus] = useState<"LIVE" | "FINAL" | "UNAVAILABLE">("FINAL");
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [iteration, setIteration] = useState<IterationData | null>(null);
  const [iterationLoading, setIterationLoading] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<ReviewAttributionPayload | null>(null);
  const [marketSession, setMarketSession] = useState<MarketSessionInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interval timer reference
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- HEARTBEAT CADENCE (as requested: 仅模拟盘/已买入股票需要实时盯盘) ---
  //  * Non-trading window: no polling at all (idle).
  //  * Trading + NON-EMPTY holdings: short-ish 6s tick for watchlist price /
  //    trailing-stop monitoring.
  //  * Trading + ZERO holdings: 45s lazy tick. With nothing in-watchlist we
  //    don't need 3s churn. Buying happens only at 09:30 (scheduler fires it).
  // -------------------------------------------------------------------------
  const computeIntervalMs = useCallback((): number | null => {
    if (!marketSession?.today_date || marketSession.current_time_beijing >= "15:30:00") return null;
    const holdings = portfolio?.holdings || [];
    return holdings.length > 0 ? 6000 : 15000;
  }, [marketSession?.today_date, marketSession?.current_time_beijing, portfolio?.holdings]);

  // Dismissed alert IDs to prevent repetitive alerts
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("dismissed_sell_alerts");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Dismissed BUY alert IDs (symmetric to dismissedAlerts for sell alerts)
  const [dismissedBuyAlerts, setDismissedBuyAlerts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("dismissed_buy_alerts");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // --- SOUND TOGGLE -------------------------------------------------------
  // 交易提醒声音开关，默认开启，状态持久化到 localStorage。
  // 用 Web Audio API 生成 beep，不依赖任何外部音频文件。
  // 买入 = 两声高音 (880Hz → 1175Hz)；卖出 = 三声低音 (523Hz → 392Hz → 330Hz)。
  // -------------------------------------------------------------------------
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("trade_alert_sound_enabled");
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeepSequence = useCallback(
    (freqs: number[], intervalMs: number = 180, durationMs: number = 220) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (!Ctx) return;
          audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        // Resume if suspended (浏览器自动暂停策略)
        if (ctx.state === "suspended") ctx.resume();

        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          const startAt = ctx.currentTime + (idx * intervalMs) / 1000;
          const endAt = startAt + durationMs / 1000;
          gain.gain.setValueAtTime(0.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startAt);
          osc.stop(endAt);
        });
      } catch (err) {
        // Audio not available (e.g. SSR, permissions) — silently ignore
        console.warn("playBeepSequence failed:", err);
      }
    },
    [soundEnabled]
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("trade_alert_sound_enabled", String(next));
      } catch {}
      // 切换到开启时立刻播放一声短 beep 作为反馈
      if (next) {
        setTimeout(() => playBeepSequence([880], 100, 180), 50);
      }
      return next;
    });
  }, [playBeepSequence]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch ALL core system data (full payload, used ONLY for FIRST page load
  // and user-initiated manual refresh actions).
  //
  // PERFORMANCE / "Never hang on spinner" contract:
  //  * All 7 endpoints run in parallel via Promise.all — so total time is the
  //    SLOWEST single endpoint (not the sum).
  //  * 4s hard cap via AbortController. Any endpoint still in-flight after 4s
  //    gets aborted so we hit the finally block, flip firstLoadDone, and show
  //    whatever data we managed to get. The loading skeleton is GUARANTEED to
  //    disappear within 4 seconds.
  //  * During non-trading hours, we intentionally avoid calling
  //    /api/portfolio/sync here (pure cache GET only).
  const fetchAllData = useCallback(async () => {
    // ---- Hard timeout setup --------------------------------------------------
    const abortCtl = new AbortController();
    const hardTimeoutMs = 4000;
    const timeoutId = setTimeout(() => abortCtl.abort(), hardTimeoutMs);
    const signal = abortCtl.signal;

    try {
      // ---- 1) Status — fetched first so we know how to fetch portfolio --------
      let currentSession: MarketSessionInfo | null = null;
      try {
        const statusRes = await fetch("/api/status", { signal });
        const statusJson = await statusRes.json();
        currentSession =
          statusJson.success && statusJson.data?.market_session
            ? statusJson.data.market_session
            : null;
        if (currentSession) setMarketSession(currentSession);
      } catch { /* swallow; setters below use best-effort data */ }

      // ---- 2) Everything else in parallel (total time = max single endpoint) ---
      // Resolve effective date: prefer today_date (calendar), fall back to
      // trade_date (last trading day) so the pool fetch is never skipped.
      const effectiveDate = currentSession?.today_date || currentSession?.trade_date || "";
      const isBeforeClose = (currentSession?.current_time_beijing || "") < "15:30:00";
      const [sentimentJson, candJson, poolJson, portJson, iterJson, reviewJson] =
        await Promise.all([
          fetch("/api/sentiment", { signal }).then((r) => r.json()).catch(() => ({ success: false })),
          fetch("/api/candidates", { signal }).then((r) => r.json()).catch(() => ({ success: false })),
            (effectiveDate
              ? (isBeforeClose
                ? fetch(`/api/limitup-pool/live?date=${effectiveDate}`, { signal }).then((r) => r.json()).catch(() => ({ success: false }))
                : fetch(`/api/limitup-pool?date=${effectiveDate}`, { signal }).then((r) => r.json()).catch(() => ({ success: false })))
              : Promise.resolve({ success: false })
            ),
          // Portfolio: always sync once on page entry, including off-hours.
          // The quote endpoint returns the latest available market price after
          // close, while a cache-only GET can remain stale for several days.
          fetch("/api/portfolio/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: currentSession?.today_date || "", blocking: true }),
            signal
          }).then((r) => r.json()).catch(() => ({ success: false })),
          fetch("/api/iteration/data", { signal }).then((r) => r.json()).catch(() => ({ success: false })),
          fetch("/api/review/aug24-evaluation", { signal }).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

      if (sentimentJson.success) setSentiment(sentimentJson.data);
      if (candJson.success) setCandidatesPayload(candJson.data);
      if (poolJson.success) {
        setLimitupPool(poolJson.data);
        setLimitupPoolStatus(poolJson.data_status === "LIVE" || poolJson.data_status === "LIVE_CACHED" ? "LIVE" : "FINAL");
      } else if (isBeforeClose && effectiveDate) {
        // Live fetch failed during trading hours — fall back to FINAL cache
        // so the UI shows the most recent snapshot instead of going blank.
        try {
          const finalRes = await fetch(`/api/limitup-pool?date=${effectiveDate}`, { signal });
          const finalJson = await finalRes.json();
          if (finalJson.success) {
            setLimitupPool(finalJson.data);
            setLimitupPoolStatus("FINAL");
          } else {
            setLimitupPool([]);
            setLimitupPoolStatus("UNAVAILABLE");
          }
        } catch {
          setLimitupPool([]);
          setLimitupPoolStatus("UNAVAILABLE");
        }
      } else {
        setLimitupPool([]);
        setLimitupPoolStatus("UNAVAILABLE");
      }
      if (portJson.success) setPortfolio(portJson.data);
      if (iterJson.success) setIteration(iterJson.data);
      if (reviewJson.success) setReviewData(reviewJson.data);
    } catch (err) {
      // AbortError (timeout) or network failure — we still want firstLoadDone
      // flipped below so the skeleton screen disappears.
      console.warn("fetchAllData aborted / failed (partial data will show):", err);
    } finally {
      clearTimeout(timeoutId);
      setFirstLoadDone(true);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // SILENT HEARTBEAT — used by the 6s / 45s polling loop.
  // * NEVER shows spinners / skeletons (preserves old UI state while refreshing).
  // * Trading session → POST /sync so the backend monitors holdings and
  //   evaluates the three ranked-candidate entry strategies.
  // * Off-hours → pure GET /portfolio (cache only, no Python fork).
  // * Skips sentiment / candidates / limitup / iteration / review because
  //   those are end-of-day artifacts refreshed once at 15:30 + 15:35.
  // ---------------------------------------------------------------------------
  const pollSilentTick = useCallback(async (forceBlocking = false) => {
    if (pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    try {
      // 1. Status (cheap, <10ms, needed so we can short-circuit when off-hours)
      const statusRes = await fetch("/api/status");
      const statusJson = await statusRes.json();
      const currentSession: MarketSessionInfo | null =
        statusJson.success && statusJson.data?.market_session
          ? statusJson.data.market_session
          : null;
      if (currentSession) setMarketSession(currentSession);

      const beforeFinalSnapshot = Boolean(
        currentSession?.today_date && currentSession.current_time_beijing < "15:30:00"
      );

      // Before 15:30, including the noon break, use the current day's live
      // pool. After 15:30, use the day's FINAL snapshot.
      if (beforeFinalSnapshot && Date.now() - lastLivePoolFetchRef.current >= 15000) {
        lastLivePoolFetchRef.current = Date.now();
        const livePoolRes = await fetch(`/api/limitup-pool/live?date=${currentSession?.today_date || currentSession?.trade_date || ""}`);
        const livePoolJson = await livePoolRes.json();
        if (livePoolJson.success) {
          setLimitupPool(livePoolJson.data);
          setLimitupPoolStatus(livePoolJson.data_status === "LIVE" || livePoolJson.data_status === "LIVE_CACHED" ? "LIVE" : "FINAL");
        } else {
          // Live fetch failed — fall back to FINAL cache snapshot
          const effDate = currentSession?.today_date || currentSession?.trade_date || "";
          if (effDate) {
            try {
              const finalRes = await fetch(`/api/limitup-pool?date=${effDate}`);
              const finalJson = await finalRes.json();
              if (finalJson.success) {
                setLimitupPool(finalJson.data);
                setLimitupPoolStatus("FINAL");
              } else {
                setLimitupPool([]);
                setLimitupPoolStatus("UNAVAILABLE");
              }
            } catch {
              setLimitupPool([]);
              setLimitupPoolStatus("UNAVAILABLE");
            }
          } else {
            setLimitupPool([]);
            setLimitupPoolStatus("UNAVAILABLE");
          }
        }
      } else if (!beforeFinalSnapshot && !currentSession?.is_trading_active) {
        const portRes = await fetch("/api/portfolio/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: currentSession?.today_date || "",
            blocking: forceBlocking,
            watchlist_only: true,
          }),
        });
        const portJson = await portRes.json();
        if (portJson.success) setPortfolio(portJson.data);
        return;
      }
        if (!currentSession?.today_date && !currentSession?.trade_date) {
          setLimitupPool([]);
          setLimitupPoolStatus("UNAVAILABLE");
          return;
        }

      // 2. We have something in the watchlist → background watchlist refresh.
      //    Server replies in <50ms with last-known-good cache; python refreshes
      //    exit-monitoring + holding quotes without blocking the UI.
      try {
        const syncRes = await fetch("/api/portfolio/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: currentSession.today_date || "",
            blocking: forceBlocking,
            // Resume/focus refreshes quotes only; it must not duplicate an opening buy.
            watchlist_only: forceBlocking,
          }),
        });
        const syncJson = await syncRes.json();
        if (syncJson.success) setPortfolio(syncJson.data);
      } catch {
        // Fallback — just return what we cached last time
        const portRes = await fetch("/api/portfolio");
        const portJson = await portRes.json();
        if (portJson.success) setPortfolio(portJson.data);
      }
    } catch (err) {
      console.warn("Silent poll tick failed (will retry on next interval):", err);
    } finally {
      pollInFlightRef.current = false;
    }
  }, [sentiment?.trade_date, portfolio?.holdings]);

  // Browser background tabs can suspend timers. Refresh immediately when the
  // user returns so the portfolio cannot remain on a multi-day cache snapshot.
  useEffect(() => {
    const refreshOnResume = () => {
      if (document.visibilityState === "visible") {
        void pollSilentTick(true);
      }
    };
    document.addEventListener("visibilitychange", refreshOnResume);
    window.addEventListener("focus", refreshOnResume);
    return () => {
      document.removeEventListener("visibilitychange", refreshOnResume);
      window.removeEventListener("focus", refreshOnResume);
    };
  }, [pollSilentTick]);

  // Timeline step simulation handler
  const handleTimelineStep = async (step: string) => {
    setTimelineLoading(true);
    try {
      const res = await fetch("/api/timeline/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step })
      });
      const json = await res.json();
      if (json.success) {
        if (json.data.portfolio) setPortfolio(json.data.portfolio);
        if (json.data.reviewData) setReviewData(json.data.reviewData);
        showToast(`✓ 时间轴已切换: ${json.message}`);
      }
    } catch (err: any) {
      showToast(`❌ 切换失败: ${err.message}`);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Realtime manual sync handler
  const handleSyncRealtimePortfolio = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch("/api/portfolio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: marketSession?.today_date || "" })
      });
      const json = await res.json();
      if (json.success) {
        setPortfolio(json.data);
        showToast("✓ 盯盘清单与行情已实时刷新！");
      }
    } catch (err: any) {
      showToast(`❌ 刷新失败: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // Manual sell position handler
  const handleManualSellPosition = async (code: string) => {
    try {
      const res = await fetch("/api/portfolio/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reason: "用户在盯盘清单手动平仓" })
      });
      const json = await res.json();
      if (json.success) {
        setPortfolio(json.data);
        showToast(`✓ 标的 ${code} 已完成平仓撮合并结算收益！`);
      } else {
        showToast(`❌ 平仓失败: ${json.error}`);
      }
    } catch (err: any) {
      showToast(`❌ 异常: ${err.message}`);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => {
      const next = new Set(prev);
      next.add(alertId);
      try {
        localStorage.setItem("dismissed_sell_alerts", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleDismissAllAlerts = () => {
    const allIds = (portfolio?.recent_sell_alerts || []).map((a) => a.alert_id);
    setDismissedAlerts((prev) => {
      const next = new Set([...Array.from(prev), ...allIds]);
      try {
        localStorage.setItem("dismissed_sell_alerts", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // --- BUY ALERT DISMISS HANDLERS (symmetric to sell alerts) ---------------
  const handleDismissBuyAlert = (alertId: string) => {
    setDismissedBuyAlerts((prev) => {
      const next = new Set(prev);
      next.add(alertId);
      try {
        localStorage.setItem("dismissed_buy_alerts", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleDismissAllBuyAlerts = () => {
    const allIds = (portfolio?.recent_buy_alerts || []).map((a) => a.alert_id);
    setDismissedBuyAlerts((prev) => {
      const next = new Set([...Array.from(prev), ...allIds]);
      try {
        localStorage.setItem("dismissed_buy_alerts", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const fetchIteration = useCallback(async () => {
    setIterationLoading(true);
    try {
      const res = await fetch("/api/iteration/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: sentiment?.trade_date || "" })
      });
      const json = await res.json();
      if (json.success) {
        setIteration(json.data);
        showToast("✓ 影子回测与策略归因评估完成！");
      }
    } catch (err) {
      console.error("Error running iteration shadow backtest:", err);
    } finally {
      setIterationLoading(false);
    }
  }, [sentiment?.trade_date]);

  const handleApproveIteration = async (customParams?: Record<string, number>) => {
    setIterationLoading(true);
    try {
      const res = await fetch("/api/iteration/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: customParams || null })
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ 策略自迭代微调参数已热更新上线！");
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(`❌ 审批失败: ${err.message}`);
    } finally {
      setIterationLoading(false);
    }
  };

  const handleRejectIteration = async () => {
    setIterationLoading(true);
    try {
      const res = await fetch("/api/iteration/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "人工复核后驳回" })
      });
      const json = await res.json();
      if (json.success) {
        showToast("已驳回本次自迭代建议，保持线上原有参数运行。");
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(`❌ 驳回失败: ${err.message}`);
    } finally {
      setIterationLoading(false);
    }
  };

  // Initial Load & Dynamic Polling:
  // - First page load: full fetch + skeletons until done.
  // - HEARTBEAT RULE (user-requested: 只有模拟盘与已买入股票盯盘是实时的，
  //                    其余都在15:30后盘后运行一次即可):
  //   * Off-hours (computeIntervalMs returns null) → no polling at all.
  //   * Trading + NON-EMPTY holdings → 6s tick.
  //   * Trading + ZERO holdings → 45s tick.
  useEffect(() => {
    fetchAllData();

    // Safety net — never show the full-screen spinner longer than 5s.
    const failSafe = setTimeout(() => {
      setFirstLoadDone((prev) => (prev ? prev : true));
    }, 5000);
    return () => clearTimeout(failSafe);
  }, [fetchAllData]);

  useEffect(() => {
    // Do not start another full fetch while the initial request is still in flight.
    // The heartbeat becomes eligible only after the first load has completed.
    if (!firstLoadDone) {
      return;
    }

    const intervalMs = computeIntervalMs();

    // Off-hours: kill the timer (satisfies "非交易时间/无持仓 → 不轮询").
    if (intervalMs == null) {
      return;
    }

    const interval = setInterval(() => {
      pollSilentTick();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    computeIntervalMs,
    pollSilentTick,
    fetchAllData,
    firstLoadDone,
  ]);

  // Action Handlers
  const handleResetAccount = async () => {
    if (!window.confirm("确定要清空模拟盘数据并重置为 10 万元本金吗？")) {
      return;
    }
    setLoadingAction("reset");
    try {
      const res = await fetch("/api/action/reset-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capital: 100000.0 })
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ 模拟盘账户已清空重置为 ¥100,000 初始本金！");
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(`❌ 重置异常: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Filter active un-dismissed sell alerts
  const activeSellAlerts: SellAlertCardData[] = (portfolio?.recent_sell_alerts || []).filter(
    (a) => !dismissedAlerts.has(a.alert_id)
  );

  // Filter active un-dismissed BUY alerts (symmetric to sell alerts)
  const activeBuyAlerts: BuyAlertCardData[] = (portfolio?.recent_buy_alerts || []).filter(
    (a) => !dismissedBuyAlerts.has(a.alert_id)
  );

  // --- SOUND TRIGGER ------------------------------------------------------
  // 监听 active buy/sell alerts 数量变化，新增提醒时播放对应 beep：
  //   买入 = 两声高音 (880Hz → 1175Hz)，轻快上扬
  //   卖出 = 三声低音 (523Hz → 392Hz → 330Hz)，沉缓下落
  // 仅在数量增加时触发（用户 dismiss 不发声），并跳过首次冷启动避免开机噪音。
  // -------------------------------------------------------------------------
  const prevBuyCountRef = useRef<number>(0);
  const prevSellCountRef = useRef<number>(0);
  const firstSoundSkipRef = useRef<boolean>(true);

  useEffect(() => {
    const buyCount = activeBuyAlerts.length;
    const sellCount = activeSellAlerts.length;

    if (firstSoundSkipRef.current) {
      // 首次挂载只同步基线，不触发声音（避免冷启动 beep）
      prevBuyCountRef.current = buyCount;
      prevSellCountRef.current = sellCount;
      firstSoundSkipRef.current = false;
      return;
    }

    if (buyCount > prevBuyCountRef.current) {
      // 买入 beep：两声高音上扬
      playBeepSequence([880, 1175], 200, 240);
    }
    if (sellCount > prevSellCountRef.current) {
      // 卖出 beep：三声低音下沉
      playBeepSequence([523, 392, 330], 220, 260);
    }

    prevBuyCountRef.current = buyCount;
    prevSellCountRef.current = sellCount;
  }, [activeBuyAlerts.length, activeSellAlerts.length, playBeepSequence]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm shadow-2xl flex items-center gap-3 animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sound Toggle Button — 右上角浮动，避免依赖 Header 内部结构 */}
      <button
        onClick={toggleSound}
        title={soundEnabled ? "点击静音交易提醒" : "点击开启交易提醒声音"}
        className={`fixed top-3 right-3 z-50 p-2 rounded-lg border backdrop-blur-md transition shadow-lg ${
          soundEnabled
            ? "bg-emerald-950/80 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/80"
            : "bg-slate-800/80 border-slate-600 text-slate-400 hover:bg-slate-700/80"
        }`}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Sell Alert Modal Popups for Strategies */}
      <SellAlertModal
        alerts={activeSellAlerts}
        onDismiss={handleDismissAlert}
        onDismissAll={handleDismissAllAlerts}
      />

      {/* Buy Alert Modal Popups (左下角，与卖出提醒对称) */}
      <BuyAlertModal
        alerts={activeBuyAlerts}
        onDismiss={handleDismissBuyAlert}
        onDismissAll={handleDismissAllBuyAlerts}
      />

      {/* Navigation Header */}
      <Header
        nav={portfolio?.nav ?? 1.0}
        totalAsset={portfolio?.total_asset ?? 100000}
        tradeDate={sentiment?.trade_date || ""}
        sentimentScore={sentiment?.sentiment_score ?? 0}
        circuitBreaker={sentiment?.sentiment_circuit_breaker ?? false}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetAccount={handleResetAccount}
        loadingAction={loadingAction}
        marketSession={marketSession}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === "portfolio" && (
          <PortfolioView 
            portfolio={portfolio} 
            // Full-screen loading only on pure cold start. Once firstLoadDone
            // flips to true (≤5s guaranteed) we NEVER block the UI again.
            loading={!firstLoadDone && portfolio === null}
            onSyncRealtime={handleSyncRealtimePortfolio}
            onManualSell={handleManualSellPosition}
            syncLoading={syncLoading}
          />
        )}

        {activeTab === "aug24review" && (
          <ReviewAttributionView
            data={reviewData}
            portfolio={portfolio}
            onTimelineStep={handleTimelineStep}
            loadingStep={timelineLoading}
            onNavigateToPortfolio={() => setActiveTab("portfolio")}
          />
        )}

        {activeTab === "candidates" && (
          <CandidatesView payload={candidatesPayload} sentiment={sentiment} marketSession={marketSession} loading={!firstLoadDone && !candidatesPayload} />
        )}

        {activeTab === "iteration" && (
          <IterationView
            data={iteration}
            loading={!firstLoadDone && !iteration}
            onRefresh={fetchIteration}
            onApprove={handleApproveIteration}
            onReject={handleRejectIteration}
            actionLoading={iterationLoading}
          />
        )}


        {activeTab === "limitup" && (
          <LimitUpPoolView
            pool={limitupPool}
            loading={!firstLoadDone && limitupPool.length === 0}
            tradeDate={limitupPoolStatus === "LIVE" ? (marketSession?.today_date || "") : (sentiment?.trade_date || "")}
            isLive={limitupPoolStatus === "LIVE"}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        A-Share Limit-Up Quant Trading System · 严禁伪造Mock数据 · 基于 AkShare / 东方财富 / 新浪 / 腾讯 真实行情接口与分位数打分模型
      </footer>
    </div>
  );
}

export default App;

