import React, { useState } from "react";
import { 
  Settings, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  Layers, 
  Award, 
  Clock, 
  Percent, 
  Calculator, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  HelpCircle,
  BarChart3,
  BookOpen,
  Target,
  ShoppingCart,
  LogOut,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  MinusCircle,
  Gauge
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const [activeSubSection, setActiveSubSection] = useState<"all" | "sentiment" | "factors" | "trading" | "simulator">("all");

  // Simulator State for interactive factor score testing
  const [simConsecutive, setSimConsecutive] = useState<number>(2);
  const [simSentimentState, setSimSentimentState] = useState<string>("震荡/分化期");
  const [simIsLeader, setSimIsLeader] = useState<boolean>(false);
  const [simSealRatio, setSimSealRatio] = useState<number>(0.15);
  const [simSealTime, setSimSealTime] = useState<string>("09:42:00");
  const [simTurnover, setSimTurnover] = useState<number>(8.5);
  const [simBrokenCount, setSimBrokenCount] = useState<number>(0);
  const [simHighBreakout, setSimHighBreakout] = useState<boolean>(true);
  const [simSectorRank, setSimSectorRank] = useState<number>(85);
  const [simHasFollower, setSimHasFollower] = useState<boolean>(true);

  // Calculate simulated factor 1: 连板与情绪 (30%)
  const calculateSimFactor1 = () => {
    let base = 50;
    if (simConsecutive >= 5) base = 95;
    else if (simConsecutive >= 3) base = 75;
    else if (simConsecutive === 2) base = 65;

    let adj = 0;
    if (simSentimentState === "退潮/弱势期" || simSentimentState === "熔断状态") {
      if (simConsecutive === 3 || simConsecutive === 4) adj -= 30;
      else if (simConsecutive === 1 || simConsecutive === 2) adj += 10;
    } else if (simSentimentState === "主升/强势期") {
      if (simIsLeader) adj += 15;
    }

    const score = Math.max(0, Math.min(100, base + adj));
    return { score, base, adj };
  };

  // Calculate simulated factor 2: 封板强度 (25%)
  const calculateSimFactor2 = () => {
    // seal ratio percentile proxy
    const sealRatioScore = Math.min(100, (simSealRatio / 0.3) * 100);
    
    // time score
    let timeScore = 50;
    if (simSealTime <= "09:35:00") timeScore = 100;
    else if (simSealTime <= "09:45:00") timeScore = 90;
    else if (simSealTime <= "10:00:00") timeScore = 80;
    else if (simSealTime <= "11:30:00") timeScore = 60;
    else if (simSealTime <= "14:00:00") timeScore = 40;
    else timeScore = 20;

    const score = Math.round(sealRatioScore * 0.6 + timeScore * 0.4);
    return { score: Math.min(100, score), sealRatioScore, timeScore };
  };

  // Calculate simulated factor 3: 筹码与炸板 (25%)
  const calculateSimFactor3 = () => {
    let turnoverScore = 30;
    if (simTurnover >= 5.0 && simTurnover <= 18.0) turnoverScore = 100;
    else if (simTurnover >= 3.0 && simTurnover <= 25.0) turnoverScore = 75;
    else if (simTurnover < 3.0) turnoverScore = 45;

    const breakoutBonus = simHighBreakout ? 20 : 0;
    const chipSub = Math.min(100, turnoverScore * 0.8 + breakoutBonus);

    let brokenScore = 100;
    if (simBrokenCount === 1) brokenScore = 60;
    else if (simBrokenCount === 2) brokenScore = 30;
    else if (simBrokenCount >= 3) brokenScore = 10;

    const score = Math.round(chipSub * 0.6 + brokenScore * 0.4);
    return { score: Math.min(100, score), turnoverScore, brokenScore };
  };

  // Calculate simulated factor 4: 板块共振 (20%)
  const calculateSimFactor4 = () => {
    const followerScore = simHasFollower ? 30 : 0;
    const score = Math.round(Math.min(100, simSectorRank * 0.7 + followerScore));
    return { score, sectorScore: simSectorRank, followerScore };
  };

  const f1 = calculateSimFactor1();
  const f2 = calculateSimFactor2();
  const f3 = calculateSimFactor3();
  const f4 = calculateSimFactor4();

  const totalScore = Math.round((f1.score * 0.3 + f2.score * 0.25 + f3.score * 0.25 + f4.score * 0.2) * 100) / 100;

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                量化模型底层算法与实盘交易规则白皮书
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Core Math & Logic
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              系统采用“盘中实时数据 + 15:30 当日 FINAL 快照 + 次日严格 T-1 决策”的交易闭环：实时行情只用于当日信号，盘后快照用于四大因子选股，历史数据只用于复盘。
            </p>
          </div>

          {/* Quick Filter Navigation */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveSubSection("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeSubSection === "all" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              全部白皮书
            </button>
            <button
              onClick={() => setActiveSubSection("sentiment")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeSubSection === "sentiment" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              大盘情绪模型
            </button>
            <button
              onClick={() => setActiveSubSection("factors")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeSubSection === "factors" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              四大因子体系
            </button>
            <button
              onClick={() => setActiveSubSection("trading")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeSubSection === "trading" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              实盘风控规则
            </button>
            <button
              onClick={() => setActiveSubSection("simulator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeSubSection === "simulator" ? "bg-amber-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-amber-300"}`}
            >
              🧮 交互试算器
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: 大盘情绪模型 */}
      {(activeSubSection === "all" || activeSubSection === "sentiment") && (
        <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-slate-100">
                一、大盘情绪周期量化模型 (Market Sentiment Timing)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">15:30 盘后全市场多维实时计算</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: 4 Dimensions Calculation */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                1. 情绪打分四维构成与数学权重 (总分 100 分)
              </h4>

              <div className="space-y-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-red-400">① 涨停赚钱效应因子 (权重 30%)</span>
                    <span className="font-mono text-slate-400">Score = min(100, (涨停家数 / 80) × 100)</span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">
                    以全市场 80 家自然涨停为满分基准。当市场涨停家数突破 80 家时，赚钱效应达到极致饱和。
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-400">② 连板空间高度溢价 (权重 25%)</span>
                    <span className="font-mono text-slate-400">Score = min(100, ((最高连板 - 1) / 6) × 100)</span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">
                    衡量游资主升浪空间拓展能力。当市场最高板达到 7 连板及以上时评分为 100 分，代表主线龙头效应极其强盛。
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-purple-400">③ 封板稳定性与炸板惩罚 (权重 25%)</span>
                    <span className="font-mono text-slate-400">Score = (涨停 / (涨停 + 炸板)) × 100</span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">
                    计算封板成功率。封板成功率低于 60% 时，表明日内接力亏钱效应剧增，主力资金在涨停板分歧派发。
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-400">④ 全市场涨跌家数广度 (权重 20%)</span>
                    <span className="font-mono text-slate-400">Score = (上涨家数 / (上涨 + 下跌)) × 100</span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">
                    反映全市场超 5300 只个股的普涨普跌情况，规避指数虚高而个股普跌的“赚指数亏钱”假象。
                  </p>
                </div>
              </div>
            </div>

            {/* Right: States & Circuit Breaker */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                2. 情绪状态判定矩阵与全局熔断机制
              </h4>

              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">情绪区间</th>
                      <th className="py-2.5 px-3">量化状态</th>
                      <th className="py-2.5 px-3">实盘风控动作</th>
                      <th className="py-2.5 px-3">连板因子策略调整</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                    <tr className="bg-rose-950/30">
                      <td className="py-2.5 px-3 text-rose-400 font-bold">&lt; 30 分</td>
                      <td className="py-2.5 px-3 text-rose-300 font-bold">熔断状态</td>
                      <td className="py-2.5 px-3 text-rose-400">强制 0 仓位锁定，禁止一切买入</td>
                      <td className="py-2.5 px-3 text-slate-400">中位股 -30 分，首板 +10 分</td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="py-2.5 px-3 text-amber-400 font-bold">30 ~ 45 分</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">退潮/弱势期</td>
                      <td className="py-2.5 px-3 text-amber-300">仓位降至 30%~50%，严格执行防洗盘止损</td>
                      <td className="py-2.5 px-3 text-amber-400">中位股 (3-4板) -30分 避险；首板 +10分</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-blue-400 font-bold">45 ~ 70 分</td>
                      <td className="py-2.5 px-3 text-blue-300 font-bold">震荡/分化期</td>
                      <td className="py-2.5 px-3 text-slate-300">标准 100% 仓位等权分配</td>
                      <td className="py-2.5 px-3 text-slate-400">常规身位打分，聚焦板块共振前排</td>
                    </tr>
                    <tr className="bg-red-950/30">
                      <td className="py-2.5 px-3 text-red-400 font-bold">&gt; 70 分</td>
                      <td className="py-2.5 px-3 text-red-300 font-bold">主升/强势期</td>
                      <td className="py-2.5 px-3 text-red-300">满仓积极参与，持股锁仓放宽止盈</td>
                      <td className="py-2.5 px-3 text-red-400">空间高度龙头额外 +15 分主升加成</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-lg text-xs text-rose-300/90 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">防爆仓熔断原理：</span>
                  在极端退潮冰点（如千股跌停或连续大面积炸板），游资接力模型胜率大幅衰减。此时系统会自动启动冷冻锁仓，在次日 09:25 拒绝任何买入申报，从底层杜绝复利回撤。
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: 四大因子体系 */}
      {(activeSubSection === "all" || activeSubSection === "factors") && (
        <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-100">
                二、四大因子分位数相对排序打分模型 (4-Factor Model)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">横截面 Percentile-Rank · 总分 100 分</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Factor 1 */}
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-xs">
                    因子 1 · 权重 35%
                  </span>
                  <Layers className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-2">
                  连板阶梯与情绪联动
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Consecutive Board & Sentiment Linkage
                </p>

                <div className="mt-3 space-y-2 text-xs text-slate-300 border-t border-slate-700/60 pt-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">1 连板 (首板):</span>
                    <span className="text-purple-300 font-bold">45 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">2 连板:</span>
                    <span className="text-purple-300 font-bold">70 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3-4 连板 (中位):</span>
                    <span className="text-purple-300 font-bold">85 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">≥5 连板 (高位):</span>
                    <span className="text-purple-300 font-bold">100 分</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-purple-950/40 border border-purple-900/50 text-[11px] text-purple-200">
                ⚡ <strong>联动避险逻辑：</strong>5 板以上按 <code>0.7^(N-5)</code> 衰减高度分，再叠加情绪调整；退潮期 3-4 板扣 30 分、1-2 板加 10 分，主升期空间龙头加 18 分，震荡期龙头加 12 分、2 板加 3 分。
              </div>
            </div>

            {/* Factor 2 */}
            <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs">
                    因子 2 · 权重 15%
                  </span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-2">
                  封板强度因子
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Seal Strength Factor
                </p>

                <div className="mt-3 space-y-2 text-xs text-slate-300 border-t border-slate-700/60 pt-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">封成比分位数 (60%):</span>
                    <span className="text-amber-300 font-bold">封单额 / 成交额</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">09:30-09:45 封板:</span>
                    <span className="text-amber-300 font-bold">100 分 (秒板)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">09:45-10:30 封板:</span>
                    <span className="text-amber-300 font-bold">80 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">14:00 以后封板:</span>
                    <span className="text-slate-400 font-bold">20 分 (尾盘弱板)</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-900/50 text-[11px] text-amber-200">
                🔒 <strong>主力意图识别：</strong>越早封死涨停、封单资金占全天成交比例越高，说明多头做多决心越强，次日高开溢价概率超 82%。
              </div>
            </div>

            {/* Factor 3 */}
            <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                    因子 3 · 权重 30%
                  </span>
                  <Percent className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-2">
                  筹码结构与炸板惩罚
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Chip Structure & Broken Penalty
                </p>

                <div className="mt-3 space-y-2 text-xs text-slate-300 border-t border-slate-700/60 pt-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">5%~18% 黄金换手:</span>
                    <span className="text-emerald-300 font-bold">100 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">60日新高突破:</span>
                    <span className="text-emerald-300 font-bold">+20 分加成</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">0 次炸板一封到底:</span>
                    <span className="text-emerald-300 font-bold">100 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">≥2 次炸板烂板:</span>
                    <span className="text-rose-400 font-bold">20-30 分惩罚</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-900/50 text-[11px] text-emerald-200">
                💎 <strong>分歧转一致：</strong>排除缩量无承接庄股(&lt;3%)和放量滞涨死筹(&gt;25%)，精选筹码充分换手、无套牢盘的强突破形态。
              </div>
            </div>

            {/* Factor 4 */}
            <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-xs">
                    因子 4 · 权重 20%
                  </span>
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-2">
                  板块共振因子
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Sector Resonance Factor
                </p>

                <div className="mt-3 space-y-2 text-xs text-slate-300 border-t border-slate-700/60 pt-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">行业涨停家数分位:</span>
                    <span className="text-blue-300 font-bold">占比 70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">首板小弟跟风助攻:</span>
                    <span className="text-blue-300 font-bold">+30 分直接加满</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">单打独斗无板块:</span>
                    <span className="text-slate-400 font-bold">40 分基准</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">主线领涨身位:</span>
                    <span className="text-blue-300 font-bold">板块前排优先</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-200">
                🌊 <strong>大势所趋：</strong>A 股独有的“板块梯队效应”。主线板块个股有大量同梯队小弟助攻封板，安全性远高于孤立无援的独狼个股。
              </div>
            </div>
          </div>

          {/* Hard Filters (排雷硬性条件) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              排雷硬性过滤指标 (Hard Exclusion Filters)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs text-slate-300 pt-1">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-red-400 font-bold">1. 严禁 ST / *ST：</span>
                <span className="text-slate-400 block mt-0.5">直接剔除退市警示与戴帽股票。</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold">2. 市值门槛：</span>
                <span className="text-slate-400 block mt-0.5">15 亿 ≤ 总市值 ≤ 1500 亿，剔除微盘与大盘股。</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-blue-400 font-bold">3. 流动性底线：</span>
                <span className="text-slate-400 block mt-0.5">日成交额 ≥ 5000 万元，保障实盘顺畅进出。</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-purple-400 font-bold">4. 开盘价下限：</span>
                <span className="text-slate-400 block mt-0.5">次日开盘跌幅 &lt; -4.5% 严重破位股自动放弃。</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              解禁股风险机制 (Lock-up Release Risk)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-rose-400 font-bold block">高风险硬过滤</span>
                <span className="text-slate-400">未来 15 个交易日内，高风险限售解禁且占比 ≥ 5%：直接剔除。</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold block">中风险扣分</span>
                <span className="text-slate-400">解禁占比 2%~5%：保留股票，最终量化总分扣 15 分，最低为 0。</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-emerald-400 font-bold block">容错与复用</span>
                <span className="text-slate-400">按 trade_date 查询并缓存；接口失败时 fail-open，仅记录不可用状态，不全量过滤。</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: 买入逻辑详解 */}
      {(activeSubSection === "all" || activeSubSection === "trading") && (
        <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-100">
                三、买入执行逻辑详解 (Buy Execution)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">仅用 T-1 15:30 FINAL 候选 · 实时价成交</span>
          </div>

          {/* 全局买入杀开关 */}
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              3.0 全局买入杀开关 (Kill Switch) — 任何情况命中立即 return[] 不买单
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <ArrowDownCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-300">① 指数系统性弱势</div>
                  <div className="text-slate-300 mt-0.5">上证 / 深证 / 创业板 3 大指数中 <strong>≥ 2 个低开 &lt; -1.0%</strong> → 今日不建仓</div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-300">② 情绪熔断 / 弱势期</div>
                  <div className="text-slate-300 mt-0.5">T-1 情绪状态为 <strong>「退潮/弱势期」或「熔断状态」</strong>，或 circuit_breaker = True</div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <Target className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-300">③ 情绪目标仓位 cap</div>
                  <div className="text-slate-300 mt-0.5">target_position_ratio × 总资产 − 已持股市值 &lt; ¥10,000 → 预算不足</div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <MinusCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-300">④ 仓位 / 现金不足</div>
                  <div className="text-slate-300 mt-0.5">已持仓 = 4 (MAX_POSITIONS) 或 可用现金 &lt; ¥10,000</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 策略 1: OPENING */}
            <div className="bg-slate-800/40 border border-red-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">开盘竞价买入</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-900/60">OPENING</span>
              </div>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed border-t border-slate-700/60 pt-3">
                <div className="flex justify-between"><span className="text-slate-400">执行窗口:</span><span className="font-mono font-bold text-red-300">09:28 – 09:50</span></div>
                <div className="flex justify-between"><span className="text-slate-400">成交价:</span><span className="font-mono text-slate-100">开盘价 (open_price)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">候选范围:</span><span className="font-mono text-slate-100">T-1 Top 8 (rank ≤ 8)</span></div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="font-semibold text-slate-200 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> 三道开盘过滤器（全部通过才买）：</div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  <span className="text-rose-400 font-bold">⛔ 一字板:</span> 开盘涨幅 ≥ <strong>9.8%</strong> 且卖一量 = 0（封死涨停买不到）
                </div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  <span className="text-amber-400 font-bold">⛔ 追高:</span> 开盘涨幅 ≥ <strong>+6.0%</strong>（避免高开低走接盘）
                </div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  <span className="text-blue-400 font-bold">⛔ 弱开:</span> 开盘跌幅 &lt; <strong>−2.5%</strong>（严重不及预期）
                </div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  <span className="text-emerald-400 font-bold">⛔ 竞价无量:</span> 开盘竞价成交额 &lt; <strong>¥1,000 万</strong>（无量不接力）
                </div>
              </div>
            </div>

            {/* 策略 2: REBREAK */}
            <div className="bg-slate-800/40 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">炸板回封买入</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-900/60">REBREAK</span>
              </div>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed border-t border-slate-700/60 pt-3">
                <div className="flex justify-between"><span className="text-slate-400">执行窗口:</span><span className="font-mono font-bold text-amber-300">09:50 – 11:30 / 13:00 – 15:00</span></div>
                <div className="flex justify-between"><span className="text-slate-400">成交价:</span><span className="font-mono text-slate-100">实时价 (current_price)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">候选范围:</span><span className="font-mono text-slate-100">T-1 Top 8 (rank ≤ 8)</span></div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="font-semibold text-slate-200 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> 四道同时满足：</div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  ① <strong className="text-amber-400">rebreak_ready = True</strong>（全天观测：曾涨停 → 曾炸板 → 状态机就绪）
                </div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  ② 现价 ≥ 涨停价 × (1 − <strong>0.20%</strong>)（接近涨停，回封确认）
                </div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  ③ <strong>卖一量 &gt; 0</strong>（盘口有可成交卖单，不是封死一字）
                </div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  ④ <strong>量比 ≥ 1.2 倍</strong>（盘中量能放大，证明真实资金回封承接）
                </div>
              </div>
            </div>

            {/* 策略 3: PULLBACK */}
            <div className="bg-slate-800/40 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">强势回踩买入</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/60">PULLBACK</span>
              </div>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed border-t border-slate-700/60 pt-3">
                <div className="flex justify-between"><span className="text-slate-400">执行窗口:</span><span className="font-mono font-bold text-emerald-300">09:50 – 11:30 / 13:00 – 15:00</span></div>
                <div className="flex justify-between"><span className="text-slate-400">成交价:</span><span className="font-mono text-slate-100">实时价 (current_price)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">候选范围:</span><span className="font-mono text-slate-100">T-1 Top 8 (rank ≤ 8)</span></div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="font-semibold text-slate-200 flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-emerald-400" /> 四道同时满足（连续窗口通用开盘过滤也必须通过）：</div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  ① 实时涨幅 <strong className="text-emerald-400">+2% ~ +6%</strong>（温和上行，不追涨停）
                </div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  ② 自盘中最高回落 ≥ <strong className="text-emerald-400">1.5%</strong>（洗盘回踩入场点）
                </div>
                <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300">
                  ③ 现价 <strong className="text-emerald-400">&gt; 开盘价</strong>（仍保持强势，不被空头掌控）
                </div>
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-200">
                  💡 例：中广天择 9-02 开 0.0%，最高冲到 +10%，10:04 回落到 +4.9% 时触发 PULLBACK 买入 ¥22.04
                </div>
              </div>
            </div>
          </div>

          {/* 仓位分配 / 资金管理 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              资金分配与摩擦成本
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs text-slate-300 pt-1">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-indigo-300 font-bold">总仓位上限：</span>
                <span className="text-slate-400 block mt-0.5">MAX_POSITIONS = <strong>4 只</strong>（等权 ¥25,000/只）</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-rose-300 font-bold">买入摩擦：</span>
                <span className="text-slate-400 block mt-0.5"><strong>0.08%</strong>（佣金+过户费+滑点）</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-emerald-300 font-bold">卖出摩擦：</span>
                <span className="text-slate-400 block mt-0.5"><strong>0.15%</strong>（含 0.05% 印花税）</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-amber-300 font-bold">单票分配：</span>
                <span className="text-slate-400 block mt-0.5">budget ÷ 剩余 slots，向下取整到 100 股，不足 100 股跳过</span>
              </div>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-700/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-bold text-cyan-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              非打板实盘盯盘：数据口径与可用性
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300 leading-relaxed">
              <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                <div className="font-bold text-cyan-300 mb-1">日线均线</div>
                <div>AkShare 日线收盘价计算 MA5、MA10、MA20。日线数据不依赖盘中分钟线；加入股票时初始化，旧仓位刷新时补齐。MA20 至少需要 20 个有效交易日收盘价。</div>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                <div className="font-bold text-cyan-300 mb-1">Bias</div>
                <div>Bias =（当前价 − 参考均线）÷ 参考均线 × 100%。当前策略盘中使用加入股票后的实时快照滚动 VWAP/均值计算，实时价变化时才实时更新；历史日线只能计算日线 Bias，不能替代盘中 Bias。</div>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                <div className="font-bold text-cyan-300 mb-1">RSI</div>
                <div>RSI 可以用历史 K 线计算，但当前做 T 策略需要 1 分钟 RSI；高波动模式需要 5 分钟 RSI。只有对应分钟 K 线收盘/数据可用时才具备完整盘中 RSI，分钟数据缺失时不伪造信号。</div>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                <div className="font-bold text-cyan-300 mb-1">策略实际参照</div>
                <div>常规模式：Bias ±1.8%，RSI_1m；深套模式：Bias 上轨 +2.0%，禁止正 T；高波动模式：Bias 阈值为 1.5 × ATR14/现价，RSI_5m。MA20 仅用于放量破位判断，要求连续两根快照位于 MA20 下方且量比大于 1.5。</div>
              </div>
            </div>
            <div className="text-[11px] text-amber-200/90 bg-amber-950/30 border border-amber-800/50 rounded p-3">
              当前项目已具备日线 MA5/MA10/MA20；分钟线受数据源和交易时段影响。分钟线不足时，页面会保留行情和日线均线，但不会把历史日线 RSI 当作盘中 1m/5m RSI 使用。
            </div>

            <div className="border-t border-cyan-800/50 pt-4 space-y-3">
              <h4 className="text-sm font-bold text-cyan-200">非打板实盘盯盘卖出策略与归类</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                以下规则只作用于“非打板股票实时盯盘”中手动加入的股票，不会作用于模拟盘或打板实盘盯盘。策略先归类，再按优先级从高到低判断；信号连续两个刷新周期满足后才展示。
              </p>
              <div className="bg-indigo-950/30 border border-indigo-700/50 rounded p-3 text-[11px] text-slate-300 leading-relaxed">
                <div className="font-bold text-indigo-300 mb-1">动态分类引擎</div>
                <div>① deep_stuck：账户浮动盈亏 ≤ -20% 或持仓天数 &gt; 30 天；② high_volatility：平台行业标签匹配半导体/芯片/软件开发/人工智能/军工，或平台 Beta &gt; 1.2，或历史日线 ATR14/现价 ≥ 3.0%；③ 其余为 normal。</div>
                <div className="mt-1">分类不依赖具体股票代码白名单。系统日志会输出实际触发字段，例如行业标签、Beta 或 ATR14 占比。</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300 leading-relaxed">
                <div className="bg-rose-950/20 border border-rose-800/50 rounded p-3">
                  <div className="font-bold text-rose-300 mb-1">一、持仓归类：深套模式 deep_stuck</div>
                  <div>条件：浮动盈亏 ≤ -20%，或持仓天数 &gt; 30 天。</div>
                  <div className="mt-1">动作：成本价不再作为主要决策依据；禁止正T，优先反T高抛或拉高换股。</div>
                </div>
                <div className="bg-amber-950/20 border border-amber-800/50 rounded p-3">
                  <div className="font-bold text-amber-300 mb-1">二、持仓归类：高波动模式 high_volatility</div>
                  <div>条件：ATR14/现价 ≥ 3.5%，或近 5 个滚动样本的平均振幅 ≥ 5.0%。</div>
                  <div className="mt-1">动作：Bias 阈值动态放大至 max(1.8%, 1.5 × ATR14/现价)；使用 RSI_5m 口径，冷却 30 分钟。</div>
                </div>
                <div className="bg-cyan-950/20 border border-cyan-800/50 rounded p-3">
                  <div className="font-bold text-cyan-300 mb-1">三、持仓归类：常规短线 normal</div>
                  <div>条件：不满足深套和高波动条件。</div>
                  <div className="mt-1">动作：Bias 阈值 ±1.8%，使用 RSI_1m，信号冷却 15 分钟。</div>
                </div>
                <div className="bg-slate-800/70 border border-slate-700 rounded p-3">
                  <div className="font-bold text-slate-200 mb-1">四、僵尸股过滤 zombie</div>
                  <div>严格使用盘前/补齐的完整历史5日日线：5日日均换手率 &lt; 1.0%，且5日日均真实振幅（最高−最低）÷前收 &lt; 1.5%。数据不完整时不打僵尸标签。</div>
                  <div className="mt-1">结果：禁用所有日内做T信号；若当日涨幅处于 +2% 至 +3%，才提示“拉高换股离场”。禁止使用盘中3秒Tick滚动振幅判定僵尸股。</div>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-700 rounded p-3 text-[11px] text-slate-300 leading-relaxed">
                <div className="font-bold text-indigo-300 mb-1">五、卖出信号优先级</div>
                <div>1. 硬止损/全局避险：市场上涨家数占比 &lt; 20% 或情绪为 panic 时冻结正T；触及盘中支撑提示减仓。破位必须是两根已收盘5分钟K线低于日线MA20，且最新单分钟量 &gt; 前20分钟均量2.5倍，才减仓50%。</div>
                <div>2. 平T闭环：前次正T低吸后，Bias ≥ 0 或T仓盈利 ≥ 1.2%提示“卖出平T”；前次反T高抛后，Bias ≤ 0 或价格回落 ≥ 1.2%提示“买回平T”。</div>
                <div>3. 僵尸股拉高换股：历史5日日均换手率 &lt; 1.0% 且真实振幅 &lt; 1.5%，并且当日涨幅 +2% 至 +3%才提示。</div>
                <div>4. 移动止盈：持仓 ≤ 10 天从高点回撤 ≥ 4%清仓；持仓 &gt; 10 天从高点回撤 ≥ 7%减仓50%。</div>
                <div>5. 时间止损降级：normal 模式持仓 &gt; 10 天、盈亏在 -3% 到 +3%时减仓1/3并锁定日内正T；high_volatility 模式阈值延长至 &gt; 18 天，同样减仓1/3。</div>
                <div>6. 深套/反T：deep_stuck 模式当日涨幅 +2% 至 +3%或Bias触及上轨，提示高抛20%-30%；深套模式严禁正T。</div>
                <div>7. 正T发起：非深套、市场非恐慌时，Bias触及下轨、RSI超卖且价格触及布林下轨，提示低吸当前底仓30%。</div>
                <div>8. 时间保护与资金上限：09:30-09:45屏蔽所有做T信号，14:50-15:00屏蔽正T；单日做T预计资金消耗不超过账户现金50%。</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3B: 卖出逻辑详解 */}
      {(activeSubSection === "all" || activeSubSection === "trading") && (
        <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <LogOut className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-bold text-slate-100">
                四、卖出止盈止损逻辑详解 (Exit Rules)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">持仓以来最高 · 动态 holding_days · 三重卫兵</span>
          </div>

          {/* 三重卫兵 */}
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              4.0 卖出三重卫兵 (Guards) — 任一满足，四条卖出规则全部不执行
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div className="flex items-start gap-2 bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300">① T+0 锁仓</div>
                  <div className="text-slate-300 mt-0.5">entry_date = today → 当日买入绝对不能卖（A 股 T+1）</div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300">② 非交易时段</div>
                  <div className="text-slate-300 mt-0.5">不在 <strong>09:30 – 15:00</strong> 区间不成交（收盘后刷新行情不卖）</div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300">③ holding_days ≥ 1</div>
                  <div className="text-slate-300 mt-0.5">动态按交易日计数：entry_date→today 的交易日间隔（不依赖 settle_daily_nav 递增）</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Rule 1: 分层移动止盈 */}
            <div className="bg-slate-800/40 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <ArrowUpCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">规则 ①：分层移动止盈（主要触发）</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/60">TRAILING_STOP</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 border-t border-slate-700/60 pt-3">
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-400 mb-1">前置：盈利 ≥ 1.5%（先浮盈 1.5% 后才开始移动止盈观察）</div>
                  <div className="font-mono text-slate-200">max_profit_pct = (high − entry) / entry</div>
                  <div className="font-mono text-slate-200">pullback_ratio = (high − current) / high</div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                    <span className="text-emerald-300 font-bold">利润阶梯1: ≥ 8%</span>
                    <span>回撤阈值: <strong className="text-emerald-300">2.5%</strong>（紧止盈，守住大利润）</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                    <span className="text-amber-300 font-bold">利润阶梯2: ≥ 4%</span>
                    <span>回撤阈值: <strong className="text-amber-300">4.0%</strong>（放宽，给洗盘空间）</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] opacity-60">
                    <span className="text-slate-400 font-bold">利润 &lt; 4%：</span>
                    <span>不启用（靠规则 ② 硬止损兜底）</span>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-200/90 p-2 rounded bg-emerald-950/30 border border-emerald-900/40">
                  💡 high_price = max(持仓历史持久化 high, 今日实时 high, current_price)，跨天持久化，不是当天才从 0 计
                </div>
              </div>
            </div>

            {/* Rule 2: 硬止损 */}
            <div className="bg-slate-800/40 border border-rose-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                    <ArrowDownCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">规则 ②：防洗盘硬止损（双重确认）</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-900/60">HARD_STOP</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 border-t border-slate-700/60 pt-3">
                <div className="p-3 rounded bg-rose-950/20 border border-rose-900/40">
                  <div className="font-bold text-rose-300 mb-1">触发线：(current − entry) / entry ≤ <strong>−4.13%</strong></div>
                  <div className="text-[11px] text-slate-300">（约等于 −5% 止损留出 0.87% 防扫损缓冲区）</div>
                </div>
                <div className="font-semibold text-slate-200 mt-2">双重确认（满足任意一条即执行）：</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                    <strong className="text-rose-300">时间确认：</strong>连续 <strong>3 分钟</strong> 运行都在止损线下（anti_shakeout_count ≥ 3）
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                    <strong className="text-rose-300">量能确认：</strong>盘口量比 ≥ <strong>2.0</strong> 倍（爆量破位，主力出逃）
                  </div>
                </div>
                <div className="text-[11px] text-rose-200/90 p-2 rounded bg-rose-950/30 border border-rose-900/40">
                  注意：如果价格弹回 −4.13% 之上，anti_shakeout_count 归零重置（不误杀洗盘）
                </div>
              </div>
            </div>

            {/* Rule 3: 炸板超时平仓 */}
            <div className="bg-slate-800/40 border border-purple-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">规则 ③：涨停炸板超时风控</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-900/60">BROKEN_ZT_EXIT</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 border-t border-slate-700/60 pt-3">
                <div className="space-y-1.5">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                    <strong>① 观测条件：</strong>was_zt_today = True（今日任意时刻曾封死涨停，涨≥9.8% 且封单/量比≥3）
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                    <strong>② 炸板条件：</strong>is_currently_zt = False（没封死了），记录 zt_broken_time 时间戳
                  </div>
                  <div className="p-2 rounded bg-purple-950/30 border border-purple-900/50 text-purple-200 text-[11px]">
                    <strong>③ 超时平仓：</strong>now − zt_broken_time ≥ <strong>5 分钟</strong> 仍未回封 → 市价强制出局（避免"天地板"大面）
                  </div>
                </div>
              </div>
            </div>

            {/* Rule 4: T+2 14:45 强制平仓 */}
            <div className="bg-slate-800/40 border border-blue-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">规则 ④：T+2 尾盘强制平仓</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-900/60">T2_FORCED</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 border-t border-slate-700/60 pt-3">
                <div className="p-3 rounded bg-blue-950/30 border border-blue-900/50 space-y-1.5">
                  <div className="font-bold text-blue-300">holding_days ≥ <strong>2</strong> 且当前时间 ≥ <strong>14:45</strong></div>
                  <div className="text-[11px] text-slate-300">且个股涨跌幅 &lt; 9.8%（已封死涨停的空间龙头允许跳过，T+3 看情况再走）</div>
                </div>
                <div className="text-[11px] text-slate-400 p-2 rounded bg-slate-900/70 border border-slate-800">
                  holding_days 动态计算：买入当天=0，下一交易日=1，再下一日=2（含周末/节假日按交易日跳算）
                </div>
              </div>
            </div>
          </div>

          {/* 优先级 & UI 状态标签 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                卖出规则优先级（按顺序匹配，先命中先卖）
              </h4>
              <div className="text-[11px] text-slate-300 space-y-1 mt-1 font-mono">
                <div>① 移动止盈 TRAILING_STOP（最主要，绝大多数情况触发）</div>
                <div>② 防洗盘硬止损 HARD_STOP（规则1未触发时判断）</div>
                <div>③ 炸板超时平仓 BROKEN_ZT_EXIT（炸板+超时，高优先级即时）</div>
                <div>④ T+2 尾盘强制平仓 T2_FORCED（最后兜底，14:45 后检查）</div>
              </div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-400" />
                UI 盯盘状态标签对应含义
              </h4>
              <div className="text-[11px] text-slate-300 space-y-1 mt-1">
                <div><span className="px-1.5 rounded bg-emerald-600/30 text-emerald-300 text-[10px] mr-1.5">LOCKED_ZT</span>牢牢封死涨停（涨≥9.8% 且封单/量≥3）</div>
                <div><span className="px-1.5 rounded bg-amber-600/30 text-amber-300 text-[10px] mr-1.5">TRAILING_WARN</span>自最高回撤 ≥ 1.8% 且高点过 1.015 倍 — 逼近止盈线</div>
                <div><span className="px-1.5 rounded bg-rose-600/30 text-rose-300 text-[10px] mr-1.5">HARD_STOP_WARN</span>当前跌破 −4.13% 硬止损线（进入双重确认中）</div>
                <div><span className="px-1.5 rounded bg-indigo-600/30 text-indigo-300 text-[10px] mr-1.5">T2_EXIT_PENDING</span>持股 ≥ 2 日，14:45 后可能被 T+2 强平</div>
                <div><span className="px-1.5 rounded bg-slate-600/30 text-slate-300 text-[10px] mr-1.5">NORMAL</span>正常持有中</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: 交互式因子试算器 (Factor Simulator) */}
      {(activeSubSection === "all" || activeSubSection === "simulator") && (
        <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-slate-100">
                四、四大因子打分动态试算器 (Interactive Factor Simulator)
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              实时公式验算
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. 连板与情绪 */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-purple-400">连板身位 (1 - 8 板)</span>
                    <span className="font-mono text-purple-300 font-bold">{simConsecutive} 连板</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={simConsecutive}
                    onChange={(e) => setSimConsecutive(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="pt-2 border-t border-slate-700/50 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">当前大盘情绪状态:</span>
                      <select
                        value={simSentimentState}
                        onChange={(e) => setSimSentimentState(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="主升/强势期">主升/强势期 (&gt;70)</option>
                        <option value="震荡/分化期">震荡/分化期 (45-70)</option>
                        <option value="退潮/弱势期">退潮/弱势期 (30-45)</option>
                        <option value="熔断状态">熔断状态 (&lt;30)</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simIsLeader}
                        onChange={(e) => setSimIsLeader(e.target.checked)}
                        className="rounded accent-purple-500"
                      />
                      <span>全市场最高板 (空间龙头)</span>
                    </label>
                  </div>
                </div>

                {/* 2. 封板强度 */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-400">封单金额占成交比 (封成比)</span>
                    <span className="font-mono text-amber-300 font-bold">{(simSealRatio * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.4"
                    step="0.01"
                    value={simSealRatio}
                    onChange={(e) => setSimSealRatio(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs">
                    <span className="text-slate-400">首次封板时间:</span>
                    <select
                      value={simSealTime}
                      onChange={(e) => setSimSealTime(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="09:32:00">09:30-09:35 (一开秒封)</option>
                      <option value="09:42:00">09:35-09:45 (早盘强势)</option>
                      <option value="09:55:00">09:45-10:00 (稳步推板)</option>
                      <option value="10:30:00">10:00-11:30 (上午封板)</option>
                      <option value="13:30:00">13:00-14:30 (午后封板)</option>
                      <option value="14:50:00">14:30-15:00 (尾盘偷袭板)</option>
                    </select>
                  </div>
                </div>

                {/* 3. 筹码与炸板 */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-400">换手率 (Turnover Rate)</span>
                    <span className="font-mono text-emerald-300 font-bold">{simTurnover.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="35"
                    step="0.5"
                    value={simTurnover}
                    onChange={(e) => setSimTurnover(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="pt-2 border-t border-slate-700/50 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">日内炸板次数:</span>
                      <select
                        value={simBrokenCount}
                        onChange={(e) => setSimBrokenCount(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="0">0 次 (一封到底)</option>
                        <option value="1">1 次炸板回封</option>
                        <option value="2">2 次炸板烂板</option>
                        <option value="3">≥3 次频繁炸板</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simHighBreakout}
                        onChange={(e) => setSimHighBreakout(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>创 60 日新高突破 (+20分)</span>
                    </label>
                  </div>
                </div>

                {/* 4. 板块共振 */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-blue-400">板块涨停家数分位排名</span>
                    <span className="font-mono text-blue-300 font-bold">{simSectorRank} 分位</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={simSectorRank}
                    onChange={(e) => setSimSectorRank(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs">
                    <span className="text-slate-400">首板跟风助攻:</span>
                    <label className="flex items-center gap-1.5 text-blue-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simHasFollower}
                        onChange={(e) => setSimHasFollower(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                      <span>有首板助攻 (+30分)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Live Output Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-300">因子模拟总得分</span>
                  <span className="text-xs text-slate-400 font-mono">100 分制</span>
                </div>

                <div className="my-5 text-center">
                  <div className="text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-400 to-purple-400">
                    {totalScore.toFixed(2)}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${totalScore >= 80 ? "bg-red-500/20 text-red-300 border border-red-500/40" : (totalScore >= 65 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-800 text-slate-400")}`}>
                      {totalScore >= 80 ? "🎯 强力推荐候选 (Top Pick)" : (totalScore >= 65 ? "✓ 符合入围门槛" : "⚠️ 评级偏低")}
                    </span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400">1. 连板与情绪 (30%):</span>
                    <span className="text-slate-200 font-bold">{f1.score} 分 <span className="text-slate-500 font-normal">({(f1.score * 0.3).toFixed(1)}分)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-400">2. 封板强度 (25%):</span>
                    <span className="text-slate-200 font-bold">{f2.score} 分 <span className="text-slate-500 font-normal">({(f2.score * 0.25).toFixed(1)}分)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400">3. 筹码与炸板 (25%):</span>
                    <span className="text-slate-200 font-bold">{f3.score} 分 <span className="text-slate-500 font-normal">({(f3.score * 0.25).toFixed(1)}分)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400">4. 板块共振 (20%):</span>
                    <span className="text-slate-200 font-bold">{f4.score} 分 <span className="text-slate-500 font-normal">({(f4.score * 0.2).toFixed(1)}分)</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                调整左侧滑动条，可即时检验极端退潮期与主升浪下的因子响应表现。
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: 策略修改与代码文件全景指引 */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-5 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">
              五、策略修改与代码文件全景索引 (Code Customization Guide)
            </h3>
          </div>
          <span className="text-xs font-mono text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-700/40">
            Developer Quick Reference
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          若您需要调整量化策略参数、修改选股因子计算规则或接入新的行情数据源，可直接在对应 Python 模块中进行修改：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 font-mono">1. quant_system/config.py</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">核心全局配置</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              修改四大因子权重 (<code className="text-purple-300">FACTOR_WEIGHTS</code>)、情绪分界阈值 (<code className="text-purple-300">SENTIMENT_WEAK/STRONG_THRESHOLD</code>)、滑点手续费 (<code className="text-purple-300">BUY/SELL_FRICTION_RATE</code>)、止盈止损参数及市值排雷过滤边界。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 font-mono">2. quant_system/core/sentiment.py</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">大盘情绪择时</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              修改情绪评分算法（连板晋级率、最高板溢价、封板成功率、涨跌广度等子项权重）、熔断机制及动态目标仓位矩阵 (<code className="text-amber-300">target_position_ratio</code>)。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 font-mono">3. quant_system/core/scoring.py</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">打分与选股逻辑</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              修改四大因子打分公式、分位数横截面排序、情绪周期与连板因子的加减分联动规则，以及多级排序优先级 (<code className="text-emerald-300">quant_score, -first_seal_time, seal_ratio</code>)。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-300 font-mono">4. quant_system/core/portfolio.py</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">模拟实盘撮合</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              修改 T+1 集合竞价开盘买入逻辑（跳过一字板/高开&gt;8%）、动态仓位上限约束、移动止盈 2.5%、防洗盘硬止损 -4.13% 双重确认与 T+2 14:45 强制平仓撮合规则。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 font-mono">5. quant_system/core/data_fetcher.py</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">多源数据清洗与获取</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              修改数据清洗规范 (<code className="text-indigo-300">clean_raw_data</code>)、数据源请求超时重试、AkShare / 东方财富 / 新浪财经 / 腾讯财经多源降级兜底获取涨停池与全市场行情切片。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
