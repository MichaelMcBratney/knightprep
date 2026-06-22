import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, Upload, X } from 'lucide-react';
import { ImportedOpeningLine } from '../../types';
import { parsePgnImport } from '../../utils/openings';

interface OpeningImportPanelProps {
  importedLines: ImportedOpeningLine[];
  onImport: (line: ImportedOpeningLine) => void;
}

const samplePgn = `[Opening "Queen's Gambit Accepted"]
[White "Repertoire"]
[Black "Main line"]

1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5`;

export default function OpeningImportPanel({ importedLines, onImport }: OpeningImportPanelProps) {
  const [rawPgn, setRawPgn] = useState('');
  const [lastImportedId, setLastImportedId] = useState<string | null>(null);

  const preview = useMemo(() => (rawPgn.trim() ? parsePgnImport(rawPgn) : null), [rawPgn]);
  const canImport = Boolean(preview && preview.moves.length > 0 && preview.errors.length === 0);

  const handleImport = () => {
    if (!canImport) return;

    const importedLine = parsePgnImport(rawPgn);
    onImport(importedLine);
    setLastImportedId(importedLine.id);
    setRawPgn('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleImport();
    }

    if (event.key === 'Escape' && rawPgn) {
      event.preventDefault();
      setRawPgn('');
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Upload size={14} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-gray-900">Import PGN</div>
          <div className="text-[11px] text-gray-500 truncate">Paste one repertoire line</div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <label className="block">
          <span className="sr-only">Paste PGN line</span>
          <textarea
            value={rawPgn}
            onChange={(event) => {
              setRawPgn(event.target.value);
              setLastImportedId(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={samplePgn}
            rows={5}
            spellCheck={false}
            aria-describedby="opening-import-help"
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] leading-relaxed text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div id="opening-import-help" className="flex items-start gap-2 text-[11px] text-gray-500">
          <ClipboardList size={13} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <span>Ctrl+Enter imports. Escape clears the paste box.</span>
        </div>

        {preview && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3" aria-live="polite">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-gray-800 truncate">{preview.name}</div>
                <div className="text-[11px] text-gray-500">{preview.moves.length} moves detected</div>
              </div>
              <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-500">
                Preview
              </span>
            </div>

            {preview.moves.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preview.moves.slice(0, 12).map((move, index) => (
                  <span key={`${move}-${index}`} className="rounded-md bg-white border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-700">
                    {move}
                  </span>
                ))}
                {preview.moves.length > 12 && (
                  <span className="rounded-md bg-white border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-500">
                    +{preview.moves.length - 12}
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                Add a PGN move list such as 1. e4 e5 2. Nf3 Nc6.
              </div>
            )}

            {preview.errors.length > 0 && (
              <div className="mt-2 text-[11px] text-red-600">{preview.errors[0]}</div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
            className="h-8 flex-1 rounded-lg bg-blue-600 px-3 text-[12px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Import preview
          </button>
          <button
            type="button"
            onClick={() => setRawPgn('')}
            disabled={!rawPgn}
            aria-label="Clear PGN import"
            className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <X size={14} className="mx-auto" />
          </button>
        </div>

        {lastImportedId && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-[11px] font-semibold text-green-700">
            <CheckCircle2 size={13} />
            Line added to import queue
          </div>
        )}

        {importedLines.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Queued</div>
            <div className="mt-2 space-y-2">
              {importedLines.slice(0, 3).map((line) => (
                <div key={line.id} className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
                  <div className="truncate text-[12px] font-bold text-gray-800">{line.name}</div>
                  <div className="mt-0.5 text-[11px] text-gray-500">{line.moves.length} moves parsed as preview</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
