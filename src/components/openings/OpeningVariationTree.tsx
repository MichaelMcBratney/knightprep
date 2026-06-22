import {
  CheckCircle2,
  ChevronRight,
  Circle,
  FileText,
  GitBranch,
  Target,
  XCircle,
} from 'lucide-react';
import type { OpeningProgressMap, OpeningVariationNode } from '../../types';

export interface OpeningVariationTreeProps {
  root: OpeningVariationNode;
  activeNodeId?: string;
  activePathNodeIds?: string[];
  progressByNode?: OpeningProgressMap;
  dueNodeIds?: string[];
  weakNodeIds?: string[];
  onSelect?: (node: OpeningVariationNode) => void;
  className?: string;
}

export default function OpeningVariationTree({
  root,
  activeNodeId,
  activePathNodeIds,
  progressByNode = {},
  dueNodeIds,
  weakNodeIds,
  onSelect,
  className = '',
}: OpeningVariationTreeProps) {
  const activePath = activePathNodeIds ?? (activeNodeId ? findPathIds(root, activeNodeId) : []);
  const dueIds = new Set(dueNodeIds ?? collectMatchingNodeIds(root, (node) => isNodeDue(progressByNode[node.id])));
  const weakIds = new Set(weakNodeIds ?? collectMatchingNodeIds(root, (node) => isWeakNode(progressByNode[node.id])));

  return (
    <div className={`space-y-1.5 ${className}`}>
      <VariationTreeNode
        node={root}
        depth={0}
        activeNodeId={activeNodeId}
        activePath={new Set(activePath)}
        progressByNode={progressByNode}
        dueIds={dueIds}
        weakIds={weakIds}
        onSelect={onSelect}
      />
    </div>
  );
}

function VariationTreeNode({
  node,
  depth,
  activeNodeId,
  activePath,
  progressByNode,
  dueIds,
  weakIds,
  onSelect,
}: {
  node: OpeningVariationNode;
  depth: number;
  activeNodeId?: string;
  activePath: Set<string>;
  progressByNode: OpeningProgressMap;
  dueIds: Set<string>;
  weakIds: Set<string>;
  onSelect?: (node: OpeningVariationNode) => void;
}) {
  const active = node.id === activeNodeId;
  const inActivePath = activePath.has(node.id);
  const progress = progressByNode[node.id];
  const branchCount = node.branches.length;
  const attempts = progress?.attempts ?? (progress ? progress.correct + progress.missed : 0);
  const due = dueIds.has(node.id);
  const weak = weakIds.has(node.id);
  const connectorVisible = depth > 0;

  return (
    <div>
      <div className="relative" style={{ paddingLeft: depth * 16 }}>
        {connectorVisible && (
          <span
            className={`absolute left-0 top-0 h-full border-l ${inActivePath ? 'border-blue-300' : 'border-gray-200'}`}
            style={{ marginLeft: depth * 16 - 9 }}
          />
        )}
        <button
          type="button"
          onClick={() => onSelect?.(node)}
          disabled={!onSelect}
          className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
            active
              ? 'bg-blue-50 border-blue-200 shadow-sm'
              : inActivePath
                ? 'bg-white border-blue-100 hover:bg-blue-50/40'
                : 'bg-white border-gray-200 hover:bg-gray-50'
          } ${!onSelect ? 'cursor-default' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-5 w-5 rounded-md flex flex-shrink-0 items-center justify-center text-[10px] font-bold ${
                active
                  ? 'bg-blue-600 text-white'
                  : inActivePath
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {node.moveNumber}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12px] font-bold text-gray-900 truncate">{node.expectedMoveSan}</span>
                {node.incomingMoveSan && (
                  <span className="text-[10px] text-gray-400 truncate">after {node.incomingMoveSan}</span>
                )}
              </div>
            </div>
            <VariationStatusIcon result={progress?.lastResult} />
            {due && <TreeBadge label="due" tone="blue" />}
            {weak && <TreeBadge label="weak" tone="amber" />}
            {branchCount > 0 && (
              <ChevronRight
                size={13}
                className={`flex-shrink-0 ${inActivePath ? 'text-blue-400' : 'text-gray-300'}`}
              />
            )}
          </div>

          <div className="mt-1 text-[11px] text-gray-500 line-clamp-2">{node.prompt}</div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <SmallStat icon={<Target size={11} />} label={`${progress?.mastery ?? 0}%`} />
            <SmallStat icon={<FileText size={11} />} label={`${attempts} reps`} />
            {branchCount > 0 && <SmallStat icon={<GitBranch size={11} />} label={`${branchCount} branch${branchCount === 1 ? '' : 'es'}`} />}
            {node.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </button>
      </div>

      {node.branches.length > 0 && (
        <div className="mt-1.5 space-y-1.5">
          {node.branches.map((branch) => (
            <VariationTreeNode
              key={branch.id}
              node={branch}
              depth={depth + 1}
              activeNodeId={activeNodeId}
              activePath={activePath}
              progressByNode={progressByNode}
              dueIds={dueIds}
              weakIds={weakIds}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
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

function TreeBadge({ label, tone }: { label: string; tone: 'blue' | 'amber' }) {
  const toneClass =
    tone === 'amber'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-blue-700 bg-blue-50 border-blue-100';

  return (
    <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border ${toneClass}`}>
      {label}
    </span>
  );
}

function VariationStatusIcon({ result }: { result?: 'correct' | 'incorrect' }) {
  if (result === 'correct') return <CheckCircle2 size={13} className="flex-shrink-0 text-green-500" />;
  if (result === 'incorrect') return <XCircle size={13} className="flex-shrink-0 text-red-500" />;
  return <Circle size={12} className="flex-shrink-0 text-gray-300" />;
}

function findPathIds(root: OpeningVariationNode, nodeId: string): string[] {
  if (root.id === nodeId) return [root.id];

  for (const branch of root.branches) {
    const path = findPathIds(branch, nodeId);
    if (path.length > 0) return [root.id, ...path];
  }

  return [];
}

function collectMatchingNodeIds(root: OpeningVariationNode, predicate: (node: OpeningVariationNode) => boolean): string[] {
  return [
    ...(predicate(root) ? [root.id] : []),
    ...root.branches.flatMap((branch) => collectMatchingNodeIds(branch, predicate)),
  ];
}

function isNodeDue(progress: OpeningProgressMap[string] | undefined): boolean {
  if (!progress) return false;
  if (!progress.nextDueAt) return progress.due;

  const dueMs = new Date(progress.nextDueAt).getTime();
  return Number.isFinite(dueMs) ? dueMs <= Date.now() : progress.due;
}

function isWeakNode(progress: OpeningProgressMap[string] | undefined): boolean {
  if (!progress) return false;
  return progress.lastResult === 'incorrect' || progress.lapses > 0 || progress.mastery < 50;
}
