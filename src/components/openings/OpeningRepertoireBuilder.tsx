import type { ReactNode } from 'react';
import { BookMarked, Check, ChevronDown, Power, Shield, Star, Target } from 'lucide-react';
import { OpeningRepertoire } from '../../types';

export type OpeningRepertoireUseCase = 'as-white' | 'as-black' | 'against-e4' | 'against-d4';
export type OpeningRepertoirePriority = 'low' | 'normal' | 'high' | 'core';

export interface OpeningRepertoireBuilderProps {
  opening?: OpeningRepertoire;
  inRepertoire: boolean;
  useCase: OpeningRepertoireUseCase;
  priority: OpeningRepertoirePriority;
  enabled: boolean;
  onInRepertoireChange: (value: boolean) => void;
  onUseCaseChange: (value: OpeningRepertoireUseCase) => void;
  onPriorityChange: (value: OpeningRepertoirePriority) => void;
  onEnabledChange: (value: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const useCaseOptions: { value: OpeningRepertoireUseCase; label: string; description: string }[] = [
  { value: 'as-white', label: 'As White', description: 'Train White move orders' },
  { value: 'as-black', label: 'As Black', description: 'Train Black replies' },
  { value: 'against-e4', label: 'Against 1.e4', description: 'Black response repertoire' },
  { value: 'against-d4', label: 'Against 1.d4', description: 'Black response repertoire' },
];

const priorityOptions: { value: OpeningRepertoirePriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Occasional review' },
  { value: 'normal', label: 'Normal', description: 'Standard cadence' },
  { value: 'high', label: 'High', description: 'Prefer in queues' },
  { value: 'core', label: 'Core', description: 'Main repertoire' },
];

export default function OpeningRepertoireBuilder({
  opening,
  inRepertoire,
  useCase,
  priority,
  enabled,
  onInRepertoireChange,
  onUseCaseChange,
  onPriorityChange,
  onEnabledChange,
  className = '',
  disabled = false,
}: OpeningRepertoireBuilderProps) {
  const activeUseCase = useCaseOptions.find((option) => option.value === useCase) ?? useCaseOptions[0];
  const activePriority = priorityOptions.find((option) => option.value === priority) ?? priorityOptions[1];
  const locked = disabled || !inRepertoire;

  return (
    <section className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BookMarked size={14} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-gray-900">Repertoire Builder</div>
            <div className="truncate text-[11px] text-gray-500">
              {opening ? `${opening.eco} / ${opening.name}` : 'Configure opening use'}
            </div>
          </div>
        </div>
        <ToggleButton
          label="Enabled"
          checked={enabled}
          disabled={disabled || !inRepertoire}
          onChange={onEnabledChange}
          icon={<Power size={13} />}
        />
      </div>

      <div className="space-y-3 p-4">
        <button
          type="button"
          onClick={() => onInRepertoireChange(!inRepertoire)}
          disabled={disabled}
          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${
            inRepertoire ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:bg-white'
          }`}
        >
          <span
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
              inRepertoire ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-transparent'
            }`}
          >
            <Check size={13} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-bold text-gray-800">In repertoire</span>
            <span className="block truncate text-[11px] text-gray-500">
              {inRepertoire ? 'Included in opening review queues' : 'Excluded from repertoire training'}
            </span>
          </span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Use case"
            value={useCase}
            options={useCaseOptions}
            disabled={locked}
            onChange={(value) => onUseCaseChange(value as OpeningRepertoireUseCase)}
          />
          <SelectField
            label="Priority"
            value={priority}
            options={priorityOptions}
            disabled={locked}
            onChange={(value) => onPriorityChange(value as OpeningRepertoirePriority)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SummaryTile icon={<Shield size={13} />} label="Use" value={activeUseCase.label} disabled={locked} />
          <SummaryTile icon={<Star size={13} />} label="Priority" value={activePriority.label} disabled={locked} />
          <SummaryTile icon={<Target size={13} />} label="State" value={enabled && inRepertoire ? 'On' : 'Off'} disabled={disabled} />
        </div>

        {opening && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[12px] font-bold text-gray-800">{opening.family}</div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  {opening.totalPositions} positions / {opening.duePositions} due
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold text-gray-800">{opening.mastery}%</div>
                <div className="text-[10px] font-semibold text-gray-400">Mastery</div>
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${clampPercent(opening.mastery)}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ToggleButton({
  label,
  checked,
  disabled,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; description: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const activeOption = options.find((option) => option.value === value);

  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold text-gray-400">{label}</span>
      <span className="relative block">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 pl-2.5 pr-7 text-[11px] font-semibold text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
      </span>
      <span className="mt-1 block truncate text-[10px] text-gray-400">{activeOption?.description}</span>
    </label>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  disabled: boolean;
}) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${disabled ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'}`}>
      <div className="mb-1 flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
      <div className="truncate text-[12px] font-bold leading-tight text-gray-800">{value}</div>
    </div>
  );
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
