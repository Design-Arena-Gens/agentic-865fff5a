import { EventType, MessageStatus } from "@prisma/client";
import { SettingsForm } from "@/components/settings-form";
import { ManualActions } from "@/components/manual-actions";
import { getInstagramConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Dashboard />;
}

type MessageLogItem = {
  id: string;
  instagramUserId: string;
  instagramUsername: string | null;
  messageType: EventType;
  status: MessageStatus;
  error: string | null;
  createdAt: Date;
};

async function Dashboard() {
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  const [config, stats, recentLogs] = hasDatabase
    ? await Promise.all([
        getInstagramConfig(),
        loadStats(),
        prisma.messageLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [null, { pending: 0, sent: 0, failed: 0 }, [] as MessageLogItem[]];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 px-4 py-12 font-sans text-neutral-900 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 dark:text-neutral-100 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-4 rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Automation control center
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-4xl">
                Instagram DM Agent
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
                Instantly greet new followers and thank anyone who likes your
                posts. Customize messaging, monitor delivery, and triage failures
                from one dashboard.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.6)]" />
              <div className="space-y-1">
                <p className="font-medium text-neutral-700 dark:text-neutral-200">
                  Webhook endpoint
                </p>
                <p className="font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400">
                  /api/instagram/webhook
                </p>
              </div>
            </div>
          </div>
          <StatsGrid stats={stats} />
        </header>

        {!hasDatabase && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
            <p className="font-medium">
              Database connection missing. Set the <code>DATABASE_URL</code>{" "}
              environment variable to enable persistence.
            </p>
            <p className="mt-2">
              Until then, automation endpoints and credential storage will be
              disabled.
            </p>
          </div>
        )}

        <SettingsForm config={config} />

        <ManualActions hasConfig={Boolean(config) && hasDatabase} />

        <section className="space-y-5 rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Recent delivery reports
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Track which DMs were sent automatically and review any failures.
              </p>
            </div>
          </header>
          <RecentLogs logs={recentLogs} />
        </section>
      </div>
    </div>
  );
}

async function loadStats() {
  if (!process.env.DATABASE_URL) {
    return { pending: 0, sent: 0, failed: 0 };
  }

  const [pending, sent, failed] = await Promise.all([
    prisma.instagramEvent.count({ where: { isProcessed: false } }),
    prisma.messageLog.count({ where: { status: MessageStatus.SENT } }),
    prisma.messageLog.count({ where: { status: MessageStatus.FAILED } }),
  ]);

  return { pending, sent, failed };
}

type Stats = Awaited<ReturnType<typeof loadStats>>;

function StatsGrid({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Pending events",
      value: stats.pending,
      description: "Awaiting processing",
      tone: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
    },
    {
      label: "Messages delivered",
      value: stats.sent,
      description: "Successful automated DMs",
      tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
    },
    {
      label: "Failed attempts",
      value: stats.failed,
      description: "Needs attention",
      tone: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-neutral-200 bg-white/60 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
            {card.value}
          </p>
          <span
            className={`mt-4 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${card.tone}`}
          >
            {card.description}
          </span>
        </div>
      ))}
    </div>
  );
}

type RecentLogsProps = {
  logs: MessageLogItem[];
};

function RecentLogs({ logs }: RecentLogsProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Message delivery logs will appear here after the first automation runs.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
      <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          <tr>
            <th className="px-4 py-3 text-left font-medium">User</th>
            <th className="px-4 py-3 text-left font-medium">Message type</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
            <th className="px-4 py-3 text-left font-medium">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900/30">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {log.instagramUsername ?? "Unknown user"}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {log.instagramUserId}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <MessageTypeBadge messageType={log.messageType} />
              </td>
              <td className="px-4 py-3">
                <DeliveryStatusBadge status={log.status} />
              </td>
              <td className="px-4 py-3">
                <time className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDate(log.createdAt)}
                </time>
              </td>
              <td className="px-4 py-3 text-xs text-rose-600 dark:text-rose-300">
                {log.error ? truncate(log.error, 80) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessageTypeBadge({ messageType }: { messageType: EventType }) {
  const palette =
    messageType === EventType.FOLLOW
      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200"
      : "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${palette}`}
    >
      {messageType === EventType.FOLLOW ? "Follower" : "Like"}
    </span>
  );
}

function DeliveryStatusBadge({ status }: { status: MessageStatus }) {
  const palette =
    status === MessageStatus.SENT
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : status === MessageStatus.FAILED
        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${palette}`}
    >
      {status === MessageStatus.SENT
        ? "Sent"
        : status === MessageStatus.FAILED
          ? "Failed"
          : "Pending"}
    </span>
  );
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString();
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
