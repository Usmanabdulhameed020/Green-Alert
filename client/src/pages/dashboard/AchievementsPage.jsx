import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Award, Shield, Zap, Star, CheckCircle, Lock,
  TrendingUp, FileText, Medal, Crown, User, Loader2,
  MapPin, Leaf, Flame, TreePine, Globe, Gift, ShoppingBag,
  Sparkles, Target, Wind,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import LeafBurst from '../../components/ui/LeafBurst';

/* ─── Animated XP Counter ──────────────────────────────────────── */
const AnimatedNumber = ({ value }) => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (start === end) { setCount(end); return; }
    const duration = 900;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}</span>;
};

/* ─── Eco Tier System ───────────────────────────────────────────── */
const ECO_TIERS = [
  { id: 'sprout',     label: 'Sprout',      min: 0,    max: 99,   color: 'text-lime-600',    bg: 'bg-lime-50 border-lime-200',    ring: 'ring-lime-400',    icon: Leaf,     gradient: 'from-lime-400 to-green-500' },
  { id: 'guardian',   label: 'Guardian',    min: 100,  max: 249,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', ring: 'ring-emerald-400', icon: TreePine, gradient: 'from-emerald-400 to-teal-500' },
  { id: 'champion',   label: 'Champion',    min: 250,  max: 499,  color: 'text-cyan-600',    bg: 'bg-cyan-50 border-cyan-200',    ring: 'ring-cyan-400',    icon: Wind,     gradient: 'from-cyan-400 to-blue-500' },
  { id: 'sentinel',   label: 'Sentinel',    min: 500,  max: 999,  color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200', ring: 'ring-violet-400',  icon: Globe,    gradient: 'from-violet-400 to-purple-500' },
  { id: 'legend',     label: 'Legend',      min: 1000, max: Infinity, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', ring: 'ring-amber-400',  icon: Crown,    gradient: 'from-amber-400 to-orange-500' },
];

function getCurrentTier(xp) {
  return ECO_TIERS.findLast((t) => xp >= t.min) || ECO_TIERS[0];
}

function getNextTier(xp) {
  return ECO_TIERS.find((t) => xp < t.min) || null;
}

/* ─── Achievements Config ───────────────────────────────────────── */
const achievementsConfig = [
  { id: 'first_report',         name: 'First Alert',       description: 'Submit your first environmental report.',     icon: FileText,   xp: 25,  requirement: 1,   type: 'reports' },
  { id: 'five_reports',         name: 'Active Sentinel',   description: 'Submit 5 environmental reports.',             icon: TrendingUp, xp: 50,  requirement: 5,   type: 'reports' },
  { id: 'ten_reports',          name: 'Community Guard',   description: 'Submit 10 environmental reports.',            icon: Shield,     xp: 100, requirement: 10,  type: 'reports' },
  { id: 'twenty_five_reports',  name: 'Eco Champion',      description: 'Submit 25 environmental reports.',            icon: Award,      xp: 250, requirement: 25,  type: 'reports' },
  { id: 'first_resolved',       name: 'Problem Solver',    description: 'Get your first report resolved by an agency.', icon: CheckCircle, xp: 40, requirement: 1,  type: 'resolved' },
  { id: 'five_resolved',        name: 'Impact Maker',      description: 'Get 5 reports resolved.',                     icon: Zap,        xp: 100, requirement: 5,   type: 'resolved' },
  { id: 'community_hero',       name: 'Eco Hero',          description: 'Reach the Guardian Eco Tier (100 XP).',       icon: Star,       xp: 0,   requirement: 100, type: 'points' },
  { id: 'legend_badge',         name: 'GreenAlert Legend', description: 'Reach the Legend Eco Tier (1000 XP).',        icon: Trophy,     xp: 0,   requirement: 1000, type: 'points' },
];

/* ─── Rewards Store Items ───────────────────────────────────────── */
const REWARDS = [
  { id: 'profile_frame_green',  name: 'Green Profile Frame',     cost: 50,   icon: Leaf,       category: 'Cosmetic',  tier: 'sprout',   description: 'A green nature-themed profile ring.' },
  { id: 'badge_pioneer',        name: 'Pioneer Badge',           cost: 80,   icon: Medal,      category: 'Badge',     tier: 'guardian', description: 'Displayed next to your name in leaderboards.' },
  { id: 'profile_frame_fire',   name: 'Blazing Profile Frame',   cost: 120,  icon: Flame,      category: 'Cosmetic',  tier: 'champion', description: 'A bold flame-themed profile ring.' },
  { id: 'xp_boost_2x',         name: '2× XP Boost (7 days)',    cost: 200,  icon: Sparkles,   category: 'Boost',     tier: 'champion', description: 'Earn double XP for one week.' },
  { id: 'badge_elite',          name: 'Elite Eco Warrior Badge', cost: 300,  icon: Globe,      category: 'Badge',     tier: 'sentinel', description: 'Rare badge only top contributors can own.' },
  { id: 'badge_legend',         name: 'GreenAlert Legend Crown', cost: 500,  icon: Crown,      category: 'Badge',     tier: 'legend',   description: 'The rarest badge in GreenAlert history.' },
];

const rankColors = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];
const rankBgColors = ['bg-yellow-50 border-yellow-200', 'bg-slate-50 border-slate-300', 'bg-amber-50 border-amber-200'];

export default function AchievementsPage() {
  const { reports, points, unlockedAchievements, newlyUnlockedPopup, leaderboard, fetchLeaderboard, user } = useCitizen();
  const [activeTab, setActiveTab] = useState('achievements');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ga_claimed_rewards') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      setLeaderboardLoading(true);
      fetchLeaderboard().finally(() => setLeaderboardLoading(false));
    }
  }, [activeTab, fetchLeaderboard]);

  const totalReportsCount = reports.length;
  const resolvedReportsCount = reports.filter((r) => r.status === 'Resolved').length;
  const currentTier = getCurrentTier(points);
  const nextTier = getNextTier(points);
  const tierProgressPct = nextTier
    ? Math.min(100, Math.floor(((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100))
    : 100;

  const checkUnlocked = (ach) => {
    if (unlockedAchievements.includes(ach.id)) return true;
    switch (ach.type) {
      case 'reports': return totalReportsCount >= ach.requirement;
      case 'resolved': return resolvedReportsCount >= ach.requirement;
      case 'points': return points >= ach.requirement;
      default: return false;
    }
  };

  const getProgressInfo = (ach) => {
    switch (ach.type) {
      case 'reports': return { current: totalReportsCount, target: ach.requirement };
      case 'resolved': return { current: resolvedReportsCount, target: ach.requirement };
      case 'points': return { current: points, target: ach.requirement };
      default: return { current: 0, target: 1 };
    }
  };

  const handleClaim = (reward) => {
    if (points < reward.cost || claimedRewards.includes(reward.id)) return;
    const updated = [...claimedRewards, reward.id];
    setClaimedRewards(updated);
    localStorage.setItem('ga_claimed_rewards', JSON.stringify(updated));
  };

  const TierIcon = currentTier.icon;

  const tabs = [
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'eco-tiers',    label: 'Eco Tiers',    icon: Leaf },
    { id: 'rewards',      label: 'Rewards Store', icon: Gift },
    { id: 'leaderboard',  label: 'Leaderboard',   icon: Medal },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Trophy className="h-7 w-7 text-emerald-600" />
          Achievements &amp; Eco Rewards
        </h1>
        <p className="text-slate-500 text-sm font-semibold">Track your badges, level up your Eco Tier, and claim rewards</p>
      </div>

      {/* Newly unlocked popup — Achievement Storm */}
      <AnimatePresence>
        {newlyUnlockedPopup.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="relative bg-emerald-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center overflow-hidden"
          >
            {/* Screen flash behind */}
            <div className="ga-flash absolute inset-0 bg-emerald-300/40 pointer-events-none" />
            {/* Leaf confetti storm */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <LeafBurst fire count={36} size="md" />
              <LeafBurst fire count={20} size="sm" />
            </div>
            <div className="relative z-20">
              <motion.div
                className="w-20 h-20 bg-white/15 border border-white/30 rounded-3xl flex items-center justify-center mx-auto mb-4"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
              >
                <Trophy className="h-10 w-10 text-yellow-300 ga-shake" fill="currentColor" />
              </motion.div>
              <h3 className="font-extrabold text-xl sm:text-2xl">
                New Achievement{newlyUnlockedPopup.length > 1 ? 's' : ''} Unlocked!
              </h3>
              <p className="text-emerald-100 font-semibold text-sm mt-1">
                {newlyUnlockedPopup.map((a) => a.name).join(', ')}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 bg-white/15 border border-white/30 rounded-2xl px-4 py-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="font-extrabold text-lg tabular-nums">
                  <AnimatedNumber value={points} />
                </span>
                <span className="text-xs font-bold text-emerald-100">XP total</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Summary Banner */}
      <div className={`rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${currentTier.bg}`}>
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl bg-white border-2 ${currentTier.ring} ring-2 flex items-center justify-center flex-shrink-0 select-none shadow-sm`}>
            <TierIcon className={`h-8 w-8 ${currentTier.color}`} />
          </div>
          <div className="space-y-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${currentTier.bg} ${currentTier.color}`}>
              {currentTier.label} Tier
            </span>
            <h3 className="font-extrabold text-slate-800 text-lg">{points} XP Earned</h3>
            {nextTier ? (
              <p className="text-xs text-slate-500 font-semibold">{nextTier.min - points} XP to reach <span className="font-extrabold">{nextTier.label}</span></p>
            ) : (
              <p className="text-xs text-amber-700 font-bold">✦ Maximum Tier Reached!</p>
            )}
          </div>
        </div>
        <div className="flex-1 max-w-md space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>{currentTier.label}</span>
            <span>{nextTier ? nextTier.label : 'MAX'}</span>
          </div>
          <div className="h-3 w-full bg-white/60 rounded-full overflow-hidden border border-white">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${currentTier.gradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${tierProgressPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold text-right">{tierProgressPct}% to next tier</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── ACHIEVEMENTS TAB ── */}
      {activeTab === 'achievements' && (
        <section className="space-y-4">
          <h3 className="font-bold text-slate-800 text-base">Achievement Badges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievementsConfig.map((ach) => {
              const isUnlocked = checkUnlocked(ach);
              const { current, target } = getProgressInfo(ach);
              const progressPercent = Math.min(100, Math.floor((current / target) * 100));
              const Icon = ach.icon;
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
                    isUnlocked
                      ? 'bg-white border-emerald-200 shadow-md shadow-emerald-50'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {isUnlocked && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      +{ach.xp} XP
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    isUnlocked ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    {isUnlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5 text-slate-300" />}
                  </div>
                  <div>
                    <p className={`text-sm font-extrabold ${isUnlocked ? 'text-slate-900' : 'text-slate-400'}`}>{ach.name}</p>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">{ach.description}</p>
                  </div>
                  <div className="mt-auto space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Progress</span>
                      <span>{Math.min(current, target)}/{target}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isUnlocked ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ECO TIERS TAB ── */}
      {activeTab === 'eco-tiers' && (
        <section className="space-y-4">
          <h3 className="font-bold text-slate-800 text-base">Eco Tier Progression</h3>
          <p className="text-xs text-slate-500 font-semibold">Earn XP by submitting and getting reports resolved. Level up through tiers to unlock exclusive rewards.</p>
          <div className="space-y-3">
            {ECO_TIERS.map((tier, i) => {
              const TIcon = tier.icon;
              const isCurrentTier = currentTier.id === tier.id;
              const isReached = points >= tier.min;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                    isCurrentTier
                      ? `${tier.bg} shadow-sm`
                      : isReached
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 flex-shrink-0 ${
                    isCurrentTier ? `bg-white ${tier.ring} ring-2` : isReached ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {isReached ? (
                      <TIcon className={`h-6 w-6 ${isCurrentTier ? tier.color : 'text-slate-400'}`} />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-extrabold ${isCurrentTier ? tier.color : isReached ? 'text-slate-700' : 'text-slate-400'}`}>
                        {tier.label}
                      </span>
                      {isCurrentTier && (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white border border-current px-1.5 py-0.5 rounded-full text-emerald-600">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      {tier.max === Infinity ? `${tier.min}+ XP` : `${tier.min} – ${tier.max} XP`}
                    </p>
                  </div>
                  {isReached && (
                    <CheckCircle className={`h-5 w-5 flex-shrink-0 ${isCurrentTier ? tier.color : 'text-slate-300'}`} />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* XP How to Earn */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-4">
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              How to Earn XP
            </h4>
            <div className="space-y-2">
              {[
                { action: 'Submit an environmental report', xp: '+25 XP' },
                { action: 'Report gets marked "In Progress"', xp: '+15 XP' },
                { action: 'Report gets Resolved by agency', xp: '+50 XP' },
                { action: 'Receive 5 upvotes on a report', xp: '+10 XP' },
                { action: 'Unlock a new achievement', xp: '+varies' },
              ].map(({ action, xp }) => (
                <div key={action} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">{action}</span>
                  <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{xp}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── REWARDS STORE TAB ── */}
      {activeTab === 'rewards' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Rewards Store</h3>
              <p className="text-xs text-slate-500 font-semibold">Spend your XP to claim exclusive badges and boosts</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span className="font-extrabold text-emerald-700 text-sm">{points} XP</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REWARDS.map((reward, i) => {
              const canAfford = points >= reward.cost;
              const isClaimed = claimedRewards.includes(reward.id);
              const RIcon = reward.icon;
              const requiredTier = ECO_TIERS.find((t) => t.id === reward.tier);
              const tierReached = requiredTier ? points >= requiredTier.min : true;
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
                    isClaimed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
                  } ${!tierReached ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <RIcon className="h-5 w-5 text-slate-600" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                      {reward.category}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-slate-900 text-sm">{reward.name}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">{reward.description}</p>
                    {!tierReached && requiredTier && (
                      <p className="text-[10px] text-red-500 font-bold mt-1.5">🔒 Requires {requiredTier.label} Tier</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleClaim(reward)}
                    disabled={!canAfford || isClaimed || !tierReached}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer disabled:cursor-not-allowed ${
                      isClaimed
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : canAfford && tierReached
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isClaimed ? (
                      <span className="flex items-center justify-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Claimed</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> {reward.cost} XP — Claim
                      </span>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── LEADERBOARD TAB ── */}
      {activeTab === 'leaderboard' && (
        <section className="space-y-4">
          {leaderboardLoading ? (
            <LoadingSkeleton type="profile" />
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-semibold text-sm">
              <Medal className="h-8 w-8 mx-auto mb-3 text-slate-200" />
              No leaderboard data available yet.
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              <div className="flex items-end justify-center gap-4 pt-4">
                {[1, 0, 2].map((idx) => {
                  const entry = leaderboard[idx];
                  if (!entry) return null;
                  const rank = idx + 1;
                  const heights = ['h-28', 'h-36', 'h-24'];
                  const medals = ['🥈', '🥇', '🥉'];
                  const entryTier = getCurrentTier(entry.points || entry.score || 0);
                  const ETIcon = entryTier.icon;
                  return (
                    <div key={entry._id || idx} className={`flex flex-col items-center justify-end gap-2 ${heights[idx]} flex-1 max-w-[110px]`}>
                      <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-lg font-extrabold bg-white shadow-md ${rankBgColors[idx]}`}>
                        {entry.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        <span className="absolute -top-3 text-xl">{medals[idx]}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-extrabold text-slate-800 truncate max-w-[90px]">{entry.fullName || 'User'}</p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <ETIcon className={`h-3 w-3 ${entryTier.color}`} />
                          <span className={`text-[10px] font-bold ${entryTier.color}`}>{entryTier.label}</span>
                        </div>
                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{entry.points || entry.score || 0} XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full list */}
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
                {leaderboard.map((entry, idx) => {
                  const isCurrentUser = user && (entry._id === user._id || entry.email === user.email);
                  const entryTier = getCurrentTier(entry.points || entry.score || 0);
                  const LIcon = entryTier.icon;
                  return (
                    <div
                      key={entry._id || idx}
                      className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isCurrentUser ? 'bg-emerald-50' : 'hover:bg-slate-50/60'}`}
                    >
                      <span className={`text-xs font-extrabold w-6 text-center ${rankColors[idx] || 'text-slate-400'}`}>
                        #{idx + 1}
                      </span>
                      <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-600 flex-shrink-0">
                        {entry.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-extrabold truncate ${isCurrentUser ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {entry.fullName || 'Anonymous'} {isCurrentUser && '(You)'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <LIcon className={`h-3 w-3 ${entryTier.color}`} />
                          <span className={`text-[10px] font-bold ${entryTier.color}`}>{entryTier.label}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-emerald-600">{entry.points || entry.score || 0}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}
    </motion.div>
  );
}
