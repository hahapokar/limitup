import React from "react";
import { BuyAlertCardData } from "../types";
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  Flame,
  Zap,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";

interface BuyAlertModalProps {
  alerts: BuyAlertCardData[];
  onDismiss: (alertId: string) => void;
  onDismissAll: () => void;
}

export const BuyAlertModal: React.FC<BuyAlertModalProps> = ({
  alerts,
  onDismiss,
  onDismissAll,
}) => {
  if (!alerts || alerts.length === 0) return null;

  const strategyBadge = (
    strategy: string,
    strategyName: string
  ): { label: string; bgColor: string; icon: React.ComponentType<{ className?: string }> } => {
    if (strategy === "OPENING") {
      return {
        label: strategyName || "开盘竞价买入",
        bgColor: "bg-amber-950/80 text-amber-300 border-amber-600/60",
        icon: Clock,
      };
    }
    if (strategy === "REBREAK") {
      return {
        label: strategyName || "炸板回封买入",
        bgColor: "bg-rose-950/80 text-rose-300 border-rose-600/60",
        icon: Flame,
      };
    }
    if (strategy === "PULLBACK") {
      return {
        label: strategyName || "强势回踩买入",
        bgColor: "bg-indigo-950/80 text-indigo-300 border-indigo-600/60",
        icon: Zap,
      };
    }
    return {
      label: strategyName || "买入",
      bgColor: "bg-slate-800 text-slate-300 border-slate-600",
      icon: ShoppingCart,
    };
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-md w-full space-y-3 pointer-events-auto">
      {alerts.slice(0, 3).map((alert) => {
        const badge = strategyBadge(alert.strategy, alert.strategy_name);
        const BadgeIcon = badge.icon;
        const isPremium = alert.change_pct_at_entry >= 0;

        return (
          <div
            key={alert.alert_id}
            className="rounded-xl border shadow-2xl p-4 bg-slate-900/95 backdrop-blur-md transition-all duration-300 transform animate-in slide-in-from-bottom-5 border-emerald-500/50 shadow-emerald-950/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bgColor}`}>
                  <BadgeIcon className="w-3 h-3" />
                  {badge.label}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {alert.time}
                </span>
              </div>
              <button
                onClick={() => onDismiss(alert.alert_id)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
                title="关闭通知"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{alert.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({alert.code})</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    已建仓 · 进入盯盘池实时跟踪止盈止损
                  </p>
                </div>

                {/* 涨幅 Block */}
                <div className="text-right">
                  <div className={`text-base font-black font-mono ${isPremium ? "text-red-400" : "text-emerald-400"}`}>
                    {isPremium ? "+" : ""}{alert.change_pct_at_entry.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">入场涨幅</div>
                </div>
              </div>

              {/* Execution Details Table */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-lg p-2 text-xs border border-slate-800/80 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">买入价</span>
                  <span className="text-emerald-300 font-bold">¥{alert.buy_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">数量</span>
                  <span className="text-slate-300">{alert.shares.toLocaleString()} 股</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">金额</span>
                  <span className="text-slate-300">¥{alert.amount.toFixed(0)}</span>
                </div>
              </div>

              {/* Strategy & Ranking */}
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  排名 #{alert.rank}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  得分 {alert.quant_score} 分
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {alert.sector}
                </span>
              </div>

              {/* Reason Explanation */}
              <div className="text-xs text-slate-300 bg-slate-800/40 rounded p-2 border border-slate-800 text-[11px] leading-relaxed">
                <span className="text-emerald-400 font-semibold">触发原因: </span>
                {alert.reason}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                T+0 锁仓 · 次交易日可卖
              </span>
              <button
                onClick={() => onDismiss(alert.alert_id)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] border border-slate-700 transition"
              >
                我知道了
              </button>
            </div>
          </div>
        );
      })}

      {alerts.length > 1 && (
        <div className="text-right">
          <button
            onClick={onDismissAll}
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 transition"
          >
            一键清除所有买入通知 ({alerts.length})
          </button>
        </div>
      )}
    </div>
  );
};
