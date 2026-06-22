import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Crosshair,
  Flame,
  GitBranch,
  Play,
  Target,
  XCircle,
} from 'lucide-react';
import {
  OpeningNodeProgress,
  OpeningProgressMap,
  OpeningRepertoire,
  OpeningVariationNode,
} from '../../types';

export interface OpeningWeaknessItem {
  id: string;
  openingId?: string;
  openingName?: string;
  nodeId: string;
  moveSan: string;
  prompt: string;
  line?: string[];
  tags?: string[];
  score: number;
  misses: number;
  lapses: number;
  mastery: number;
  attempts?: number;
  dueAt?: string;
  overdue?: boolean;
  due?: boolean;
  node?: OpeningVariationNode;
}

export interface OpeningWeaknessPanelProps {
  opening?: OpeningRepertoire;
  nodes?: OpeningVariationNode[];
  progressByNode?: OpeningProgressMap;
  weaknesses?: OpeningWeaknessItem[];
  maxItems?: number;
  onTrain?: (weakness: OpeningWeaknessItem) => void;
  onJump?: (weakness: OpeningWeaknessItem) => void;
  className?: string;
}

export default function OpeningWeaknessPanel({
  opening,
  nodes,
  progressByNode = {},
  weaknesses,
  maxItems = 6,
  onTrain,
  onJump,
  className,
}: OpeningWeaknessPanelProps) {
  const nowMs = Date.now();
  const derivedWeaknesses = weaknesses ?? deriveWeaknesses(opening, nodes, progressByNode, nowMs);
  const visibleWeaknesses = derivedWeaknesses.slice(0, maxItems);
  const dueCount = derivedWeaknesses.filter((weakness) => weakness.overdue || weakness.due).length;

  return (
    <section className={cx('rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Crosshair size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-bold text-gray-900">Weak Branches</h2>
              <p className="truncate text-[11px] text-gray-500">
                {opening ? opening.name : 'Highest priority opening moves'}
              </p>
            </div>
          </div>
          <span className="flex-shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            {dueCount} due
          </span>
        </div>
      </div>

      <div className="p-4">
        {visibleWeaknesses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {visibleWeaknesses.map((weakness) => (
              <WeaknessRow
                key={weakness.id}
                weakness={weakness}
                onTrain={onTrain}
                onJump={onJump}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function WeaknessRow({
  weakness,
  onTrain,
  onJump,
}: {
  weakness: OpeningWeaknessItem;
  onTrain?: (weakness: OpeningWeaknessItem) => void;
  onJump?: (weakness: OpeningWeaknessItem) => void;
}) {
  const scoreTone = weakness.score >= 80 ? 'red' : weakness.score >= 55 ? 'amber' : 'blue';
  const line = weakness.line ?? [];

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-3 transition hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <ScoreBadge score={weakness.score} tone={scoreTone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[13px] font-bold text-gray-900">{weakness.moveSan}</h3>
            <DueBadge weakness={weakness} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{weakness.prompt}</p>
          {line.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {line.slice(0, 5).map((move, index) => (
                <React.Fragment key={`${move}-${index}`}>
                  <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                    {move}
                  </span>
                  {index < Math.min(line.length, 5) - 1 && <ChevronRight size={11} className="text-gray-300" />}
                </React.Fragment>
              ))}
              {line.length > 5 && (
                <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  +{line.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {onJump && (
            <button
              type="button"
              onClick={() => onJump(weakness)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              aria-label={`Jump to ${weakness.moveSan}`}
              title={`Jump to ${weakness.moveSan}`}
            >
              <Target size={14} />
            </button>
          )}
          {onTrain && (
            <button
              type="button"
              onClick={() => onTrain(weakness)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label={`Train ${weakness.moveSan}`}
              title={`Train ${weakness.moveSan}`}
            >
              <Play size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <SmallStat icon={<XCircle size={11} />} label="Misses" value={String(weakness.misses)} tone={weakness.misses > 0 ? 'red' : 'gray'} />
        <SmallStat icon={<Flame size={11} />} label="Lapses" value={String(weakness.lapses)} tone={weakness.lapses > 0 ? 'amber' : 'gray'} />
        <SmallStat icon={<Target size={11} />} label="Mastery" value={`${weakness.mastery}%`} />
        <SmallStat icon={<GitBranch size={11} />} label="Reps" value={String(weakness.attempts ?? weakness.misses)} />
      </div>

      {weakness.tags && weakness.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {weakness.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function deriveWeaknesses(
  opening: OpeningRepertoire | undefined,
  nodes: OpeningVariationNode[] | undefined,
  progressByNode: OpeningProgressMap,
  nowMs: number
): OpeningWeaknessItem[] {
  const sourceNodes = nodes ?? (opening ? flattenOpeningNodes(opening.root) : []);

  return sourceNodes
    .map((node) => {
      const progress = progressByNode[node.id];
      const due = isProgressDue(progress, nowMs);
      const overdue = isOverdue(progress, nowMs);
      const attempts = progress ? progress.correct + progress.missed : 0;
      const misses = progress?.missed ?? 0;
      const lapses = progress?.lapses ?? 0;
      const mastery = progress?.mastery ?? 0;
      const score = getWeaknessScore(node, progress, nowMs);

      return {
        id: `${opening?.id ?? 'opening'}-${node.id}`,
        openingId: opening?.id,
        openingName: opening?.name,
        nodeId: node.id,
        moveSan: node.expectedMoveSan,
        prompt: node.prompt,
        line: getLineToNode(opening?.root, node.id),
        tags: node.tags,
        score,
        misses,
        lapses,
        mastery,
        attempts,
        dueAt: progress?.nextDueAt,
        overdue,
        due,
        node,
      };
    })
    .filter((weakness) => weakness.score > 0 && (weakness.misses > 0 || weakness.lapses > 0 || weakness.mastery < 70 || weakness.due))
    .sort((a, b) => b.score - a.score || b.misses - a.misses || a.moveSan.localeCompare(b.moveSan));
}

function getWeaknessScore(node: OpeningVariationNode, progress: OpeningNodeProgress | undefined, nowMs: number): number {
  if (!progress) return node.moveNumber > 1 ? 28 : 12;

  const attempts = progress.correct + progress.missed;
  const missRate = attempts > 0 ? progress.missed / attempts : 0;
  const dueBoost = isProgressDue(progress, nowMs) ? 16 : 0;
  const overdueBoost = isOverdue(progress, nowMs) ? 10 : 0;
  return Math.min(100, Math.round((100 - progress.mastery) * 0.7 + missRate * 35 + progress.lapses * 12 + dueBoost + overdueBoost));
}

function flattenOpeningNodes(root: OpeningVariationNode): OpeningVariationNode[] {
  return [root, ...root.branches.flatMap((branch) => flattenOpeningNodes(branch))];
}

function getLineToNode(root: OpeningVariationNode | undefined, nodeId: string): string[] | undefined {
  if (!root) return undefined;
  const path = findPath(root, nodeId);
  return path?.map((node) => node.expectedMoveSan);
}

function findPath(node: OpeningVariationNode, nodeId: string): OpeningVariationNode[] | undefined {
  if (node.id === nodeId) return [node];

  for (const branch of node.branches) {
    const childPath = findPath(branch, nodeId);
    if (childPath) return [node, ...childPath];
  }

  return undefined;
}

function isProgressDue(progress: OpeningNodeProgress | undefined, nowMs: number): boolean {
  if (!progress) return false;
  if (!progress.nextDueAt) return progress.due;

  const dueMs = new Date(progress.nextDueAt).getTime();
  return Number.isFinite(dueMs) ? dueMs <= nowMs : progress.due;
}

function isOverdue(progress: OpeningNodeProgress | undefined, nowMs: number): boolean {
  if (!progress?.nextDueAt) return false;

  const dueMs = new Date(progress.nextDueAt).getTime();
  return Number.isFinite(dueMs) && dueMs < nowMs - 24 * 60 * 60 * 1000;
}

function ScoreBadge({ score, tone }: { score: number; tone: 'red' | 'amber' | 'blue' }) {
  return (
    <div
      className={cx(
        'flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg border',
        tone === 'red' && 'border-red-200 bg-red-50 text-red-700',
        tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'blue' && 'border-blue-200 bg-blue-50 text-blue-700'
      )}
    >
      <span className="text-[13px] font-bold leading-tight">{score}</span>
      <span className="text-[9px] font-semibold leading-tight opacity-75">score</span>
    </div>
  );
}

function DueBadge({ weakness }: { weakness: OpeningWeaknessItem }) {
  if (weakness.overdue) {
    return (
      <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
        <AlertTriangle size={11} />
        overdue
      </span>
    );
  }

  if (weakness.due) {
    return (
      <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
        <CalendarClock size={11} />
        due
      </span>
    );
  }

  if (weakness.dueAt) {
    return (
      <span className="flex-shrink-0 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
        {formatDue(weakness.dueAt)}
      </span>
    );
  }

  return null;
}

function SmallStat({
  icon,
  label,
  value,
  tone = 'gray',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'gray' | 'red' | 'amber';
}) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-gray-700';
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
      <div className={`flex items-center gap-1 text-[11px] font-bold leading-tight ${color}`}>
        {icon}
        <span className="truncate">{value}</span>
      </div>
      <div className="mt-0.5 truncate text-[10px] text-gray-400">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-4">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700">
        <Target size={14} className="text-gray-400" />
        No weak branches detected
      </div>
      <p className="mt-1 text-[11px] text-gray-500">Misses, lapses, low mastery, and overdue moves will appear here.</p>
    </div>
  );
}

function formatDue(value: string): string {
  const dueMs = new Date(value).getTime();
  if (!Number.isFinite(dueMs)) return 'scheduled';

  const nowMs = Date.now();
  if (dueMs <= nowMs) return 'due';

  const days = Math.ceil((dueMs - nowMs) / (24 * 60 * 60 * 1000));
  return `${days}d`;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
