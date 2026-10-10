import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText, ShieldCheck, ShieldX, Clock,
  TrendingUp, Activity, AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { statsService } from '@/lib/services';
import { queryKeys } from '@/lib/queryKeys';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { formatDate, formatRelative } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { format, parseISO } from 'date-fns';
import type { VerificationResultStatus } from '@/types';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'emerald',
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: 'emerald' | 'red' | 'yellow' | 'blue' | 'muted';
  delay?: number;
}) {
  const colorMap = {
    emerald: 'text-status-valid bg-status-valid/10',
    red: 'text-status-revoked bg-status-revoked/10',
    yellow: 'text-status-expired bg-status-expired/10',
    blue: 'text-status-suspended bg-status-suspended/10',
    muted: 'text-warm-muted bg-bg-elevated',
  };

  return (
    <motion.div
      className="verity-card p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </div>
      </div>
      <p className="text-2xl font-bold text-warm-white tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-warm-muted mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-2xs text-warm-muted/60 mt-1">{sub}</p>}
    </motion.div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="verity-card px-3 py-2.5 text-xs shadow-lg">
      <p className="text-warm-muted mb-1.5">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex gap-2">
          <span className="capitalize">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: queryKeys.stats.dashboard(),
    queryFn: statsService.dashboard,
    refetchInterval: 30_000,
  });

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="page-container py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-status-revoked mx-auto mb-3" />
        <p className="text-warm-white font-medium">Failed to load statistics</p>
        <p className="text-sm text-warm-muted mt-1">Check your connection or database setup.</p>
      </div>
    );
  }

  if (!stats) return null;

  const trendData = stats.verificationTrend.map((d) => ({
    date: format(parseISO(d._id), 'MMM d'),
    valid: d.valid,
    failed: d.failed,
    total: d.count,
  }));

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          className="text-2xl font-semibold text-warm-white tracking-tight"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Dashboard
        </motion.h1>
        <motion.p
          className="text-sm text-warm-muted mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Welcome back, {user?.name}. Here's your registry overview.
        </motion.p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Documents" value={stats.documents.total} delay={0.05} />
        <StatCard icon={ShieldCheck} label="Valid" value={stats.documents.valid} color="emerald" delay={0.1} />
        <StatCard icon={ShieldX} label="Revoked" value={stats.documents.revoked} color="red" delay={0.15} />
        <StatCard icon={Clock} label="Expired" value={stats.documents.expired} color="yellow" delay={0.2} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Activity} label="Total Verifications" value={stats.verifications.total} color="muted" delay={0.25} />
        <StatCard icon={TrendingUp} label="Last 7 Days" value={stats.verifications.lastSevenDays} color="muted" delay={0.3} />
        <StatCard icon={AlertTriangle} label="Expiring Soon" value={stats.documents.expiringSoon} color="yellow" sub="Next 30 days" delay={0.35} />
        <StatCard icon={FileText} label="Issued (30d)" value={stats.documents.recentlyIssued} color="muted" delay={0.4} />
      </div>

      {/* Charts + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Verification trend chart */}
        <motion.div
          className="verity-card p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-warm-white">Verification Trend</h2>
              <p className="text-xs text-warm-muted mt-0.5">Last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-2xs">
              <span className="flex items-center gap-1.5 text-warm-muted">
                <span className="w-2 h-2 rounded-full bg-status-valid" />
                Valid
              </span>
              <span className="flex items-center gap-1.5 text-warm-muted">
                <span className="w-2 h-2 rounded-full bg-status-revoked" />
                Failed
              </span>
            </div>
          </div>

          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="validGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#35D07F" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#35D07F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E85D5D" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E85D5D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#272E29" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#929A94', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#929A94', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="valid" stroke="#35D07F" strokeWidth={2} fill="url(#validGrad)" name="valid" />
                <Area type="monotone" dataKey="failed" stroke="#E85D5D" strokeWidth={2} fill="url(#failedGrad)" name="failed" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-warm-muted text-sm">
              No verification data yet
            </div>
          )}
        </motion.div>

        {/* Recent activity */}
        <motion.div
          className="verity-card p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-sm font-semibold text-warm-white mb-4">Recent Verifications</h2>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-warm-muted py-6 text-center">No verifications yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 8).map((activity) => (
                <div key={activity._id} className="flex items-start gap-3">
                  <StatusBadge
                    status={activity.resultStatus as VerificationResultStatus}
                    size="sm"
                    showDot={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-warm-white truncate font-medium">
                      {activity.documentId?.title || activity.verificationId}
                    </p>
                    <p className="text-2xs text-warm-muted">{formatRelative(activity.requestedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Document type distribution */}
      {stats.typeDistribution.length > 0 && (
        <motion.div
          className="verity-card p-5 mt-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <h2 className="text-sm font-semibold text-warm-white mb-4">Document Types</h2>
          <div className="flex flex-wrap gap-2">
            {stats.typeDistribution.map(({ _id, count }) => (
              <div
                key={_id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border text-xs"
              >
                <span className="capitalize text-warm-white">{_id.replace('_', ' ')}</span>
                <span className="text-emerald font-mono font-medium">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer timestamp */}
      <p className="text-2xs text-warm-muted/40 text-right mt-6">
        Last updated {formatDate(new Date().toISOString(), 'MMM d, yyyy HH:mm')}
      </p>
    </div>
  );
}
