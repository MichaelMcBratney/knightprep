import type {
  GeneratedOpeningReviewCard,
  ImportedOpeningLine,
  OpeningCategory,
  OpeningDuePosition,
  OpeningLibraryFilters,
  OpeningNote,
  OpeningNoteStore,
  OpeningNodeProgress,
  OpeningProgressDashboardStats,
  OpeningProgressMap,
  OpeningRating,
  OpeningRepertoireChoice,
  OpeningRepertoireStats,
  OpeningResult,
  OpeningReviewInput,
  OpeningSide,
  OpeningSummaryBucket,
  OpeningVariationNode,
  OpeningWeakBranchSummary,
  OpeningRepertoire,
} from '../types';

const DEFAULT_EASE_FACTOR = 2.3;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 3;
const WEAK_MASTERY_THRESHOLD = 55;
const MASTERED_MASTERY_THRESHOLD = 80;

export function findOpeningNode(root: OpeningVariationNode, id: string): OpeningVariationNode | null {
  if (root.id === id) return root;

  for (const branch of root.branches) {
    const match = findOpeningNode(branch, id);
    if (match) return match;
  }

  return null;
}

export function findOpeningPath(root: OpeningVariationNode, id: string): OpeningVariationNode[] {
  if (root.id === id) return [root];

  for (const branch of root.branches) {
    const path = findOpeningPath(branch, id);
    if (path.length) return [root, ...path];
  }

  return [];
}

export function flattenOpeningNodes(root: OpeningVariationNode): OpeningVariationNode[] {
  return [root, ...root.branches.flatMap((branch) => flattenOpeningNodes(branch))];
}

export function countOpeningPositions(root: OpeningVariationNode): number {
  return flattenOpeningNodes(root).length;
}

export function clampMastery(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

export function createNodeProgress(due = false, mastery = 0, nodeId = '') {
  return {
    nodeId,
    attempts: 0,
    correct: 0,
    missed: 0,
    streak: 0,
    due,
    mastery: clampMastery(mastery),
    intervalDays: 0,
    ease: DEFAULT_EASE_FACTOR,
    lapses: 0,
  };
}

export function createOpeningProgress(opening: OpeningRepertoire): OpeningProgressMap {
  return flattenOpeningNodes(opening.root).reduce<OpeningProgressMap>((progressByNode, node, index) => {
    progressByNode[node.id] = createNodeProgress(index < opening.duePositions, 0, node.id);
    return progressByNode;
  }, {});
}

export function createInitialOpeningProgress(openings: OpeningRepertoire[] = []) {
  return openings.reduce<OpeningProgressMap>((progressByNode, opening) => {
    return {
      ...progressByNode,
      ...createOpeningProgress(opening),
    };
  }, {});
}

export function readOpeningNotes(storageKey = 'knightprep.openingNotes') {
  if (typeof window === 'undefined') return {};

  try {
    const rawNotes = window.localStorage.getItem(storageKey);
    return rawNotes ? JSON.parse(rawNotes) : {};
  } catch {
    return {};
  }
}

export function getLineCompletionOptions(currentNode: OpeningVariationNode, root: OpeningVariationNode) {
  const path = findOpeningPath(root, currentNode.id);
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const siblingBranches = parent?.branches.filter((branch) => branch.id !== currentNode.id) ?? [];

  return {
    isComplete: currentNode.branches.length === 0,
    canReplay: path.length > 0,
    siblingBranches,
    nextBranches: currentNode.branches,
  };
}

export function getOpeningCategories(opening: OpeningRepertoire, node?: OpeningVariationNode): OpeningCategory[] {
  const source = [...opening.tags, ...(node?.tags ?? []), opening.family, opening.name];
  const categories = new Set<OpeningCategory>();

  for (const value of source) {
    const normalized = normalizeTag(value);
    if (normalized.includes('gambit')) categories.add('Gambit');
    if (normalized.includes('tactic')) categories.add('Tactic');
    if (normalized.includes('endgame')) categories.add('Endgame');
    if (normalized.includes('import')) categories.add('Imported');
    if (normalized.includes('repertoire')) categories.add('Repertoire');
    if (normalized.includes('opening') || /^[a-e]\d{2}$/i.test(value)) categories.add('Opening');
  }

  categories.add('Opening');
  return sortOpeningCategories(Array.from(categories));
}

export function createGeneratedOpeningReviewCard(
  opening: OpeningRepertoire,
  node: OpeningVariationNode,
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString()
): GeneratedOpeningReviewCard {
  const progress = progressMap[node.id];
  const dueAt = progress?.nextDueAt ?? nowIso;
  const path = findOpeningPath(opening.root, node.id).map((pathNode) => ({
    nodeId: pathNode.id,
    san: pathNode.expectedMoveSan,
    moveNumber: pathNode.moveNumber,
    sideToMove: pathNode.sideToMove,
  }));

  return {
    id: `opening-card-${opening.id}-${node.id}`,
    openingId: opening.id,
    openingName: opening.name,
    eco: opening.eco,
    family: opening.family,
    side: opening.side,
    nodeId: node.id,
    prompt: node.prompt,
    boardFen: node.fen,
    correctMove: node.expectedMoveSan,
    correctMoveFrom: node.expectedMoveFrom,
    correctMoveTo: node.expectedMoveTo,
    explanation: node.explanation,
    idea: node.idea,
    tags: getOpeningNodeTags(opening, node),
    categories: getOpeningCategories(opening, node),
    path,
    dueAt,
    priority: calculateOpeningPriority(progress, dueAt, nowIso),
    progress,
  };
}

export function deriveOpeningReviewCards(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString(),
  options: { dueOnly?: boolean; filters?: OpeningLibraryFilters; limit?: number } = {}
): GeneratedOpeningReviewCard[] {
  const cards = openings
    .flatMap((opening) =>
      flattenOpeningNodes(opening.root).map((node) => createGeneratedOpeningReviewCard(opening, node, progressMap, nowIso))
    )
    .filter((card) => !options.dueOnly || isOpeningProgressDue(card.progress, nowIso))
    .filter((card) => matchesOpeningFilters(card, options.filters));

  return sortOpeningReviewCards(cards).slice(0, options.limit ?? cards.length);
}

export function getOpeningReviewQueue(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString(),
  limit = 25,
  filters?: OpeningLibraryFilters
): GeneratedOpeningReviewCard[] {
  return deriveOpeningReviewCards(openings, progressMap, nowIso, { dueOnly: true, filters, limit });
}

export function getOpeningWeaknessSummaries(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString(),
  limit = 10
): OpeningWeakBranchSummary[] {
  const weaknesses = openings.flatMap((opening) =>
    flattenOpeningNodes(opening.root)
      .map((node) => createWeakBranchSummary(opening, node, progressMap[node.id], nowIso))
      .filter((summary) => summary.weaknessScore > 0)
  );

  return weaknesses
    .sort(
      (a, b) =>
        b.weaknessScore - a.weaknessScore ||
        a.openingName.localeCompare(b.openingName) ||
        a.moveSan.localeCompare(b.moveSan) ||
        a.nodeId.localeCompare(b.nodeId)
    )
    .slice(0, limit);
}

export function getOpeningRepertoireStats(
  opening: OpeningRepertoire,
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString()
): OpeningRepertoireStats {
  const nodes = flattenOpeningNodes(opening.root);
  const progresses = nodes.map((node) => progressMap[node.id]);
  const trainedPositions = progresses.filter((progress) => getAttemptCount(progress) > 0).length;
  const duePositions = nodes.filter((node) => isOpeningProgressDue(progressMap[node.id], nowIso)).length;
  const weakPositions = nodes.filter((node) => createWeakBranchSummary(opening, node, progressMap[node.id], nowIso).weaknessScore > 0).length;
  const masteredPositions = progresses.filter((progress) => (progress?.mastery ?? 0) >= MASTERED_MASTERY_THRESHOLD).length;
  const reviewCount = progresses.reduce((sum, progress) => sum + getAttemptCount(progress), 0);
  const lapseCount = progresses.reduce((sum, progress) => sum + (progress?.lapses ?? 0), 0);
  const averageMastery = average(nodes.map((node) => progressMap[node.id]?.mastery ?? 0));
  const averageAccuracy = average(nodes.map((node) => getProgressAccuracy(progressMap[node.id])));
  const recommendedCard = getOpeningReviewQueue([opening], progressMap, nowIso, 1)[0];
  const firstNewNode = nodes.find((node) => getAttemptCount(progressMap[node.id]) === 0);

  return {
    openingId: opening.id,
    name: opening.name,
    eco: opening.eco,
    family: opening.family,
    side: opening.side,
    tags: dedupeSorted(opening.tags),
    categories: getOpeningCategories(opening),
    totalPositions: nodes.length,
    trainedPositions,
    newPositions: nodes.length - trainedPositions,
    duePositions,
    weakPositions,
    masteredPositions,
    averageMastery,
    averageAccuracy,
    reviewCount,
    lapseCount,
    coverage: nodes.length === 0 ? 0 : Math.round((trainedPositions / nodes.length) * 100),
    recommendedNodeId: recommendedCard?.nodeId ?? firstNewNode?.id,
  };
}

export function getOpeningRepertoireChoices(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString(),
  filters?: OpeningLibraryFilters
): OpeningRepertoireChoice[] {
  return openings
    .map((opening) => {
      const stats = getOpeningRepertoireStats(opening, progressMap, nowIso);
      return {
        openingId: opening.id,
        name: opening.name,
        eco: opening.eco,
        family: opening.family,
        side: opening.side,
        description: opening.description,
        tags: dedupeSorted(opening.tags),
        categories: stats.categories,
        stats,
        recommendation: getRepertoireRecommendation(stats),
        recommendedNodeId: stats.recommendedNodeId,
      };
    })
    .filter((choice) => matchesChoiceFilters(choice, filters))
    .sort(
      (a, b) =>
        b.stats.duePositions - a.stats.duePositions ||
        b.stats.weakPositions - a.stats.weakPositions ||
        a.stats.averageMastery - b.stats.averageMastery ||
        a.name.localeCompare(b.name)
    );
}

export function filterOpeningLibrary(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  filters: OpeningLibraryFilters = {},
  nowIso = new Date().toISOString()
): OpeningRepertoireChoice[] {
  return getOpeningRepertoireChoices(openings, progressMap, nowIso, filters);
}

export function getOpeningCategorySummaries(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString()
): OpeningSummaryBucket[] {
  const categories = sortOpeningCategories(
    Array.from(new Set(openings.flatMap((opening) => getOpeningCategories(opening))))
  );

  return categories.map((category) =>
    createOpeningSummaryBucket(
      category,
      category,
      openings.filter((opening) => getOpeningCategories(opening).includes(category)),
      progressMap,
      nowIso,
      category
    )
  );
}

export function getOpeningTagSummaries(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString()
): OpeningSummaryBucket[] {
  const tags = dedupeSorted(openings.flatMap((opening) => opening.tags));

  return tags
    .map((tag) =>
      createOpeningSummaryBucket(
        slugify(tag),
        tag,
        openings.filter((opening) => opening.tags.some((openingTag) => normalizeTag(openingTag) === normalizeTag(tag))),
        progressMap,
        nowIso
      )
    )
    .sort((a, b) => b.positionCount - a.positionCount || a.label.localeCompare(b.label));
}

export function getOpeningSideSummaries(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString()
): OpeningSummaryBucket[] {
  return (['White', 'Black'] as OpeningSide[])
    .map((side) =>
      createOpeningSummaryBucket(
        side.toLowerCase(),
        side,
        openings.filter((opening) => opening.side === side),
        progressMap,
        nowIso
      )
    )
    .filter((summary) => summary.openingCount > 0);
}

export function getOpeningProgressDashboardStats(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString()
): OpeningProgressDashboardStats {
  const repertoireStats = openings.map((opening) => getOpeningRepertoireStats(opening, progressMap, nowIso));
  const totalPositions = repertoireStats.reduce((sum, stats) => sum + stats.totalPositions, 0);

  return {
    totalOpenings: openings.length,
    totalPositions,
    trainedPositions: repertoireStats.reduce((sum, stats) => sum + stats.trainedPositions, 0),
    newPositions: repertoireStats.reduce((sum, stats) => sum + stats.newPositions, 0),
    duePositions: repertoireStats.reduce((sum, stats) => sum + stats.duePositions, 0),
    weakPositions: repertoireStats.reduce((sum, stats) => sum + stats.weakPositions, 0),
    masteredPositions: repertoireStats.reduce((sum, stats) => sum + stats.masteredPositions, 0),
    averageMastery: totalPositions === 0 ? 0 : averageWeighted(repertoireStats.map((stats) => [stats.averageMastery, stats.totalPositions])),
    averageAccuracy: totalPositions === 0 ? 0 : averageWeighted(repertoireStats.map((stats) => [stats.averageAccuracy, stats.totalPositions])),
    reviewCount: repertoireStats.reduce((sum, stats) => sum + stats.reviewCount, 0),
    lapseCount: repertoireStats.reduce((sum, stats) => sum + stats.lapseCount, 0),
    sideSummaries: getOpeningSideSummaries(openings, progressMap, nowIso),
    categorySummaries: getOpeningCategorySummaries(openings, progressMap, nowIso),
    tagSummaries: getOpeningTagSummaries(openings, progressMap, nowIso),
    weakestBranches: getOpeningWeaknessSummaries(openings, progressMap, nowIso, 5),
    dueQueue: getOpeningReviewQueue(openings, progressMap, nowIso, 8),
  };
}

export function getDueOpeningPositions(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString(),
  limit = 25
): OpeningDuePosition[] {
  const now = new Date(nowIso).getTime();
  const duePositions = openings.flatMap((opening) =>
    flattenOpeningNodes(opening.root).map((node) => {
      const progress = progressMap[node.id];
      const dueAt = progress?.nextDueAt ?? nowIso;
      const dueTime = new Date(dueAt).getTime();
      const overdueDays = Math.max(0, Math.floor((now - dueTime) / 86_400_000));
      const mastery = progress?.mastery ?? 0;
      const lapseCount = progress?.lapses ?? 0;

      return {
        openingId: opening.id,
        openingName: opening.name,
        node,
        progress,
        dueAt,
        priority: overdueDays * 10 + (100 - mastery) / 10 + lapseCount * 2,
      };
    })
  );

  return duePositions
    .filter((position) => isOpeningProgressDue(position.progress, nowIso))
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime() ||
        a.openingName.localeCompare(b.openingName) ||
        a.node.expectedMoveSan.localeCompare(b.node.expectedMoveSan) ||
        a.node.id.localeCompare(b.node.id)
    )
    .slice(0, limit);
}

export function getOpeningDuePositions(
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso = new Date().toISOString(),
  limit = 25
): OpeningDuePosition[] {
  return getDueOpeningPositions(openings, progressMap, nowIso, limit);
}

export function applyOpeningReview(
  progress: OpeningNodeProgress | undefined,
  nodeId: string,
  result: OpeningResult,
  rating: OpeningRating,
  reviewedAt?: string
): OpeningNodeProgress;
export function applyOpeningReview(progressMap: OpeningProgressMap, review: OpeningReviewInput): OpeningProgressMap;
export function applyOpeningReview(
  progressOrMap: OpeningNodeProgress | OpeningProgressMap | undefined,
  nodeIdOrReview: string | OpeningReviewInput,
  result?: OpeningResult,
  rating?: OpeningRating,
  reviewedAt = new Date().toISOString()
): OpeningNodeProgress | OpeningProgressMap {
  if (typeof nodeIdOrReview === 'string') {
    return applyOpeningNodeReview(progressOrMap as OpeningNodeProgress | undefined, {
      nodeId: nodeIdOrReview,
      result: result ?? 'incorrect',
      rating: rating ?? 'again',
      reviewedAt,
    });
  }

  const progressMap = progressOrMap as OpeningProgressMap;
  return {
    ...progressMap,
    [nodeIdOrReview.nodeId]: applyOpeningNodeReview(progressMap[nodeIdOrReview.nodeId], nodeIdOrReview),
  };
}

function applyOpeningNodeReview(progress: OpeningNodeProgress | undefined, review: Omit<OpeningReviewInput, 'openingId'>): OpeningNodeProgress {
  const previous = progress;
  const intervalDays = getNextIntervalDays(previous?.intervalDays ?? 0, previous?.attempts ?? 0, review.result, review.rating);
  const ease = getNextEaseFactor(previous?.ease ?? DEFAULT_EASE_FACTOR, review.result, review.rating);
  const lapses = (previous?.lapses ?? 0) + (review.result === 'incorrect' ? 1 : 0);
  const attempts = (previous?.attempts ?? 0) + 1;
  const correct = (previous?.correct ?? 0) + (review.result === 'correct' ? 1 : 0);
  const missed = (previous?.missed ?? 0) + (review.result === 'incorrect' ? 1 : 0);
  const streak = review.result === 'correct' ? (previous?.streak ?? 0) + 1 : 0;

  return {
    nodeId: review.nodeId,
    lastTrainedAt: review.reviewedAt,
    nextDueAt: addDays(review.reviewedAt, intervalDays),
    intervalDays,
    ease,
    lapses,
    attempts,
    correct,
    missed,
    streak,
    due: intervalDays === 0,
    lastResult: review.result,
    lastRating: review.rating,
    mastery: calculateOpeningMastery(correct, missed, intervalDays, lapses),
  };
}

export function parsePgnMoves(rawPgn: string): string[] {
  return stripPgnNoise(rawPgn)
    .split(/\s+/)
    .map((token) => normalizeSanToken(token))
    .filter((token) => token.length > 0 && !isPgnResult(token));
}

export function parsePgnHeaders(rawPgn: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerPattern = /^\[([A-Za-z0-9_]+)\s+"([^"]*)"\]$/gm;
  let match = headerPattern.exec(rawPgn);

  while (match) {
    headers[match[1]] = match[2];
    match = headerPattern.exec(rawPgn);
  }

  return headers;
}

export function createImportedOpeningLine(name: string, rawPgn: string, importedAt: string, tags: string[] = []): ImportedOpeningLine {
  const moves = parsePgnMoves(rawPgn);

  return {
    id: `import-${slugify(name)}-${new Date(importedAt).getTime()}`,
    name,
    rawPgn,
    moves,
    tags: ['Opening', 'Imported', ...tags],
    errors: moves.length === 0 ? ['No SAN moves found in PGN input.'] : [],
    importedAt,
  };
}

export function parsePgnImport(rawPgn: string): ImportedOpeningLine {
  const headers = parsePgnHeaders(rawPgn);
  const name = headers.Opening || headers.Event || 'Imported PGN';
  const tags = [
    ...(headers.ECO ? [headers.ECO] : []),
    ...(headers.White?.toLowerCase().includes('repertoire') ? ['White repertoire'] : []),
    ...(headers.Black?.toLowerCase().includes('repertoire') ? ['Black repertoire'] : []),
  ];

  return createImportedOpeningLine(name, rawPgn, new Date().toISOString(), tags);
}

export function createOpeningRepertoireFromImportedLine(
  line: ImportedOpeningLine,
  templateOpening: OpeningRepertoire
): OpeningRepertoire {
  const templateNodes = flattenOpeningNodes(templateOpening.root);
  const importedSide = line.tags.some((tag) => tag.toLowerCase().includes('black repertoire')) ? 'Black' : 'White';
  const startIndex = importedSide === 'Black' && line.moves.length > 1 ? 1 : 0;
  const trainableMoves = line.moves
    .map((move, moveIndex) => ({ move, moveIndex }))
    .filter(({ moveIndex }) => moveIndex >= startIndex && (moveIndex - startIndex) % 2 === 0);
  const nodes = trainableMoves.length > 0 ? trainableMoves : line.moves.map((move, moveIndex) => ({ move, moveIndex }));
  const root = buildImportedVariationNode(line, nodes, templateNodes, 0, importedSide);

  return {
    id: `opening-${line.id}`,
    name: line.name,
    eco: line.tags.find((tag) => /^[A-E]\d{2}$/i.test(tag)) ?? 'PGN',
    side: importedSide,
    family: 'Imported',
    description: 'Imported PGN converted into a v1 preview line. Board positions use placeholder data until full PGN/FEN generation is added.',
    tags: Array.from(new Set(['Opening', 'Imported', 'Preview', ...line.tags])),
    totalPositions: nodes.length,
    duePositions: 0,
    accuracy: 0,
    mastery: 0,
    root,
  };
}

export function getOpeningNotes(store: OpeningNoteStore, openingId: string, nodeId?: string): OpeningNote[] {
  return Object.values(store)
    .filter((note) => note.openingId === openingId && (nodeId === undefined || note.nodeId === nodeId))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function upsertOpeningNote(
  store: OpeningNoteStore,
  input: { openingId: string; nodeId?: string; body: string; nowIso: string; id?: string }
): OpeningNoteStore {
  const id = input.id ?? `note-${slugify(input.openingId)}-${input.nodeId ?? 'opening'}-${new Date(input.nowIso).getTime()}`;
  const existing = store[id];

  return {
    ...store,
    [id]: {
      id,
      openingId: input.openingId,
      nodeId: input.nodeId,
      body: input.body,
      createdAt: existing?.createdAt ?? input.nowIso,
      updatedAt: input.nowIso,
    },
  };
}

export function deleteOpeningNote(store: OpeningNoteStore, noteId: string): OpeningNoteStore {
  const nextStore = { ...store };
  delete nextStore[noteId];
  return nextStore;
}

function createWeakBranchSummary(
  opening: OpeningRepertoire,
  node: OpeningVariationNode,
  progress: OpeningNodeProgress | undefined,
  nowIso: string
): OpeningWeakBranchSummary {
  const attempts = getAttemptCount(progress);
  const missed = progress?.missed ?? 0;
  const lapses = progress?.lapses ?? 0;
  const mastery = progress?.mastery ?? 0;
  const accuracy = getProgressAccuracy(progress);
  const due = isOpeningProgressDue(progress, nowIso);
  const untrained = attempts === 0;
  const reasons: string[] = [];

  if (untrained) reasons.push('Untrained branch');
  if (missed > 0) reasons.push(`${missed} miss${missed === 1 ? '' : 'es'}`);
  if (lapses > 0) reasons.push(`${lapses} lapse${lapses === 1 ? '' : 's'}`);
  if (mastery < WEAK_MASTERY_THRESHOLD) reasons.push('Low mastery');
  if (accuracy > 0 && accuracy < 70) reasons.push('Accuracy below 70%');
  if (due) reasons.push('Due now');

  const weaknessScore = Math.round(
    clamp(
      (100 - mastery) * 0.45 +
        (attempts === 0 ? 18 : (100 - accuracy) * 0.25) +
        missed * 3 +
        lapses * 8 +
        (due ? 8 : 0) -
        Math.max(0, (progress?.streak ?? 0) - 2) * 3,
      0,
      100
    )
  );

  return {
    openingId: opening.id,
    openingName: opening.name,
    eco: opening.eco,
    family: opening.family,
    side: opening.side,
    nodeId: node.id,
    moveSan: node.expectedMoveSan,
    prompt: node.prompt,
    path: findOpeningPath(opening.root, node.id).map((pathNode) => ({
      nodeId: pathNode.id,
      san: pathNode.expectedMoveSan,
      moveNumber: pathNode.moveNumber,
      sideToMove: pathNode.sideToMove,
    })),
    tags: getOpeningNodeTags(opening, node),
    attempts,
    missed,
    lapses,
    streak: progress?.streak ?? 0,
    accuracy,
    mastery,
    dueAt: progress?.nextDueAt,
    weaknessScore: reasons.length === 0 ? 0 : weaknessScore,
    reasons,
  };
}

function createOpeningSummaryBucket(
  id: string,
  label: string,
  openings: OpeningRepertoire[],
  progressMap: OpeningProgressMap,
  nowIso: string,
  category?: OpeningCategory
): OpeningSummaryBucket {
  const stats = openings.map((opening) => getOpeningRepertoireStats(opening, progressMap, nowIso));
  const positionCount = stats.reduce((sum, stat) => sum + stat.totalPositions, 0);

  return {
    id,
    label,
    category,
    openingCount: openings.length,
    positionCount,
    trainedCount: stats.reduce((sum, stat) => sum + stat.trainedPositions, 0),
    dueCount: stats.reduce((sum, stat) => sum + stat.duePositions, 0),
    weakCount: stats.reduce((sum, stat) => sum + stat.weakPositions, 0),
    averageMastery: positionCount === 0 ? 0 : averageWeighted(stats.map((stat) => [stat.averageMastery, stat.totalPositions])),
    averageAccuracy: positionCount === 0 ? 0 : averageWeighted(stats.map((stat) => [stat.averageAccuracy, stat.totalPositions])),
    tags: dedupeSorted(openings.flatMap((opening) => opening.tags)),
  };
}

function matchesOpeningFilters(card: GeneratedOpeningReviewCard, filters: OpeningLibraryFilters | undefined): boolean {
  if (!filters) return true;

  const query = filters.search?.trim().toLowerCase();
  if (query) {
    const haystack = [
      card.openingName,
      card.eco,
      card.family,
      card.prompt,
      card.correctMove,
      ...card.tags,
      ...card.categories,
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (filters.side && filters.side !== 'All' && card.side !== filters.side) return false;
  if (filters.importedOnly && !card.categories.includes('Imported')) return false;
  if (filters.categories?.length && !filters.categories.some((category) => card.categories.includes(category))) return false;
  if (filters.tags?.length && !filters.tags.every((tag) => card.tags.some((cardTag) => normalizeTag(cardTag) === normalizeTag(tag)))) return false;
  if (filters.minMastery !== undefined && (card.progress?.mastery ?? 0) < filters.minMastery) return false;
  if (filters.maxMastery !== undefined && (card.progress?.mastery ?? 0) > filters.maxMastery) return false;
  if (filters.weakOnly && (card.progress?.mastery ?? 0) >= WEAK_MASTERY_THRESHOLD && (card.progress?.lapses ?? 0) === 0) return false;

  return true;
}

function matchesChoiceFilters(choice: OpeningRepertoireChoice, filters: OpeningLibraryFilters | undefined): boolean {
  if (!filters) return true;

  const query = filters.search?.trim().toLowerCase();
  if (query) {
    const haystack = [
      choice.name,
      choice.eco,
      choice.family,
      choice.description,
      ...choice.tags,
      ...choice.categories,
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (filters.side && filters.side !== 'All' && choice.side !== filters.side) return false;
  if (filters.importedOnly && !choice.categories.includes('Imported')) return false;
  if (filters.dueOnly && choice.stats.duePositions === 0) return false;
  if (filters.weakOnly && choice.stats.weakPositions === 0) return false;
  if (filters.categories?.length && !filters.categories.some((category) => choice.categories.includes(category))) return false;
  if (filters.tags?.length && !filters.tags.every((tag) => choice.tags.some((choiceTag) => normalizeTag(choiceTag) === normalizeTag(tag)))) return false;
  if (filters.minMastery !== undefined && choice.stats.averageMastery < filters.minMastery) return false;
  if (filters.maxMastery !== undefined && choice.stats.averageMastery > filters.maxMastery) return false;

  return true;
}

function sortOpeningReviewCards(cards: GeneratedOpeningReviewCard[]): GeneratedOpeningReviewCard[] {
  return [...cards].sort(
    (a, b) =>
      b.priority - a.priority ||
      new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime() ||
      a.openingName.localeCompare(b.openingName) ||
      a.correctMove.localeCompare(b.correctMove) ||
      a.nodeId.localeCompare(b.nodeId)
  );
}

function calculateOpeningPriority(progress: OpeningNodeProgress | undefined, dueAt: string, nowIso: string): number {
  const nowMs = new Date(nowIso).getTime();
  const dueMs = new Date(dueAt).getTime();
  const overdueDays = Number.isFinite(dueMs) ? Math.max(0, Math.floor((nowMs - dueMs) / 86_400_000)) : 0;
  const mastery = progress?.mastery ?? 0;
  const lapses = progress?.lapses ?? 0;
  const attempts = getAttemptCount(progress);
  const accuracy = getProgressAccuracy(progress);

  return Math.round(
    clamp(overdueDays * 10 + (100 - mastery) / 10 + lapses * 3 + (attempts === 0 ? 2 : (100 - accuracy) / 25), 0, 999)
  );
}

function getOpeningNodeTags(opening: OpeningRepertoire, node: OpeningVariationNode): string[] {
  return dedupeSorted([opening.eco, opening.family, ...opening.tags, ...node.tags]);
}

function getRepertoireRecommendation(stats: OpeningRepertoireStats): OpeningRepertoireChoice['recommendation'] {
  if (stats.duePositions > 0) return 'review-due';
  if (stats.weakPositions > 0) return 'repair-weakness';
  if (stats.newPositions > 0) return 'learn-new';
  return 'maintain';
}

function isOpeningProgressDue(progress: OpeningNodeProgress | undefined, nowIso: string): boolean {
  if (!progress) return true;
  if (!progress.nextDueAt) return progress.due;
  return isDueAt(progress.nextDueAt, nowIso);
}

function isDueAt(dueAt: string, nowIso: string): boolean {
  const dueMs = new Date(dueAt).getTime();
  const nowMs = new Date(nowIso).getTime();
  return Number.isFinite(dueMs) ? dueMs <= nowMs : true;
}

function getAttemptCount(progress: OpeningNodeProgress | undefined): number {
  return progress ? progress.correct + progress.missed : 0;
}

function getProgressAccuracy(progress: OpeningNodeProgress | undefined): number {
  const attempts = getAttemptCount(progress);
  return attempts === 0 ? 0 : Math.round(((progress?.correct ?? 0) / attempts) * 100);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageWeighted(values: Array<[number, number]>): number {
  const weight = values.reduce((sum, [, itemWeight]) => sum + itemWeight, 0);
  if (weight === 0) return 0;
  return Math.round(values.reduce((sum, [value, itemWeight]) => sum + value * itemWeight, 0) / weight);
}

function sortOpeningCategories(categories: OpeningCategory[]): OpeningCategory[] {
  const order: OpeningCategory[] = ['Opening', 'Gambit', 'Tactic', 'Endgame', 'Imported', 'Repertoire', 'Other'];
  return [...categories].sort((a, b) => order.indexOf(a) - order.indexOf(b) || a.localeCompare(b));
}

function dedupeSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
}

function getNextIntervalDays(
  previousIntervalDays: number,
  previousReviewCount: number,
  result: 'correct' | 'incorrect',
  rating: OpeningRating
): number {
  if (result === 'incorrect' || rating === 'again') return 0;
  if (rating === 'hard') return Math.max(1, Math.round(previousIntervalDays * 1.2));
  if (rating === 'easy') return previousReviewCount === 0 ? 4 : Math.max(4, Math.round(previousIntervalDays * 1.8) + 1);
  return previousReviewCount === 0 ? 1 : Math.max(1, Math.round(previousIntervalDays * 1.45));
}

function getNextEaseFactor(currentEaseFactor: number, result: 'correct' | 'incorrect', rating: OpeningRating): number {
  const deltaByRating: Record<OpeningRating, number> = {
    again: -0.25,
    hard: -0.1,
    good: 0,
    easy: 0.15,
  };
  const resultPenalty = result === 'incorrect' ? -0.2 : 0;
  return clamp(currentEaseFactor + deltaByRating[rating] + resultPenalty, MIN_EASE_FACTOR, MAX_EASE_FACTOR);
}

function calculateOpeningMastery(correctCount: number, missedCount: number, intervalDays: number, lapseCount: number): number {
  const total = correctCount + missedCount;
  const accuracyScore = total === 0 ? 0 : (correctCount / total) * 70;
  const intervalScore = Math.min(20, intervalDays * 2);
  const lapsePenalty = Math.min(30, lapseCount * 6);
  return Math.round(clamp(accuracyScore + intervalScore + 10 - lapsePenalty, 0, 100));
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function stripPgnNoise(rawPgn: string): string {
  let text = rawPgn
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/;[^\n\r]*/g, ' ')
    .replace(/\$\d+/g, ' ');

  while (/\([^()]*\)/.test(text)) {
    text = text.replace(/\([^()]*\)/g, ' ');
  }

  return text.replace(/\d+\.(\.\.)?/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeSanToken(token: string): string {
  return token.replace(/^[.]+/, '').replace(/[!?]+$/g, '').trim();
}

function isPgnResult(token: string): boolean {
  return token === '1-0' || token === '0-1' || token === '1/2-1/2' || token === '*';
}

function buildImportedVariationNode(
  line: ImportedOpeningLine,
  nodes: Array<{ move: string; moveIndex: number }>,
  templateNodes: OpeningVariationNode[],
  nodeIndex: number,
  importedSide: OpeningSide
): OpeningVariationNode {
  const importedMove = nodes[nodeIndex];
  const templateNode = templateNodes[nodeIndex] ?? templateNodes[templateNodes.length - 1];
  const nextNode = nodeIndex < nodes.length - 1
    ? buildImportedVariationNode(line, nodes, templateNodes, nodeIndex + 1, importedSide)
    : null;
  const opponentReplySan = line.moves[importedMove.moveIndex + 1];
  const moveCoords = approximateSanMove(importedMove.move, importedSide);

  return {
    id: `${line.id}-node-${nodeIndex}`,
    fen: nodeIndex === 0 ? initialFenForSide(importedSide) : templateNode?.fen ?? initialFenForSide(importedSide),
    moveNumber: Math.floor(importedMove.moveIndex / 2) + 1,
    sideToMove: importedSide === 'White' ? 'w' : 'b',
    prompt: `Recall ${importedMove.move} from the imported PGN line.`,
    expectedMoveSan: formatImportedSan(importedMove.move, importedMove.moveIndex),
    expectedMoveFrom: moveCoords.from,
    expectedMoveTo: moveCoords.to,
    opponentReplySan,
    opponentReplyFen: nextNode?.fen,
    incomingMoveSan: importedMove.moveIndex > 0 ? line.moves[importedMove.moveIndex - 1] : undefined,
    idea: 'Imported training node. Use this as a memory drill; exact board reconstruction will be added with full PGN import.',
    explanation: `This position comes from the imported line "${line.name}". The target move is ${importedMove.move}.`,
    tags: ['Imported', 'PGN'],
    branches: nextNode ? [nextNode] : [],
  };
}

function initialFenForSide(side: OpeningSide): string {
  return side === 'White'
    ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    : 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
}

function approximateSanMove(san: string, side: OpeningSide): { from: string; to: string } {
  const normalized = san.replace(/[+#?!]/g, '');
  const whiteMoves: Record<string, { from: string; to: string }> = {
    e4: { from: 'e2', to: 'e4' },
    d4: { from: 'd2', to: 'd4' },
    c4: { from: 'c2', to: 'c4' },
    Nf3: { from: 'g1', to: 'f3' },
    Nc3: { from: 'b1', to: 'c3' },
    g3: { from: 'g2', to: 'g3' },
    b3: { from: 'b2', to: 'b3' },
  };
  const blackMoves: Record<string, { from: string; to: string }> = {
    e5: { from: 'e7', to: 'e5' },
    d5: { from: 'd7', to: 'd5' },
    c5: { from: 'c7', to: 'c5' },
    Nf6: { from: 'g8', to: 'f6' },
    Nc6: { from: 'b8', to: 'c6' },
    g6: { from: 'g7', to: 'g6' },
    b6: { from: 'b7', to: 'b6' },
  };

  return side === 'White'
    ? whiteMoves[normalized] ?? { from: 'e2', to: 'e4' }
    : blackMoves[normalized] ?? { from: 'e7', to: 'e5' };
}

function formatImportedSan(move: string, moveIndex: number): string {
  const moveNumber = Math.floor(moveIndex / 2) + 1;
  return moveIndex % 2 === 0 ? `${moveNumber}.${move}` : `${moveNumber}...${move}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
