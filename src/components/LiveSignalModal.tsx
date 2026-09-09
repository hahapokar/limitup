import React from "react";
import { AlertTriangle, X, Radio, ShieldAlert } from "lucide-react";
import { LiveSellSignal } from "../types";

interface Props {
  alerts: LiveSellSignal[];
  source: "limitup" | "non-limitup";
  onDismiss: (alertId: string) => void;
  onDismissAll: () => void;
}

export const LiveSignalModal: React.FC<Props> = ({ alerts, source, onDismiss, onDismissAll }) => {
  if (!alerts.length) return null;
  const isLimitup = source === "limitup";
  const palette = isLimitup
    ? { border: "border-orange-500/70", badge: "bg-orange-950 text-orange-200 border-orange-600", title: "打板实盘卖出信号", accent: "text-orange-300" }
    : { border: "border-cyan-500/70", badge: "bg-cyan-950 text-cyan-200 border-cyan-600", title: "非打板实盘卖出信号", accent: "text-cyan-300" };
  return <div className={`fixed ${isLimitup ? "top-24" : "top-[28rem]"} right-5 z-50 max-w-md w-full space-y-3 pointer-events-auto`}>
    {alerts.slice(0, 3).map((alert) => <div key={alert.alert_id} className={`rounded-xl border-2 ${palette.border} shadow-2xl p-4 bg-slate-950/95 backdrop-blur-md animate-in slide-in-from-right-5`}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold border ${palette.badge}`}>
          {isLimitup ? <ShieldAlert className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}{palette.title}
        </span>
        <button onClick={() => onDismiss(alert.alert_id)} className="text-slate-400 hover:text-white p-1" title="关闭通知"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div><div className="font-bold text-slate-100">{alert.name} <span className="text-xs text-slate-400">({alert.code})</span></div><div className={`text-xs font-bold mt-1 ${palette.accent}`}>{alert.rule_type}</div></div>
        <div className="text-right font-mono"><div className="text-slate-200">¥{Number(alert.sell_price || 0).toFixed(2)}</div><div className="text-[11px] text-slate-500">{alert.time}</div></div>
      </div>
      <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed"><AlertTriangle className={`inline w-3.5 h-3.5 mr-1 ${palette.accent}`} />{alert.reason}</div>
      <div className="mt-3 text-[11px] text-slate-500">仅提示，不自动下单 · 请人工确认后执行</div>
    </div>)}
    {alerts.length > 1 && <button onClick={onDismissAll} className="text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded border border-slate-700">清除本组信号 ({alerts.length})</button>}
  </div>;
};
