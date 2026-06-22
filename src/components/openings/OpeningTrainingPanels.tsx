import React from 'react';
import {
  BarChart3,
  BookMarked,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileText,
  GitBranch,
  ListChecks,
  NotebookPen,
  Target,
  XCircle,
} from 'lucide-react';
import { OpeningVariationNode } from '../../types';

export interface OpeningNodeProgress {
  correct: number;
  missed: number;
  due: boolean;
  mastery: number;
  nextDueAt?: string;
  lastResult?: 'correct' | 'incorrect';
}

export interface OpeningNotes {
  opening: string;
  nodes: Record<string, string>;
}

interface MoveHistoryPanelProps {
  currentLine: OpeningVariationNode[];
  activeNodeId: string;
  onSelect: (node: OpeningVariationNode) => void;
}

export function MoveHistoryPanel({ currentLine, activeNodeId, onSelect }: MoveHistoryPanelProps) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks size={15} className="text-gray-400" />
        <span className="text-[13px] font-bold text-gray-800">Move History</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {currentLine.map((node, index) => {
          const active = node.id === activeNodeId;
          return (
            <React.Fragment key={node.id}>
              <button
                onClick={() => onSelect(node)}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-white'
                }`}
              >
                {node.expectedMoveSan}
              </button>
              {index < currentLine.length - 1 && <ChevronRight size={13} className="text-gray-300" />}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

interface DuePositionsPanelProps {
  nodes: OpeningVariationNode[];
  progressByNode: Record<string, OpeningNodeProgress>;
  activeNodeId: string;
  onSelect: (node: OpeningVariationNode) => void;
}

export function DuePositionsPanel({ nodes, progressByNode, activeNodeId, onSelect }: DuePositionsPanelProps) {
  const nowMs = Date.now();
  const dueNodes = nodes.filter((node) => isOpeningNodeDue(progressByNode[node.id], nowMs));

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock size={15} className="text-gray-400" />
          <span className="text-[13px] font-bold text-gray-800">Due Positions</span>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-0.5">
          {dueNodes.length}
        </span>
      </div>
      <div className="space-y-2">
        {dueNodes.length === 0 ? (
          <div className="text-[12px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            No due positions left in this opening.
          </div>
        ) : (
          dueNodes.map((node) => {
            const active = node.id === activeNodeId;
            return (
              <button
                key={node.id}
                onClick={() => onSelect(node)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                  active ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] font-bold text-gray-800">{node.expectedMoveSan}</span>
                  <span className="text-[10px] font-semibold text-gray-500">{node.sideToMove === 'w' ? 'White' : 'Black'}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">{node.prompt}</div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

interface NodeProgressPanelProps {
  node: OpeningVariationNode;
  progress: OpeningNodeProgress;
}

export function NodeProgressPanel({ node, progress }: NodeProgressPanelProps) {
  const attempts = progress.correct + progress.missed;
  const accuracy = attempts > 0 ? Math.round((progress.correct / attempts) * 100) : 0;

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={15} className="text-gray-400" />
        <span className="text-[13px] font-bold text-gray-800">Position Progress</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <ProgressMetric label="Attempts" value={String(attempts)} />
        <ProgressMetric label="Accuracy" value={`${accuracy}%`} />
        <ProgressMetric label="Mastery" value={`${progress.mastery}%`} />
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress.mastery}%` }} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-bold text-gray-800 truncate">{node.expectedMoveSan}</div>
          <div className="text-[11px] text-gray-500 truncate">{node.tags.join(' / ')}</div>
        </div>
        <ResultBadge progress={progress} />
      </div>
    </section>
  );
}

function ProgressMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-2">
      <div className="text-[13px] font-bold text-gray-800 leading-tight">{value}</div>
      <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{label}</div>
    </div>
  );
}

function ResultBadge({ progress }: { progress: OpeningNodeProgress }) {
  if (progress.lastResult === 'correct') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
        <CheckCircle2 size={12} />
        Correct
      </span>
    );
  }

  if (progress.lastResult === 'incorrect') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
        <XCircle size={12} />
        Missed
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
      <Circle size={12} />
      New
    </span>
  );
}

interface OpeningNotesPanelProps {
  node: OpeningVariationNode;
  notes: OpeningNotes;
  onOpeningNoteChange: (value: string) => void;
  onNodeNoteChange: (nodeId: string, value: string) => void;
}

export function OpeningNotesPanel({ node, notes, onOpeningNoteChange, onNodeNoteChange }: OpeningNotesPanelProps) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <NotebookPen size={15} className="text-gray-400" />
        <span className="text-[13px] font-bold text-gray-800">Repertoire Notes</span>
      </div>
      <label className="block mb-3">
        <span className="text-[11px] font-semibold text-gray-500">Opening notes</span>
        <textarea
          value={notes.opening}
          onChange={(event) => onOpeningNoteChange(event.target.value)}
          className="mt-1 w-full h-20 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          placeholder="Plans, move-order ideas, transpositions..."
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold text-gray-500">Current position note</span>
        <textarea
          value={notes.nodes[node.id] ?? ''}
          onChange={(event) => onNodeNoteChange(node.id, event.target.value)}
          className="mt-1 w-full h-20 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          placeholder="Cue for this move, common mistake, or plan..."
        />
      </label>
    </section>
  );
}

interface VariationMapPanelProps {
  root: OpeningVariationNode;
  activeNodeId: string;
  progressByNode: Record<string, OpeningNodeProgress>;
  onSelect: (node: OpeningVariationNode) => void;
}

export function VariationMapPanel({ root, activeNodeId, progressByNode, onSelect }: VariationMapPanelProps) {
  return (
    <VariationTree
      node={root}
      activeNodeId={activeNodeId}
      progressByNode={progressByNode}
      onSelect={onSelect}
      nowMs={Date.now()}
    />
  );
}

function VariationTree({
  node,
  activeNodeId,
  progressByNode,
  onSelect,
  nowMs,
  depth = 0,
}: {
  node: OpeningVariationNode;
  activeNodeId: string;
  progressByNode: Record<string, OpeningNodeProgress>;
  onSelect: (node: OpeningVariationNode) => void;
  nowMs: number;
  depth?: number;
}) {
  const active = node.id === activeNodeId;
  const progress = progressByNode[node.id];
  const branchCount = node.branches.length;
  const due = isOpeningNodeDue(progress, nowMs);

  return (
    <div>
      <button
        onClick={() => onSelect(node)}
        className={`w-full text-left rounded-lg border px-3 py-2 mb-2 transition-colors ${
          active ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
        style={{ marginLeft: depth * 14, width: `calc(100% - ${depth * 14}px)` }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
              active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {node.moveNumber}
          </span>
          <span className="text-[12px] font-bold text-gray-800 truncate">{node.expectedMoveSan}</span>
          <div className="flex-1" />
          {due && (
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
              due
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">{node.prompt}</div>
        <div className="flex items-center gap-2 mt-2">
          <SmallStat icon={<Target size={11} />} label={`${progress?.mastery ?? 0}%`} />
          <SmallStat icon={<FileText size={11} />} label={`${progress ? progress.correct + progress.missed : 0} reps`} />
          {branchCount > 0 && <SmallStat icon={<GitBranch size={11} />} label={`${branchCount} branches`} />}
          {progress?.lastResult === 'correct' && <CheckCircle2 size={13} className="text-green-500" />}
          {progress?.lastResult === 'incorrect' && <XCircle size={13} className="text-red-500" />}
        </div>
      </button>
      {node.branches.map((branch) => (
        <VariationTree
          key={branch.id}
          node={branch}
          activeNodeId={activeNodeId}
          progressByNode={progressByNode}
          onSelect={onSelect}
          nowMs={nowMs}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function SmallStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
      {icon}
      {label}
    </span>
  );
}

export function OpeningSummaryStrip({
  nodes,
  progressByNode,
}: {
  nodes: OpeningVariationNode[];
  progressByNode: Record<string, OpeningNodeProgress>;
}) {
  const nowMs = Date.now();
  const dueCount = nodes.filter((node) => isOpeningNodeDue(progressByNode[node.id], nowMs)).length;
  const trainedCount = nodes.filter((node) => {
    const progress = progressByNode[node.id];
    return progress && progress.correct + progress.missed > 0;
  }).length;
  const averageMastery =
    nodes.length === 0
      ? 0
      : Math.round(nodes.reduce((total, node) => total + (progressByNode[node.id]?.mastery ?? 0), 0) / nodes.length);

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <SummaryTile icon={<CalendarClock size={14} />} label="Due" value={String(dueCount)} />
      <SummaryTile icon={<BookMarked size={14} />} label="Trained" value={`${trainedCount}/${nodes.length}`} />
      <SummaryTile icon={<Target size={14} />} label="Mastery" value={`${averageMastery}%`} />
    </div>
  );
}

function isOpeningNodeDue(progress: OpeningNodeProgress | undefined, nowMs: number): boolean {
  if (!progress) return false;

  if (!progress.nextDueAt) {
    return progress.due;
  }

  const dueMs = new Date(progress.nextDueAt).getTime();
  return Number.isFinite(dueMs) ? dueMs <= nowMs : progress.due;
}

function SummaryTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
      <div className="text-[14px] font-bold text-gray-800 leading-tight">{value}</div>
    </div>
  );
}
