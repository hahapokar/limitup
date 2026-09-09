import React, { useState } from "react";
import { BarChart3, Plus, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { WatchPosition } from "../types";

interface Props {
  positions: WatchPosition[];
  sentiment?: string;
  onAdd: (payload: { code: string; entry_price: number; shares: number; holding_days: number }) => Promise<void>;
  onRemove: (code: string) => Promise<void>;
  onRefresh: () => void;
  loading?: boolean;
}

const modeLabel: Record<string, string> = {
  deep_stuck: "深套模式",
  high_volatility: "高波动模式",
  normal: "常规短线",
};

export const NonLimitWatchView: React.FC<Props> = ({ positions, sentiment, onAdd, onRemove, onRefresh, loading = false }) => {
  const [form, setForm] = useState({ code: "", entry_price: "", shares: "100", holding_days: "0" });
  const [adding, setAdding] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdding(true);
    try {
      await onAdd({ code: form.code.trim(), entry_price: Number(form.entry_price), shares: Number(form.shares), holding_days: Number(form.holding_days) });
      setForm({ code: "", entry_price: "", shares: "100", holding_days: "0" });
    } finally { setAdding(false); }
  };
  const num = (value?: number, digits = 2) => value == null || Number.isNaN(value) ? "--" : value.toFixed(digits);
  return <div className="space-y-6">
    <div className="bg-slate-900 border border-cyan-800/60 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-300"><BarChart3 className="w-5 h-5" /></div><div><h2 className="text-base font-bold text-slate-100">非打板股票实时盯盘</h2><p className="text-xs text-slate-400 mt-1">独立于涨停策略，按成本、持仓天数和技术结构生成做T/减仓提示。</p></div></div>
      <div className="flex items-center gap-2 text-xs"><span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">市场情绪：{sentiment || "暂无"}</span><button onClick={onRefresh} disabled={loading} className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />刷新行情</button></div>
    </div>
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
        {([ ["股票代码", "code", "000001", "text"], ["买入成本", "entry_price", "12.345", "number"], ["股数", "shares", "100", "number"], ["持仓天数", "holding_days", "0", "number"] ] as const).map(([label, key, placeholder, type]) => <label key={key} className="text-[11px] text-slate-400">{label}<input required type={type} min={type === "number" ? "0" : undefined} step={key === "shares" || key === "holding_days" ? "1" : "0.001"} value={form[key]} placeholder={placeholder} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-2 text-sm text-slate-100" /></label>)}
        <button disabled={adding} className="h-9 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"><Plus className="w-4 h-4" />{adding ? "添加中..." : "加入盯盘"}</button>
      </form>
      <p className="text-[11px] text-slate-500 mt-3">盈亏已扣除买卖合计约 0.1% 成本；持仓天数按交易日刷新。指标样本不足时不会发出技术信号。</p>
    </div>
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
      {positions.length === 0 ? <div className="py-16 text-center text-slate-500 text-sm">暂无非打板股票，手动添加后开始盯盘。</div> : <table className="w-full text-left text-xs"><thead className="bg-slate-800/70 text-slate-300"><tr><th className="py-3 px-3">标的</th><th className="py-3 px-3">现价/成本</th><th className="py-3 px-3">盈亏</th><th className="py-3 px-3">持仓/模式</th><th className="py-3 px-3">日线均线</th><th className="py-3 px-3">技术指标</th><th className="py-3 px-3">策略信号</th><th className="py-3 px-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-800/80">{positions.map((p) => <tr key={p.code} className="hover:bg-slate-800/40"><td className="py-3 px-3"><div className="font-bold text-slate-100">{p.name}</div><div className="text-slate-500">{p.code} · {p.quote_status === "LIVE" ? "LIVE" : "STALE"}</div></td><td className="py-3 px-3"><div className="text-cyan-300">¥{num(p.current_price)}</div><div className="text-slate-400">成本 ¥{num(p.entry_price, 3)}</div></td><td className={`py-3 px-3 font-semibold ${(p.unrealized_pnl_pct ?? 0) >= 0 ? "text-red-300" : "text-emerald-300"}`}>¥{num(p.unrealized_pnl)}<div>{num(p.unrealized_pnl_pct)}%</div><div className="text-[10px] text-slate-500">已含0.1%</div></td><td className="py-3 px-3"><div className="text-slate-200">T+{p.holding_days}</div><span className="text-cyan-300">{modeLabel[p.strategy_mode || "normal"] || p.strategy_mode}</span></td><td className="py-3 px-3 text-slate-300"><div>MA5 {num(p.ma5_daily, 3)}</div><div>MA10 {num(p.ma10_daily, 3)}</div><div>MA20 {num(p.ma20_daily, 3)}</div><div className="text-[10px] text-slate-500">{p.daily_ma_note || "暂无日线"}</div></td><td className="py-3 px-3 text-slate-300"><div>Bias {num(p.bias)}% · RSI {num(p.rsi_1m)}</div><div className="text-[10px] text-slate-500">{p.indicator_note || "--"}</div></td><td className="py-3 px-3">{p.sell_signal ? <div className="max-w-sm"><span className="px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold">{p.sell_signal.rule_type}</span><div className="mt-1 text-rose-200">{p.sell_signal.reason}</div></div> : <span className="text-slate-500">{p.strategy_status || "暂无信号"}</span>}</td><td className="py-3 px-3 text-right"><button onClick={() => onRemove(p.code)} className="px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-700 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" />移除</button></td></tr>)}</tbody></table>}
    </div>
    <div className="text-[11px] text-slate-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" />本模块只提供策略提示，不自动下单；历史K线：{positions.every((p) => p.history_status === "READY") ? "已接入" : "部分股票等待或无法获取"}。缺少数据时不会臆测指标。</div>
  </div>;
};
