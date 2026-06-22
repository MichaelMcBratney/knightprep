import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  GitBranch,
  ListChecks,
  NotebookPen,
  Play,
  RotateCcw,
  Save,
  Target,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  importedOpeningLines,
  openingNotesById as initialOpeningNotesById,
  openingProgressById,
  openingRepertoires,
} from '../mockData';
import {
  ImportedOpeningLine,
  OpeningMoveHistoryEntry,
  OpeningRating,
  OpeningRepertoire,
  OpeningVariationNode,
} from '../types';
import { fenToBoard } from '../utils/chess';
import {
  applyOpeningReview,
  createOpeningProgress,
  createOpeningRepertoireFromImportedLine,
  deriveOpeningReviewCards,
  findOpeningNode,
  findOpeningPath,
  flattenOpeningNodes,
  getDueOpeningPositions,
  getOpeningRepertoireStats,
  getOpeningWeaknessSummaries,
} from '../utils/openings';
import ChessBoard from './ChessBoard';
import OpeningLibraryPanel, { type OpeningLibraryMeta } from './openings/OpeningLibraryPanel';
import OpeningImportPanel from './openings/OpeningImportPanel';
import OpeningProgressDashboard from './openings/OpeningProgressDashboard';
import OpeningRepertoireBuilder, {
  type OpeningRepertoirePriority,
  type OpeningRepertoireUseCase,
} from './openings/OpeningRepertoireBuilder';
import OpeningReviewQueuePanel from './openings/OpeningReviewQueuePanel';
import OpeningVariationTree from './openings/OpeningVariationTree';
import OpeningWeaknessPanel from './openings/OpeningWeaknessPanel';
import { MoveHistoryPanel, OpeningSummaryStrip } from './openings/OpeningTrainingPanels';

type AnswerState = 'unanswered' | 'correct' | 'incorrect';
type OpeningPhase = 'awaitingMove' | 'awaitingGrade' | 'playingOpponent' | 'branchChoice' | 'lineComplete';

const ratingOptions: { rating: OpeningRating; label: string; description: string }[] = [
  { rating: 'again', label: 'Again', description: 'Soon' },
  { rating: 'hard', label: 'Hard', description: '1d' },
  { rating: 'good', label: 'Good', description: 'Stable' },
  { rating: 'easy', label: 'Easy', description: 'Later' },
];

interface RepertoireSettings {
  inRepertoire: boolean;
  useCase: OpeningRepertoireUseCase;
  priority: OpeningRepertoirePriority;
  enabled: boolean;
}

export default function OpeningsPage() {
  const [selectedOpeningId, setSelectedOpeningId] = useState(openingRepertoires[0]?.id ?? '');
  const [importedLines, setImportedLines] = useState<ImportedOpeningLine[]>(importedOpeningLines);
  const allOpenings = useMemo(
    () => [...openingRepertoires, ...importedLines.map((line) => createOpeningRepertoireFromImportedLine(line, openingRepertoires[0]))],
    [importedLines]
  );
  const selectedOpening = useMemo(
    () => allOpenings.find((opening) => opening.id === selectedOpeningId) ?? allOpenings[0],
    [allOpenings, selectedOpeningId]
  );
  const [currentNodeId, setCurrentNodeId] = useState(openingRepertoires[0].root.id);
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [phase, setPhase] = useState<OpeningPhase>('awaitingMove');
  const [moveInput, setMoveInput] = useState('');
  const [boardFenOverride, setBoardFenOverride] = useState<string | null>(null);
  const [playbackLabel, setPlaybackLabel] = useState('');
  const [progressByNodeId, setProgressByNodeId] = useState(() =>
    importedOpeningLines.reduce(
      (progress, line) => ({
        ...progress,
        ...createOpeningProgress(createOpeningRepertoireFromImportedLine(line, openingRepertoires[0])),
      }),
      openingProgressById
    )
  );
  const [moveHistory, setMoveHistory] = useState<OpeningMoveHistoryEntry[]>([]);
  const [mistakeQueue, setMistakeQueue] = useState<string[]>([]);
  const [reviewingMistakes, setReviewingMistakes] = useState(false);
  const [openingNotesByOpeningId, setOpeningNotesByOpeningId] = useState<Record<string, string>>(() =>
    Object.values(initialOpeningNotesById).reduce<Record<string, string>>((notes, note) => {
      if (!note.nodeId) notes[note.openingId] = note.body;
      return notes;
    }, {})
  );
  const [notesByNodeId, setNotesByNodeId] = useState<Record<string, string>>(() =>
    Object.values(initialOpeningNotesById).reduce<Record<string, string>>((notes, note) => {
      if (note.nodeId) notes[note.nodeId] = note.body;
      return notes;
    }, {})
  );
  const [openingNoteDraft, setOpeningNoteDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [repertoireSettingsByOpeningId, setRepertoireSettingsByOpeningId] = useState<Record<string, RepertoireSettings>>({});
  const gradingLockedRef = useRef(false);

  const currentNode = findOpeningNode(selectedOpening.root, currentNodeId) ?? selectedOpening.root;
  const currentLine = findOpeningPath(selectedOpening.root, currentNode.id);
  const currentProgress = progressByNodeId[currentNode.id];
  const boardFen = boardFenOverride ?? currentNode.fen;
  const board = fenToBoard(boardFen);
  const selectedNodes = useMemo(() => flattenOpeningNodes(selectedOpening.root), [selectedOpening]);
  const activeRepertoireOpenings = useMemo(
    () =>
      allOpenings.filter((opening) =>
        isOpeningRepertoireEnabled(opening, repertoireSettingsByOpeningId[opening.id])
      ),
    [allOpenings, repertoireSettingsByOpeningId]
  );
  const duePositions = useMemo(
    () => getDueOpeningPositions(activeRepertoireOpenings, progressByNodeId, new Date().toISOString()),
    [activeRepertoireOpenings, progressByNodeId]
  );
  const selectedDuePositions = duePositions.filter((position) => position.openingId === selectedOpening.id);
  const generatedCards = useMemo(
    () => deriveOpeningReviewCards(activeRepertoireOpenings, progressByNodeId, new Date().toISOString()),
    [activeRepertoireOpenings, progressByNodeId]
  );
  const generatedCardsByOpeningId = useMemo(
    () =>
      generatedCards.reduce<Record<string, number>>((counts, card) => {
        counts[card.openingId] = (counts[card.openingId] ?? 0) + 1;
        return counts;
      }, {}),
    [generatedCards]
  );
  const libraryMetaByOpeningId = useMemo(
    () =>
      allOpenings.reduce<Record<string, OpeningLibraryMeta>>((meta, opening) => {
        const stats = getOpeningRepertoireStats(opening, progressByNodeId, new Date().toISOString());
        const enabled = isOpeningRepertoireEnabled(opening, repertoireSettingsByOpeningId[opening.id]);
        meta[opening.id] = {
          source: opening.tags.some((tag) => tag.toLowerCase() === 'imported') ? 'imported' : 'built-in',
          status: !enabled ? 'paused' : stats.duePositions > 0 ? 'due' : stats.averageMastery >= 85 ? 'mastered' : stats.reviewCount === 0 ? 'new' : 'studying',
          tags: opening.tags,
          dueCount: enabled ? stats.duePositions : 0,
          mastery: stats.averageMastery,
          progress: stats.coverage,
          trainedPositions: stats.trainedPositions,
          totalPositions: stats.totalPositions,
        };
        return meta;
      }, {}),
    [allOpenings, progressByNodeId, repertoireSettingsByOpeningId]
  );
  const weaknessSummaries = useMemo(
    () => getOpeningWeaknessSummaries(activeRepertoireOpenings, progressByNodeId, new Date().toISOString(), 12),
    [activeRepertoireOpenings, progressByNodeId]
  );
  const weakNodeIds = weaknessSummaries.map((weakness) => weakness.nodeId);
  const dueNodeIds = duePositions.map((position) => position.node.id);
  const weakDuePositions = duePositions.filter((position) => weakNodeIds.includes(position.node.id));
  const selectedGeneratedCardCount = generatedCardsByOpeningId[selectedOpening.id] ?? 0;
  const selectedRepertoireSettings =
    repertoireSettingsByOpeningId[selectedOpening.id] ?? getDefaultRepertoireSettings(selectedOpening);
  const sessionAccuracy = moveHistory.length
    ? Math.round((moveHistory.filter((entry) => entry.result === 'correct').length / moveHistory.filter((entry) => entry.actor === 'user').length) * 100) || 0
    : 0;

  useEffect(() => {
    setCurrentNodeId(pendingNodeId ?? selectedOpening.root.id);
    setPendingNodeId(null);
    setAnswerState('unanswered');
    setPhase('awaitingMove');
    setMoveInput('');
    setBoardFenOverride(null);
    setPlaybackLabel('');
    setReviewingMistakes(false);
    gradingLockedRef.current = false;
  }, [selectedOpening]);

  useEffect(() => {
    setOpeningNoteDraft(openingNotesByOpeningId[selectedOpening.id] ?? '');
    setNoteDraft(notesByNodeId[currentNode.id] ?? '');
    setNoteSaved(false);
  }, [currentNode.id, selectedOpening.id]);

  const resetAnswer = (unlockGrading = true) => {
    setAnswerState('unanswered');
    setPhase('awaitingMove');
    setMoveInput('');
    setBoardFenOverride(null);
    setPlaybackLabel('');
    if (unlockGrading) {
      gradingLockedRef.current = false;
    }
  };

  const selectOpening = (opening: OpeningRepertoire) => {
    setPendingNodeId(null);
    setSelectedOpeningId(opening.id);
    setMoveHistory([]);
    setMistakeQueue([]);
  };

  const jumpToNode = (node: OpeningVariationNode) => {
    setCurrentNodeId(node.id);
    setReviewingMistakes(false);
    resetAnswer();
  };

  const handleMove = (from: string, to: string) => {
    if (phase !== 'awaitingMove') return;

    gradingLockedRef.current = false;
    const correct = from === currentNode.expectedMoveFrom && to === currentNode.expectedMoveTo;
    setMoveInput(`${from}-${to}`);
    setAnswerState(correct ? 'correct' : 'incorrect');
    setPhase('awaitingGrade');
    setMoveHistory((history) => [
      ...history,
      {
        id: `${currentNode.id}-${history.length}`,
        nodeId: currentNode.id,
        san: correct ? currentNode.expectedMoveSan : `${from}-${to}`,
        actor: 'user',
        result: correct ? 'correct' : 'incorrect',
        fen: currentNode.fen,
      },
    ]);

    if (!correct) {
      setMistakeQueue((queue) => (queue.includes(currentNode.id) ? queue : [...queue, currentNode.id]));
    }
  };

  const gradeCurrentNode = (rating: OpeningRating) => {
    if (phase !== 'awaitingGrade' || gradingLockedRef.current) return;

    gradingLockedRef.current = true;
    const result = answerState === 'correct' ? 'correct' : 'incorrect';
    setProgressByNodeId((progress) =>
      applyOpeningReview(progress, {
        openingId: selectedOpening.id,
        nodeId: currentNode.id,
        result,
        rating,
        reviewedAt: new Date().toISOString(),
      })
    );

    if (result === 'correct') {
      const remainingMistakes = mistakeQueue.filter((id) => id !== currentNode.id);
      setMistakeQueue(remainingMistakes);

      if (reviewingMistakes) {
        const nextMistake = remainingMistakes
          .map((id) => findOpeningNode(selectedOpening.root, id))
          .find((node): node is OpeningVariationNode => Boolean(node));

        if (nextMistake) {
          setCurrentNodeId(nextMistake.id);
          resetAnswer();
          return;
        }

        setReviewingMistakes(false);
        setPhase('lineComplete');
        return;
      }
    }

    if (answerState === 'incorrect') {
      resetAnswer(false);
      return;
    }

    if (currentNode.branches.length > 1) {
      setPhase('branchChoice');
      return;
    }

    if (currentNode.branches.length === 1) {
      playOpponentReply(currentNode.branches[0]);
      return;
    }

    if (currentNode.opponentReplySan || currentNode.opponentReplyFen) {
      playTerminalOpponentReply();
      return;
    }

    setPhase('lineComplete');
  };

  const playOpponentReply = (nextNode: OpeningVariationNode) => {
    const replySan = nextNode.incomingMoveSan ?? 'Opponent reply';
    setPhase('playingOpponent');
    setPlaybackLabel(replySan);
    setBoardFenOverride(nextNode.fen);
    window.setTimeout(() => {
      setMoveHistory((history) => [
        ...history,
        {
          id: `${nextNode.id}-opponent-${history.length}`,
          nodeId: nextNode.id,
          san: replySan,
          actor: 'opponent',
          fen: nextNode.fen,
        },
      ]);
      setCurrentNodeId(nextNode.id);
      setAnswerState('unanswered');
      setPhase('awaitingMove');
      setMoveInput('');
      setBoardFenOverride(null);
      setPlaybackLabel('');
      gradingLockedRef.current = false;
    }, 700);
  };

  const playTerminalOpponentReply = () => {
    if (!currentNode.opponentReplySan && !currentNode.opponentReplyFen) {
      setPhase('lineComplete');
      return;
    }

    const replySan = currentNode.opponentReplySan ?? 'Opponent reply';
    const replyFen = currentNode.opponentReplyFen ?? currentNode.fen;
    setPhase('playingOpponent');
    setPlaybackLabel(replySan);
    setBoardFenOverride(replyFen);
    window.setTimeout(() => {
      setMoveHistory((history) => [
        ...history,
        {
          id: `${currentNode.id}-terminal-reply-${history.length}`,
          nodeId: currentNode.id,
          san: replySan,
          actor: 'opponent',
          fen: replyFen,
        },
      ]);
      setPhase('lineComplete');
      setPlaybackLabel('');
    }, 700);
  };

  const restartLine = () => {
    setCurrentNodeId(selectedOpening.root.id);
    setReviewingMistakes(false);
    resetAnswer();
  };

  const trainNextDue = () => {
    const nextDue = selectedDuePositions.find((position) => position.node.id !== currentNode.id) ?? duePositions[0];
    if (!nextDue) return;
    if (nextDue.openingId !== selectedOpening.id) {
      setPendingNodeId(nextDue.node.id);
      setSelectedOpeningId(nextDue.openingId);
    } else {
      setCurrentNodeId(nextDue.node.id);
    }
    setReviewingMistakes(false);
    resetAnswer();
  };

  const reviewMistakes = () => {
    const firstMistake = mistakeQueue
      .map((id) => findOpeningNode(selectedOpening.root, id))
      .find((node): node is OpeningVariationNode => Boolean(node));
    if (!firstMistake) return;
    setReviewingMistakes(true);
    setCurrentNodeId(firstMistake.id);
    resetAnswer();
  };

  const jumpToOpeningPosition = (openingId: string, nodeId: string) => {
    const opening = allOpenings.find((item) => item.id === openingId);
    if (!opening || !findOpeningNode(opening.root, nodeId)) return;

    if (opening.id !== selectedOpening.id) {
      setPendingNodeId(nodeId);
      setSelectedOpeningId(opening.id);
    } else {
      setCurrentNodeId(nodeId);
    }

    setReviewingMistakes(false);
    resetAnswer();
  };

  const trainDuePosition = (position = duePositions[0]) => {
    if (!position) return;
    jumpToOpeningPosition(position.openingId, position.node.id);
  };

  const trainSelectedDuePosition = () => trainDuePosition(selectedDuePositions[0]);

  const trainWeakLine = () => {
    const nextWeakness = weaknessSummaries[0];
    if (!nextWeakness) return;
    jumpToOpeningPosition(nextWeakness.openingId, nextWeakness.nodeId);
  };

  const updateRepertoireSettings = (patch: Partial<RepertoireSettings>) => {
    setRepertoireSettingsByOpeningId((settings) => ({
      ...settings,
      [selectedOpening.id]: {
        ...getDefaultRepertoireSettings(selectedOpening),
        ...settings[selectedOpening.id],
        ...patch,
      },
    }));
  };

  const saveNote = () => {
    setOpeningNotesByOpeningId((notes) => ({ ...notes, [selectedOpening.id]: openingNoteDraft }));
    setNotesByNodeId((notes) => ({ ...notes, [currentNode.id]: noteDraft }));
    setNoteSaved(true);
  };

  const addImportedLine = (line: ImportedOpeningLine) => {
    const importedOpening = createOpeningRepertoireFromImportedLine(line, openingRepertoires[0]);
    setImportedLines((lines) => [line, ...lines]);
    setProgressByNodeId((progress) => ({
      ...progress,
      ...createOpeningProgress(importedOpening),
    }));
    setMoveHistory([]);
    setMistakeQueue([]);
    setPendingNodeId(importedOpening.root.id);
    setSelectedOpeningId(importedOpening.id);
  };

  const sideLabel = currentNode.sideToMove === 'w' ? 'White' : 'Black';
  const answeredCount = moveHistory.filter((entry) => entry.actor === 'user').length;
  const missedCount = moveHistory.filter((entry) => entry.result === 'incorrect').length;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-[#f8f9fb]">
      <aside className="w-[280px] flex-shrink-0 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
        <div className="min-h-0 flex-1">
          <OpeningLibraryPanel
            openings={allOpenings}
            selectedOpeningId={selectedOpening.id}
            metaByOpeningId={libraryMetaByOpeningId}
            onSelectOpening={selectOpening}
            className="h-full"
          />
        </div>
        <div className="max-h-[45%] overflow-y-auto border-t border-gray-200 p-3">
          <OpeningImportPanel importedLines={importedLines} onImport={addImportedLine} />
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4 sticky top-0 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-0.5">
                {selectedOpening.family}
              </span>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                {reviewingMistakes ? 'Mistake review' : selectedOpening.side}
              </span>
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 leading-tight truncate">{selectedOpening.name}</h2>
          </div>
          <div className="flex-1" />
          <SessionMetric label="Answered" value={String(answeredCount)} />
          <SessionMetric label="Accuracy" value={`${sessionAccuracy}%`} tone="green" />
          <SessionMetric label="Missed" value={String(missedCount)} tone="red" />
          <button
            onClick={restartLine}
            className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            Restart
          </button>
        </div>

        <div className="p-4 2xl:p-6">
          <div className="flex flex-col 2xl:flex-row gap-5 2xl:gap-6 items-start">
            <div className="flex-shrink-0">
              <ChessBoard
                board={board}
                highlightSquares={phase === 'awaitingMove' ? [currentNode.expectedMoveFrom, currentNode.expectedMoveTo] : []}
                correctFrom={answerState !== 'unanswered' ? currentNode.expectedMoveFrom : ''}
                correctTo={answerState !== 'unanswered' ? currentNode.expectedMoveTo : ''}
                onMove={handleMove}
                answered={phase !== 'awaitingMove'}
              />
              <div className="mt-3 bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Target size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-800">
                    {phase === 'playingOpponent' ? 'Opponent reply' : `${sideLabel} to move`}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {phase === 'playingOpponent' ? playbackLabel : currentNode.prompt}
                  </div>
                </div>
                {moveInput ? (
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                    <span className="text-[13px] font-mono font-semibold text-gray-700">{moveInput}</span>
                    {answerState === 'correct' && <CheckCircle2 size={14} className="text-green-500" />}
                    {answerState === 'incorrect' && <XCircle size={14} className="text-red-500" />}
                  </div>
                ) : (
                  <span className="text-[12px] text-gray-300 font-medium">Move input</span>
                )}
              </div>
            </div>

            <section className="w-full 2xl:flex-1 min-w-[300px] max-w-[560px]">
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from(new Set(selectedOpening.tags.concat(currentNode.tags))).map((tag) => (
                  <span key={tag} className="text-[12px] bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>

              <h3 className="text-[22px] font-bold text-gray-900 leading-tight mb-2">
                Find {currentNode.expectedMoveSan.split('.').pop()} from this position
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">{selectedOpening.description}</p>

              <div className="grid grid-cols-4 gap-2 mb-4">
                <NodeMetric label="Node mastery" value={`${currentProgress?.mastery ?? 0}%`} />
                <NodeMetric label="Streak" value={String(currentProgress?.streak ?? 0)} />
                <NodeMetric label="Next due" value={formatDue(currentProgress?.nextDueAt)} />
                <NodeMetric label="Cards" value={String(selectedGeneratedCardCount)} />
              </div>

              <MoveHistoryPanel currentLine={currentLine} activeNodeId={currentNode.id} onSelect={jumpToNode} />

              {phase === 'awaitingMove' && (
                <InfoPanel tone="amber" title="Training prompt" icon={AlertCircle}>
                  {currentNode.idea}
                </InfoPanel>
              )}

              {phase === 'playingOpponent' && (
                <InfoPanel tone="blue" title={`Playing ${playbackLabel}`} icon={Play}>
                  The trainer is advancing the line to the next memorized position.
                </InfoPanel>
              )}

              {phase === 'awaitingGrade' && answerState === 'correct' && (
                <ResultPanel tone="green" title={`Correct: ${currentNode.expectedMoveSan}`} body={currentNode.explanation}>
                  <GradingControls onGrade={gradeCurrentNode} />
                </ResultPanel>
              )}

              {phase === 'awaitingGrade' && answerState === 'incorrect' && (
                <ResultPanel tone="red" title={`Expected ${currentNode.expectedMoveSan}`} body={currentNode.explanation}>
                  <GradingControls onGrade={gradeCurrentNode} />
                  <button
                    onClick={() => resetAnswer()}
                    className="mt-2 w-full bg-white border border-red-300 rounded-lg py-2 text-[12px] font-semibold text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} />
                    Try this position again
                  </button>
                </ResultPanel>
              )}

              {phase === 'branchChoice' && (
                <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch size={16} className="text-blue-600" />
                    <span className="text-[13px] font-bold text-blue-900">Choose the opponent branch</span>
                  </div>
                  <p className="text-[12px] text-blue-700 mb-3">Pick the reply you want to drill next.</p>
                  <div className="space-y-2">
                    {currentNode.branches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => playOpponentReply(branch)}
                        className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left hover:bg-blue-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[12px] font-bold text-blue-900">{branch.incomingMoveSan ?? 'Opponent line'}</span>
                          <span className="text-[11px] font-semibold text-blue-700">{progressByNodeId[branch.id]?.mastery ?? 0}%</span>
                        </div>
                        <div className="text-[11px] text-blue-700 mt-0.5">{branch.prompt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'lineComplete' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={17} className="text-green-600" />
                    <span className="text-[14px] font-bold text-green-900">Line complete</span>
                  </div>
                  <p className="text-[12px] text-green-700 leading-relaxed mb-3">
                    You reached the end of this branch. Replay it, move to another due position, or clean up missed moves.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={restartLine} className="rounded-lg border border-green-300 bg-white py-2 text-[12px] font-semibold text-green-700 hover:bg-green-50">
                      Replay
                    </button>
                    <button onClick={trainNextDue} className="rounded-lg border border-green-300 bg-white py-2 text-[12px] font-semibold text-green-700 hover:bg-green-50">
                      Next due
                    </button>
                    <button
                      onClick={reviewMistakes}
                      disabled={mistakeQueue.length === 0}
                      className="rounded-lg border border-green-300 bg-white py-2 text-[12px] font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      Mistakes
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <aside className="w-[280px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="text-[13px] font-bold text-gray-800">Line Details</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{selectedNodes.length} trainable positions</div>
        </div>
        <div className="p-4 space-y-5">
          <OpeningSummaryStrip nodes={selectedNodes} progressByNode={progressByNodeId} />

          <OpeningReviewQueuePanel
            duePositions={duePositions}
            selectedDuePositions={selectedDuePositions}
            selectedOpeningName={selectedOpening.name}
            activeNodeId={currentNode.id}
            weakPositions={weakDuePositions}
            weakLineMode={reviewingMistakes}
            onReviewAll={() => trainDuePosition()}
            onReviewSelected={trainSelectedDuePosition}
            onTrainWeakLines={trainWeakLine}
            onSelectPosition={trainDuePosition}
          />

          <OpeningRepertoireBuilder
            opening={selectedOpening}
            inRepertoire={selectedRepertoireSettings.inRepertoire}
            useCase={selectedRepertoireSettings.useCase}
            priority={selectedRepertoireSettings.priority}
            enabled={selectedRepertoireSettings.enabled}
            onInRepertoireChange={(inRepertoire) => updateRepertoireSettings({ inRepertoire, enabled: inRepertoire })}
            onUseCaseChange={(useCase) => updateRepertoireSettings({ useCase })}
            onPriorityChange={(priority) => updateRepertoireSettings({ priority })}
            onEnabledChange={(enabled) => updateRepertoireSettings({ enabled })}
          />

          <OpeningWeaknessPanel
            opening={selectedOpening}
            progressByNode={progressByNodeId}
            maxItems={4}
            onTrain={(weakness) => jumpToOpeningPosition(weakness.openingId ?? selectedOpening.id, weakness.nodeId)}
            onJump={(weakness) => jumpToOpeningPosition(weakness.openingId ?? selectedOpening.id, weakness.nodeId)}
          />

          <section>
            <PanelTitle icon={ListChecks} title="Move History" />
            <div className="space-y-1.5">
              {moveHistory.length === 0 && <div className="text-[12px] text-gray-400">No moves in this session yet.</div>}
              {moveHistory.map((entry, index) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    const node = findOpeningNode(selectedOpening.root, entry.nodeId);
                    if (node) jumpToNode(node);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 w-5">{index + 1}.</span>
                    <span className={`text-[12px] font-bold ${entry.actor === 'user' ? 'text-gray-800' : 'text-blue-700'}`}>{entry.san}</span>
                    {entry.result === 'correct' && <CheckCircle2 size={13} className="text-green-500" />}
                    {entry.result === 'incorrect' && <XCircle size={13} className="text-red-500" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <PanelTitle icon={GitBranch} title="Variation Map" />
            <OpeningVariationTree
              root={selectedOpening.root}
              activeNodeId={currentNode.id}
              activePathNodeIds={currentLine.map((node) => node.id)}
              progressByNode={progressByNodeId}
              dueNodeIds={dueNodeIds}
              weakNodeIds={weakNodeIds}
              onSelect={jumpToNode}
            />
          </section>

          <section>
            <PanelTitle icon={AlertCircle} title="Mistake Queue" />
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-[12px] font-bold text-gray-800">{mistakeQueue.length} positions</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {mistakeQueue.length ? 'Review missed positions before ending the session.' : 'Missed positions will collect here.'}
              </div>
              <button
                onClick={reviewMistakes}
                disabled={mistakeQueue.length === 0}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                Review mistakes
              </button>
            </div>
          </section>

          <section>
            <PanelTitle icon={NotebookPen} title="Repertoire Notes" />
            <label className="block mb-3">
              <span className="text-[11px] font-semibold text-gray-500">Opening note</span>
              <textarea
                value={openingNoteDraft}
                onChange={(event) => {
                  setOpeningNoteDraft(event.target.value);
                  setNoteSaved(false);
                }}
                className="mt-1 w-full h-20 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-[12px] text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
                placeholder="Plans, traps, transpositions, or repertoire reminders..."
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-gray-500">Current position note</span>
              <textarea
                value={noteDraft}
                onChange={(event) => {
                  setNoteDraft(event.target.value);
                  setNoteSaved(false);
                }}
                className="mt-1 w-full h-24 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-[12px] text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
                placeholder="Memory cue for this move..."
              />
            </label>
            <button
              onClick={saveNote}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-[12px] font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={13} />
              {noteSaved ? 'Saved' : 'Save note'}
            </button>
          </section>

          <OpeningProgressDashboard
            openings={allOpenings}
            progressByNode={progressByNodeId}
            generatedCardsByOpeningId={generatedCardsByOpeningId}
            activeOpeningId={selectedOpening.id}
            onSelectOpening={selectOpening}
            onTrainOpening={(opening) => jumpToOpeningPosition(opening.id, opening.root.id)}
          />
        </div>
      </aside>
    </div>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-2">
      <Icon size={14} className="text-gray-400" />
      <span className="text-[12px] font-bold text-gray-800">{title}</span>
    </div>
  );
}

function SessionMetric({ label, value, tone = 'gray' }: { label: string; value: string; tone?: 'gray' | 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-gray-800';
  return (
    <div className="text-right min-w-[54px]">
      <div className={`text-[14px] font-bold leading-tight ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-400 leading-tight">{label}</div>
    </div>
  );
}

function NodeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <div className="text-[13px] font-bold text-gray-800">{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function InfoPanel({
  tone,
  title,
  icon: Icon,
  children,
}: {
  tone: 'amber' | 'blue';
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  const blue = tone === 'blue';
  return (
    <div className={`${blue ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={blue ? 'text-blue-600' : 'text-amber-600'} />
        <span className={`text-[13px] font-bold ${blue ? 'text-blue-900' : 'text-amber-900'}`}>{title}</span>
      </div>
      <p className={`text-[12px] leading-relaxed ${blue ? 'text-blue-700' : 'text-amber-800'}`}>{children}</p>
    </div>
  );
}

function ResultPanel({
  tone,
  title,
  body,
  children,
}: {
  tone: 'green' | 'red';
  title: string;
  body: string;
  children: ReactNode;
}) {
  const isGreen = tone === 'green';
  const Icon = isGreen ? CheckCircle2 : XCircle;

  return (
    <div className={`${isGreen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={isGreen ? 'text-green-600' : 'text-red-600'} />
        <span className={`text-[14px] font-bold ${isGreen ? 'text-green-800' : 'text-red-800'}`}>{title}</span>
      </div>
      <p className={`text-[12px] leading-relaxed mb-3 ${isGreen ? 'text-green-700' : 'text-red-700'}`}>{body}</p>
      {children}
    </div>
  );
}

function GradingControls({ onGrade }: { onGrade: (rating: OpeningRating) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ratingOptions.map((option) => (
        <button
          key={option.rating}
          onClick={() => onGrade(option.rating)}
          className="rounded-lg border border-gray-200 bg-white py-2 text-center hover:bg-gray-50"
        >
          <div className="text-[12px] font-bold text-gray-800">{option.label}</div>
          <div className="text-[10px] text-gray-400">{option.description}</div>
        </button>
      ))}
    </div>
  );
}

function getDefaultRepertoireSettings(opening: OpeningRepertoire): RepertoireSettings {
  return {
    inRepertoire: true,
    useCase: opening.side === 'White' ? 'as-white' : 'as-black',
    priority: opening.tags.some((tag) => tag.toLowerCase().includes('gambit')) ? 'high' : 'normal',
    enabled: true,
  };
}

function isOpeningRepertoireEnabled(opening: OpeningRepertoire, settings?: RepertoireSettings): boolean {
  const resolved = settings ?? getDefaultRepertoireSettings(opening);
  return resolved.inRepertoire && resolved.enabled;
}

function formatDue(value?: string): string {
  if (!value) return 'Now';
  const due = new Date(value).getTime();
  const now = Date.now();
  if (due <= now) return 'Now';
  const days = Math.ceil((due - now) / (24 * 60 * 60 * 1000));
  return `${days}d`;
}
