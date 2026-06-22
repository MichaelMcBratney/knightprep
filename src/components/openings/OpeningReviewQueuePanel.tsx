import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Layers3,
  Play,
  Target,
} from 'lucide-react';
import type { OpeningDuePosition } from '../../types';

export interface OpeningReviewQueuePanelProps {
  duePositions: OpeningDuePosition[];
  selectedDuePositions: OpeningDuePosition[];
  selectedOpeningName?: string;
  activeNodeId?: string;
  weakPositions?: OpeningDuePosition[];
  weakLineMode?: boolean;
  maxPreviewItems?: number;
  onReviewAll?: () => void;
  onReviewSelected?: () => void;
  onTrainWeakLines?: () => void;
  onSelectPosition?: (position: OpeningDuePosition) => void;
  className?: string;
}

export default function OpeningReviewQueuePanel({
  duePositions,
  selectedDuePositions,
  selectedOpeningName = 'Selected opening',
  activeNodeId,
  weakPositions,
  weakLineMode = false,
  maxPreviewItems = 5,
  onReviewAll,
  onReviewSelected,
  onTrainWeakLines,
  onSelectPosition,
  className = '',
}: OpeningReviewQueuePanelProps) {
  const weakQueue = weakPositions ?? duePositions.filter(isWeakPosition);
  const allPreview = duePositions.slice(0, maxPreviewItems);
  const selectedPreview = selectedDuePositions.slice(0, maxPreviewItems);

  return (
    <section className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarClock size={15} className="text-gray-400" />
            <h3 className="text-[13px] font-bold text-gray-900">Opening Review Queue</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 truncate">
            {duePositions.length > 0
              ? `${duePositions.length} due across repertoire`
              : 'No opening positions are due right now'}
          </p>
        </div>
        {weakLineMode && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
            <AlertTriangle size={12} />
            Weak lines
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <QueueMetric icon={<Layers3 size={14} />} label="All due" value={String(duePositions.length)} />
        <QueueMetric icon={<Target size={14} />} label="Selected" value={String(selectedDuePositions.length)} />
        <QueueMetric icon={<AlertTriangle size={14} />} label="Weak" value={String(weakQueue.length)} tone="amber" />
      </div>

      <div className="grid gap-2 sm:grid-cols-3 mb-4">
        <QueueActionButton
          icon={<Play size={13} />}
          label="Review all"
          count={duePositions.length}
          disabled={duePositions.length === 0}
          onClick={onReviewAll}
        />
        <QueueActionButton
          icon={<Crosshair size={13} />}
          label="Review selected"
          count={selectedDuePositions.length}
          disabled={selectedDuePositions.length === 0}
          onClick={onReviewSelected}
        />
        <QueueActionButton
          icon={<AlertTriangle size={13} />}
          label="Train weak lines"
          count={weakQueue.length}
          disabled={weakQueue.length === 0}
          onClick={onTrainWeakLines}
          tone="amber"
        />
      </div>

      <div className="space-y-4">
        <QueueList
          title="Selected opening"
          subtitle={selectedOpeningName}
          positions={selectedPreview}
          emptyText="No due positions in this opening."
          activeNodeId={activeNodeId}
          onSelectPosition={onSelectPosition}
        />
        <QueueList
          title="Across openings"
          subtitle={duePositions.length > maxPreviewItems ? `${duePositions.length - maxPreviewItems} more after these` : 'Highest priority first'}
          positions={allPreview}
          emptyText="Your opening queue is clear."
          activeNodeId={activeNodeId}
          onSelectPosition={onSelectPosition}
          showOpeningName
        />
      </div>
    </section>
  );
}

function QueueMetric({
  icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'blue' | 'amber';
}) {
  const toneClass = tone === 'amber' ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50';

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
      <div className={`inline-flex min-w-7 justify-center rounded-md px-1.5 py-0.5 text-[14px] font-bold leading-tight ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function QueueActionButton({
  icon,
  label,
  count,
  disabled,
  onClick,
  tone = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  disabled: boolean;
  onClick?: () => void;
  tone?: 'blue' | 'amber';
}) {
  const enabledClass =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`h-9 rounded-lg border px-3 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
        disabled || !onClick ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : enabledClass
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
      <span className="text-[10px] opacity-75">({count})</span>
    </button>
  );
}

function QueueList({
  title,
  subtitle,
  positions,
  emptyText,
  activeNodeId,
  showOpeningName = false,
  onSelectPosition,
}: {
  title: string;
  subtitle: string;
  positions: OpeningDuePosition[];
  emptyText: string;
  activeNodeId?: string;
  showOpeningName?: boolean;
  onSelectPosition?: (position: OpeningDuePosition) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-[12px] font-bold text-gray-800">{title}</div>
          <div className="text-[10px] text-gray-400 truncate">{subtitle}</div>
        </div>
        {positions.length > 0 && (
          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
            {positions.length}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {positions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            {emptyText}
          </div>
        ) : (
          positions.map((position) => (
            <QueuePositionButton
              key={`${position.openingId}-${position.node.id}`}
              position={position}
              active={position.node.id === activeNodeId}
              showOpeningName={showOpeningName}
              onSelectPosition={onSelectPosition}
            />
          ))
        )}
      </div>
    </div>
  );
}

function QueuePositionButton({
  position,
  active,
  showOpeningName,
  onSelectPosition,
}: {
  position: OpeningDuePosition;
  active: boolean;
  showOpeningName: boolean;
  onSelectPosition?: (position: OpeningDuePosition) => void;
}) {
  const progress = position.progress;
  const weak = isWeakPosition(position);

  return (
    <button
      type="button"
      onClick={() => onSelectPosition?.(position)}
      disabled={!onSelectPosition}
      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
        active ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
      } ${!onSelectPosition ? 'cursor-default' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-bold text-gray-900 truncate">{position.node.expectedMoveSan}</span>
        {showOpeningName && <span className="text-[10px] text-gray-400 truncate">{position.openingName}</span>}
        <div className="flex-1" />
        {weak && (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
            weak
          </span>
        )}
        {progress?.lastResult === 'correct' && <CheckCircle2 size={13} className="text-green-500" />}
        <ChevronRight size={13} className={onSelectPosition ? 'text-gray-300' : 'text-transparent'} />
      </div>
      <div className="mt-1 text-[11px] text-gray-500 line-clamp-1">{position.node.prompt}</div>
      <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-gray-400">
        <span>{position.node.sideToMove === 'w' ? 'White' : 'Black'} to move</span>
        <span>{progress?.mastery ?? 0}% mastery</span>
        <span>{progress?.attempts ?? 0} reps</span>
      </div>
    </button>
  );
}

function isWeakPosition(position: OpeningDuePosition): boolean {
  const progress = position.progress;
  if (!progress) return false;

  return progress.lastResult === 'incorrect' || progress.lapses > 0 || progress.mastery < 50;
}
