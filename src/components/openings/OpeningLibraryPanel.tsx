import { useMemo, useState, type ReactNode } from 'react';
import { BookOpen, CheckCircle2, ChevronDown, Clock3, Filter, Search, Target } from 'lucide-react';
import { OpeningRepertoire } from '../../types';

export type OpeningLibrarySource = 'built-in' | 'imported' | 'user';
export type OpeningLibraryStatus = 'new' | 'studying' | 'due' | 'mastered' | 'paused';

export interface OpeningLibraryMeta {
  source?: OpeningLibrarySource;
  status?: OpeningLibraryStatus;
  tags?: string[];
  dueCount?: number;
  mastery?: number;
  progress?: number;
  trainedPositions?: number;
  totalPositions?: number;
}

export interface OpeningLibraryPanelProps {
  openings: OpeningRepertoire[];
  selectedOpeningId?: string;
  metaByOpeningId?: Record<string, OpeningLibraryMeta>;
  onSelectOpening: (opening: OpeningRepertoire) => void;
  className?: string;
}

type SideFilter = 'all' | 'White' | 'Black';
type SourceFilter = 'all' | OpeningLibrarySource;
type StatusFilter = 'all' | OpeningLibraryStatus;

interface OpeningLibrarySummary {
  opening: OpeningRepertoire;
  dueCount: number;
  mastery: number;
  progress: number;
  tags: string[];
  source: OpeningLibrarySource;
  status: OpeningLibraryStatus;
  totalPositions: number;
  trainedPositions: number;
}

const sourceLabels: Record<OpeningLibrarySource, string> = {
  'built-in': 'Built-in',
  imported: 'Imported',
  user: 'User',
};

const statusLabels: Record<OpeningLibraryStatus, string> = {
  new: 'New',
  studying: 'Studying',
  due: 'Due',
  mastered: 'Mastered',
  paused: 'Paused',
};

export default function OpeningLibraryPanel({
  openings,
  selectedOpeningId,
  metaByOpeningId = {},
  onSelectOpening,
  className = '',
}: OpeningLibraryPanelProps) {
  const [query, setQuery] = useState('');
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tagFilter, setTagFilter] = useState('all');

  const summaries = useMemo(
    () =>
      openings.map((opening) => {
        const meta = metaByOpeningId[opening.id] ?? {};
        const dueCount = meta.dueCount ?? opening.duePositions;
        const mastery = clampPercent(meta.mastery ?? opening.mastery);
        const progress = clampPercent(meta.progress ?? opening.accuracy);
        const tags = uniqueTags([...opening.tags, ...(meta.tags ?? [])]);
        const source = meta.source ?? inferSource(tags);
        const status = meta.status ?? inferStatus({ dueCount, mastery, progress });
        const totalPositions = meta.totalPositions ?? opening.totalPositions;
        const trainedPositions = meta.trainedPositions ?? Math.round((progress / 100) * totalPositions);

        return {
          opening,
          dueCount,
          mastery,
          progress,
          tags,
          source,
          status,
          totalPositions,
          trainedPositions,
        };
      }),
    [openings, metaByOpeningId]
  );

  const availableTags = useMemo(
    () => uniqueTags(summaries.flatMap((summary) => summary.tags)).sort((a, b) => a.localeCompare(b)),
    [summaries]
  );

  const filteredSummaries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return summaries.filter((summary) => {
      const opening = summary.opening;
      const queryMatches =
        !normalizedQuery ||
        [opening.name, opening.eco, opening.family, opening.description, opening.side, ...summary.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return (
        queryMatches &&
        (sideFilter === 'all' || opening.side === sideFilter) &&
        (sourceFilter === 'all' || summary.source === sourceFilter) &&
        (statusFilter === 'all' || summary.status === statusFilter) &&
        (tagFilter === 'all' || summary.tags.includes(tagFilter))
      );
    });
  }, [query, sideFilter, sourceFilter, statusFilter, tagFilter, summaries]);

  const dueTotal = summaries.reduce((total, summary) => total + summary.dueCount, 0);
  const averageMastery =
    summaries.length === 0
      ? 0
      : Math.round(summaries.reduce((total, summary) => total + summary.mastery, 0) / summaries.length);

  return (
    <section className={`flex h-full min-h-0 flex-col bg-white ${className}`}>
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BookOpen size={14} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[13px] font-bold text-gray-900">Opening Library</h2>
              <div className="text-[11px] text-gray-500">
                {openings.length} lines / {dueTotal} due
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[14px] font-bold leading-tight text-gray-900">{averageMastery}%</div>
            <div className="text-[10px] font-semibold text-gray-400">Mastery</div>
          </div>
        </div>

        <label className="mt-3 flex h-8 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <Search size={14} className="flex-shrink-0 text-gray-400" />
          <span className="sr-only">Search openings</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search openings, ECO, tags..."
            className="min-w-0 flex-1 bg-transparent text-[12px] text-gray-700 outline-none placeholder:text-gray-400"
          />
        </label>
      </div>

      <div className="border-b border-gray-100 px-3 py-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
          <Filter size={12} />
          Filters
        </div>
        <div className="space-y-2">
          <SegmentedControl
            label="Side"
            value={sideFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'White', label: 'White' },
              { value: 'Black', label: 'Black' },
            ]}
            onChange={(value) => setSideFilter(value as SideFilter)}
          />
          <div className="grid grid-cols-2 gap-2">
            <SelectControl
              label="Source"
              value={sourceFilter}
              options={[
                { value: 'all', label: 'All sources' },
                { value: 'built-in', label: sourceLabels['built-in'] },
                { value: 'imported', label: sourceLabels.imported },
                { value: 'user', label: sourceLabels.user },
              ]}
              onChange={(value) => setSourceFilter(value as SourceFilter)}
            />
            <SelectControl
              label="Status"
              value={statusFilter}
              options={[
                { value: 'all', label: 'All status' },
                { value: 'due', label: statusLabels.due },
                { value: 'studying', label: statusLabels.studying },
                { value: 'new', label: statusLabels.new },
                { value: 'mastered', label: statusLabels.mastered },
                { value: 'paused', label: statusLabels.paused },
              ]}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
            />
          </div>
          <SelectControl
            label="Tag"
            value={tagFilter}
            options={[
              { value: 'all', label: 'All tags' },
              ...availableTags.map((tag) => ({ value: tag, label: tag })),
            ]}
            onChange={setTagFilter}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filteredSummaries.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-center">
            <div className="text-[12px] font-bold text-gray-700">No openings match</div>
            <div className="mt-1 text-[11px] text-gray-500">Adjust search or filters.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSummaries.map((summary) => (
              <OpeningListItem
                key={summary.opening.id}
                summary={summary}
                active={summary.opening.id === selectedOpeningId}
                onClick={() => onSelectOpening(summary.opening)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function OpeningListItem({
  summary,
  active,
  onClick,
}: {
  summary: OpeningLibrarySummary;
  active: boolean;
  onClick: () => void;
}) {
  const { opening, dueCount, mastery, progress, tags, source, status, totalPositions, trainedPositions } = summary;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left shadow-sm transition-colors ${
        active ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
            active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <BookOpen size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-bold text-gray-900">{opening.name}</span>
            <span className="flex-shrink-0 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              {opening.eco}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
            <span>{opening.side}</span>
            <span className="text-gray-300">/</span>
            <span className="truncate">{opening.family}</span>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
            <div className="min-w-0">
              <ProgressBar value={mastery} active={active} />
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-semibold text-gray-400">
                <span>{trainedPositions}/{totalPositions} trained</span>
                <span>{mastery}% mastery</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <SmallMetric icon={<Clock3 size={11} />} value={String(dueCount)} label="Due" tone={dueCount > 0 ? 'blue' : 'gray'} />
              <SmallMetric icon={<Target size={11} />} value={`${progress}%`} label="Prog" />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusChip status={status} />
            <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              {sourceLabels[source]}
            </span>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
                +{tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold text-gray-400">{label}</div>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`h-7 rounded-md text-[11px] font-semibold transition-colors ${
                active ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-white/70'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold text-gray-400">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 pl-2.5 pr-7 text-[11px] font-semibold text-gray-600 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
      </span>
    </label>
  );
}

function ProgressBar({ value, active }: { value: number; active: boolean }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
      <div className={`h-full rounded-full ${active ? 'bg-blue-600' : 'bg-blue-500'}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function SmallMetric({
  icon,
  value,
  label,
  tone = 'gray',
}: {
  icon: ReactNode;
  value: string;
  label: string;
  tone?: 'gray' | 'blue';
}) {
  return (
    <div className={`min-w-[42px] rounded-md border px-1.5 py-1 ${tone === 'blue' ? 'border-blue-100 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className={`flex items-center gap-1 text-[11px] font-bold leading-tight ${tone === 'blue' ? 'text-blue-700' : 'text-gray-700'}`}>
        {icon}
        {value}
      </div>
      <div className="mt-0.5 text-[9px] font-semibold leading-tight text-gray-400">{label}</div>
    </div>
  );
}

function StatusChip({ status }: { status: OpeningLibraryStatus }) {
  if (status === 'mastered') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
        <CheckCircle2 size={10} />
        Mastered
      </span>
    );
  }

  if (status === 'due') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
        <Clock3 size={10} />
        Due
      </span>
    );
  }

  return (
    <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
      {statusLabels[status]}
    </span>
  );
}

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.filter(Boolean)));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function inferSource(tags: string[]): OpeningLibrarySource {
  if (tags.some((tag) => tag.toLowerCase() === 'imported')) return 'imported';
  return 'built-in';
}

function inferStatus({
  dueCount,
  mastery,
  progress,
}: {
  dueCount: number;
  mastery: number;
  progress: number;
}): OpeningLibraryStatus {
  if (dueCount > 0) return 'due';
  if (mastery >= 85) return 'mastered';
  if (progress <= 0 && mastery <= 0) return 'new';
  return 'studying';
}
