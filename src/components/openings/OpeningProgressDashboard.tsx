import React from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  GitBranch,
  Layers,
  Play,
  Tags,
  Target,
} from 'lucide-react';
import {
  OpeningNodeProgress,
  OpeningProgressMap,
  OpeningRepertoire,
  OpeningVariationNode,
} from '../../types';

export interface OpeningProgressDashboardProps {
  openings: OpeningRepertoire[];
  progressByNode?: OpeningProgressMap;
  generatedCardsByOpeningId?: Record<string, number>;
  activeOpeningId?: string;
  onSelectOpening?: (opening: OpeningRepertoire) => void;
  onTrainOpening?: (opening: OpeningRepertoire) => void;
  className?: string;
}

interface OpeningDashboardMetrics {
  totalPositions: number;
  duePositions: number;
  trainedCount: number;
  accuracy: number;
  mastery: number;
  hardestMove?: OpeningVariationNode;
  branchCompletion: number;
  lapses: number;
  generatedCards: number;
}

interface TagSummary {
  tag: string;
  count: number;
  due: number;
}

export default function OpeningProgressDashboard({
  openings,
  progressByNode = {},
  generatedCardsByOpeningId = {},
  activeOpeningId,
  onSelectOpening,
  onTrainOpening,
  className,
}: OpeningProgressDashboardProps) {
  const nowMs = Date.now();
  const openingMetrics = openings.map((opening) => ({
    opening,
    metrics: getOpeningMetrics(opening, progressByNode, generatedCardsByOpeningId[opening.id] ?? 0, nowMs),
  }));
  const totals = getDashboardTotals(openingMetrics);
  const tagSummary = getTagSummary(openings, progressByNode, nowMs);

  return (
    <section className={cx('rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-bold text-gray-900">Opening Progress</h2>
              <p className="truncate text-[11px] text-gray-500">Repertoire coverage, weak spots, and card generation</p>
            </div>
          </div>
          <span className="flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
            {openings.length} openings
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <SummaryTile icon={<BookOpen size={14} />} label="Positions" value={String(totals.totalPositions)} />
          <SummaryTile icon={<CalendarClock size={14} />} label="Due" value={String(totals.duePositions)} tone="blue" />
          <SummaryTile icon={<CheckCircle2 size={14} />} label="Trained" value={String(totals.trainedCount)} tone="green" />
          <SummaryTile icon={<CreditCard size={14} />} label="Cards" value={String(totals.generatedCards)} />
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {openingMetrics.length === 0 ? (
            <EmptyState />
          ) : (
            openingMetrics.map(({ opening, metrics }) => (
              <OpeningMetricCard
                key={opening.id}
                opening={opening}
                metrics={metrics}
                active={opening.id === activeOpeningId}
                onSelectOpening={onSelectOpening}
                onTrainOpening={onTrainOpening}
              />
            ))
          )}
        </div>

        {tagSummary.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Tags size={14} className="text-gray-400" />
              <span className="text-[12px] font-bold text-gray-800">Tags and Categories</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagSummary.slice(0, 14).map((summary) => (
                <span
                  key={summary.tag}
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold',
                    summary.due > 0
                      ? 'border-blue-100 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  )}
                >
                  {summary.tag}
                  <span className="text-[10px] opacity-70">{summary.count}</span>
                  {summary.due > 0 && <span className="rounded bg-white/70 px-1 text-[10px]">{summary.due} due</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OpeningMetricCard({
  opening,
  metrics,
  active,
  onSelectOpening,
  onTrainOpening,
}: {
  opening: OpeningRepertoire;
  metrics: OpeningDashboardMetrics;
  active: boolean;
  onSelectOpening?: (opening: OpeningRepertoire) => void;
  onTrainOpening?: (opening: OpeningRepertoire) => void;
}) {
  const selectable = Boolean(onSelectOpening);
  const cardBody = (
    <>
      <div className="flex items-start gap-3">
        <div className={cx(
          'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
          active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
        )}>
          <BookOpen size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[13px] font-bold text-gray-900">{opening.name}</h3>
            <span className="flex-shrink-0 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              {opening.eco}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[11px] text-gray-500">
            {opening.side} repertoire / {opening.family}
          </div>
        </div>
        {onTrainOpening && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onTrainOpening(opening);
            }}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            aria-label={`Train ${opening.name}`}
            title={`Train ${opening.name}`}
          >
            <Play size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <MiniMetric label="Due" value={String(metrics.duePositions)} tone={metrics.duePositions > 0 ? 'blue' : 'gray'} />
        <MiniMetric label="Trained" value={`${metrics.trainedCount}/${metrics.totalPositions}`} />
        <MiniMetric label="Accuracy" value={`${metrics.accuracy}%`} tone={metrics.accuracy >= 80 ? 'green' : 'gray'} />
        <MiniMetric label="Lapses" value={String(metrics.lapses)} tone={metrics.lapses > 0 ? 'red' : 'gray'} />
      </div>

      <div className="mt-3 space-y-2">
        <ProgressRow label="Mastery" value={metrics.mastery} />
        <ProgressRow label="Branch completion" value={metrics.branchCompletion} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <SmallBadge icon={<Target size={11} />} label={metrics.hardestMove?.expectedMoveSan ?? 'No hard move'} tone={metrics.hardestMove ? 'amber' : 'gray'} />
        <SmallBadge icon={<GitBranch size={11} />} label={`${countBranchingNodes(opening.root)} branches`} />
        <SmallBadge icon={<CreditCard size={11} />} label={`${metrics.generatedCards} cards`} />
      </div>
    </>
  );

  if (!selectable) {
    return (
      <article className={cx('rounded-xl border p-3', active ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white')}>
        {cardBody}
      </article>
    );
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelectOpening?.(opening)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectOpening?.(opening);
        }
      }}
      className={cx(
        'rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-100',
        active ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
      )}
    >
      {cardBody}
    </article>
  );
}

function getOpeningMetrics(
  opening: OpeningRepertoire,
  progressByNode: OpeningProgressMap,
  generatedCards: number,
  nowMs: number
): OpeningDashboardMetrics {
  const nodes = flattenOpeningNodes(opening.root);
  const progressEntries = nodes.map((node) => progressByNode[node.id]).filter(Boolean);
  const totalAttempts = progressEntries.reduce((sum, progress) => sum + progress.correct + progress.missed, 0);
  const totalCorrect = progressEntries.reduce((sum, progress) => sum + progress.correct, 0);
  const trainedCount = nodes.filter((node) => getAttempts(progressByNode[node.id]) > 0).length;
  const duePositions = nodes.filter((node) => isProgressDue(progressByNode[node.id], nowMs)).length;
  const lapses = progressEntries.reduce((sum, progress) => sum + progress.lapses, 0);
  const mastery =
    nodes.length > 0
      ? Math.round(nodes.reduce((sum, node) => sum + (progressByNode[node.id]?.mastery ?? 0), 0) / nodes.length)
      : opening.mastery;

  return {
    totalPositions: nodes.length || opening.totalPositions,
    duePositions,
    trainedCount,
    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : opening.accuracy,
    mastery,
    hardestMove: getHardestMove(nodes, progressByNode, nowMs),
    branchCompletion: nodes.length > 0 ? Math.round((trainedCount / nodes.length) * 100) : 0,
    lapses,
    generatedCards,
  };
}

function getHardestMove(
  nodes: OpeningVariationNode[],
  progressByNode: OpeningProgressMap,
  nowMs: number
): OpeningVariationNode | undefined {
  return nodes
    .map((node) => ({
      node,
      score: getWeaknessScore(node, progressByNode[node.id], nowMs),
    }))
    .sort((a, b) => b.score - a.score)[0]?.node;
}

function getWeaknessScore(node: OpeningVariationNode, progress: OpeningNodeProgress | undefined, nowMs: number): number {
  if (!progress) return node.moveNumber > 1 ? 20 : 8;

  const attempts = progress.correct + progress.missed;
  const missRate = attempts > 0 ? progress.missed / attempts : 0;
  const dueBoost = isProgressDue(progress, nowMs) ? 15 : 0;
  return Math.round((100 - progress.mastery) + missRate * 30 + progress.lapses * 10 + dueBoost);
}

function getDashboardTotals(openingMetrics: { metrics: OpeningDashboardMetrics }[]) {
  const totalPositions = openingMetrics.reduce((sum, item) => sum + item.metrics.totalPositions, 0);
  const duePositions = openingMetrics.reduce((sum, item) => sum + item.metrics.duePositions, 0);
  const trainedCount = openingMetrics.reduce((sum, item) => sum + item.metrics.trainedCount, 0);
  const generatedCards = openingMetrics.reduce((sum, item) => sum + item.metrics.generatedCards, 0);

  return { totalPositions, duePositions, trainedCount, generatedCards };
}

function getTagSummary(openings: OpeningRepertoire[], progressByNode: OpeningProgressMap, nowMs: number): TagSummary[] {
  const tagCounts = new Map<string, TagSummary>();

  openings.forEach((opening) => {
    opening.tags.forEach((tag) => addTag(tagCounts, tag, false));
    flattenOpeningNodes(opening.root).forEach((node) => {
      const due = isProgressDue(progressByNode[node.id], nowMs);
      node.tags.forEach((tag) => addTag(tagCounts, tag, due));
    });
  });

  return Array.from(tagCounts.values()).sort((a, b) => b.due - a.due || b.count - a.count || a.tag.localeCompare(b.tag));
}

function addTag(tagCounts: Map<string, TagSummary>, tag: string, due: boolean) {
  const current = tagCounts.get(tag) ?? { tag, count: 0, due: 0 };
  current.count += 1;
  if (due) current.due += 1;
  tagCounts.set(tag, current);
}

function flattenOpeningNodes(root: OpeningVariationNode): OpeningVariationNode[] {
  return [root, ...root.branches.flatMap((branch) => flattenOpeningNodes(branch))];
}

function countBranchingNodes(root: OpeningVariationNode): number {
  const childBranchingNodes = root.branches.reduce((sum, branch) => sum + countBranchingNodes(branch), 0);
  return root.branches.length > 1 ? childBranchingNodes + 1 : childBranchingNodes;
}

function isProgressDue(progress: OpeningNodeProgress | undefined, nowMs: number): boolean {
  if (!progress) return false;
  if (!progress.nextDueAt) return progress.due;

  const dueMs = new Date(progress.nextDueAt).getTime();
  return Number.isFinite(dueMs) ? dueMs <= nowMs : progress.due;
}

function getAttempts(progress: OpeningNodeProgress | undefined): number {
  return progress ? progress.correct + progress.missed : 0;
}

function SummaryTile({
  icon,
  label,
  value,
  tone = 'gray',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'gray' | 'blue' | 'green';
}) {
  const color = tone === 'blue' ? 'text-blue-600' : tone === 'green' ? 'text-green-600' : 'text-gray-800';
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
      <div className={`text-[15px] font-bold leading-tight ${color}`}>{value}</div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: string;
  tone?: 'gray' | 'blue' | 'green' | 'red';
}) {
  const color =
    tone === 'blue' ? 'text-blue-600' : tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-gray-800';

  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
      <div className={`truncate text-[12px] font-bold leading-tight ${color}`}>{value}</div>
      <div className="truncate text-[10px] text-gray-400">{label}</div>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-gray-500">{label}</span>
        <span className="text-[11px] font-bold text-gray-700">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${clampPercent(value)}%` }} />
      </div>
    </div>
  );
}

function SmallBadge({
  icon,
  label,
  tone = 'gray',
}: {
  icon: React.ReactNode;
  label: string;
  tone?: 'gray' | 'amber';
}) {
  return (
    <span
      className={cx(
        'inline-flex min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
        tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-gray-200 bg-gray-50 text-gray-500'
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-4 xl:col-span-2">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700">
        <Layers size={14} className="text-gray-400" />
        No openings available
      </div>
      <p className="mt-1 text-[11px] text-gray-500">Import or create an opening to see progress analytics here.</p>
    </div>
  );
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
