const { LOGBOOK_STATUS, ASSESSMENT_STATUS } = require("../../utils/constants");
const { calculateScore } = require("./helpers");

const DEFAULT_SYSTEM_SCORE_MAX = 80;
const DEFAULT_DEFENSE_SCORE_MAX = 20;
const DEFAULT_VISITATION_LIMIT = 2;

const DEFAULT_WEIGHTS = {
  logbook: 20,
  evaluation: 20,
  assessment: 30,
  visitation: 10,
};

const round2 = (value) => Math.round(value * 100) / 100;

const average = (values) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const calculateExpectedWeeks = (placement) => {
  if (!placement?.startDate || !placement?.endDate) {
    return null;
  }

  const start = new Date(placement.startDate);
  const end = new Date(placement.endDate);
  const diff = end.getTime() - start.getTime();

  if (!Number.isFinite(diff) || diff <= 0) {
    return null;
  }

  return Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
};

const calculateLogbookCompletion = (logbooks, placement) => {
  const expectedWeeks = calculateExpectedWeeks(placement);
  const completedEntries = logbooks.filter(
    (entry) => entry.status && entry.status !== LOGBOOK_STATUS.DRAFT,
  ).length;

  const denominator = expectedWeeks || Math.max(logbooks.length, 1);
  const completionRate = Math.min(completedEntries / denominator, 1);

  return {
    score: round2(completionRate * 100),
    completedEntries,
    expectedEntries: denominator,
  };
};

const calculateEvaluationComponent = (evaluations) => {
  const usable = evaluations.filter((evaluation) =>
    ["submitted", "completed"].includes(evaluation.status),
  );

  const score = average(usable.map((evaluation) => evaluation.totalScore));

  return {
    score: round2(score),
    count: usable.length,
  };
};

const calculateAssessmentComponent = (assessments) => {
  const usable = assessments.filter(
    (assessment) => assessment.status === ASSESSMENT_STATUS.COMPLETED,
  );

  const score = average(usable.map((assessment) => calculateScore(assessment)));

  return {
    score: round2(score),
    count: usable.length,
  };
};

const calculateVisitationComponent = (visits, visitLimit) => {
  const completedVisits = visits.filter((visit) => visit.status === "completed");
  const effectiveLimit = Math.max(1, Number(visitLimit) || DEFAULT_VISITATION_LIMIT);
  const completionRate = Math.min(completedVisits.length / effectiveLimit, 1);

  const scoredVisits = completedVisits.filter((v) => Number.isFinite(v.score));
  const avgQuality =
    scoredVisits.length > 0
      ? scoredVisits.reduce((sum, v) => sum + v.score, 0) / scoredVisits.length
      : 100;

  const combinedScore = round2(completionRate * (avgQuality / 100) * 100);

  return {
    score: combinedScore,
    completionScore: round2(completionRate * 100),
    averageQuality: round2(avgQuality),
    completedVisits: completedVisits.length,
    scoredVisits: scoredVisits.length,
    visitLimit: effectiveLimit,
  };
};

const calculateGradeFromPercentage = (score) => {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
};

const normalizeScoringConfig = (scoringConfig = {}) => {
  const rawSystemScoreMax = Number(scoringConfig.systemScoreMax);
  const rawDefenseScoreMax = Number(scoringConfig.defenseScoreMax);
  const rawVisitLimit = Number(scoringConfig.maxVisitations);

  const weights = {
    logbook: Number(scoringConfig.logbookWeight),
    evaluation: Number(scoringConfig.evaluationWeight),
    assessment: Number(scoringConfig.assessmentWeight),
    visitation: Number(scoringConfig.visitationWeight),
  };

  const safeWeights = {
    logbook:
      Number.isFinite(weights.logbook) && weights.logbook >= 0
        ? weights.logbook
        : DEFAULT_WEIGHTS.logbook,
    evaluation:
      Number.isFinite(weights.evaluation) && weights.evaluation >= 0
        ? weights.evaluation
        : DEFAULT_WEIGHTS.evaluation,
    assessment:
      Number.isFinite(weights.assessment) && weights.assessment >= 0
        ? weights.assessment
        : DEFAULT_WEIGHTS.assessment,
    visitation:
      Number.isFinite(weights.visitation) && weights.visitation >= 0
        ? weights.visitation
        : DEFAULT_WEIGHTS.visitation,
  };

  const totalWeight = Object.values(safeWeights).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  return {
    systemScoreMax:
      Number.isFinite(rawSystemScoreMax) && rawSystemScoreMax > 0
        ? rawSystemScoreMax
        : DEFAULT_SYSTEM_SCORE_MAX,
    defenseScoreMax:
      Number.isFinite(rawDefenseScoreMax) && rawDefenseScoreMax >= 0
        ? rawDefenseScoreMax
        : DEFAULT_DEFENSE_SCORE_MAX,
    maxVisitations:
      Number.isFinite(rawVisitLimit) && rawVisitLimit > 0
        ? rawVisitLimit
        : DEFAULT_VISITATION_LIMIT,
    weights: totalWeight > 0 ? safeWeights : DEFAULT_WEIGHTS,
  };
};

const calculateSystemContinuousScore = ({
  logbooks = [],
  assessments = [],
  evaluations = [],
  visits = [],
  placement = null,
  scoringConfig = {},
}) => {
  const normalizedConfig = normalizeScoringConfig(scoringConfig);
  const logbook = calculateLogbookCompletion(logbooks, placement);
  const evaluation = calculateEvaluationComponent(evaluations);
  const assessment = calculateAssessmentComponent(assessments);
  const visitation = calculateVisitationComponent(
    visits,
    normalizedConfig.maxVisitations,
  );

  const totalWeight = Object.values(normalizedConfig.weights).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  const weightFactor = normalizedConfig.systemScoreMax / totalWeight;

  const weightedPoints = {
    logbook: round2(
      (logbook.score / 100) * normalizedConfig.weights.logbook * weightFactor,
    ),
    evaluation: round2(
      (evaluation.score / 100) *
        normalizedConfig.weights.evaluation *
        weightFactor,
    ),
    assessment: round2(
      (assessment.score / 100) *
        normalizedConfig.weights.assessment *
        weightFactor,
    ),
    visitation: round2(
      (visitation.score / 100) *
        normalizedConfig.weights.visitation *
        weightFactor,
    ),
  };

  const systemScore = round2(
    weightedPoints.logbook +
      weightedPoints.evaluation +
      weightedPoints.assessment +
      weightedPoints.visitation,
  );

  const normalizedPercentage = round2(
    (systemScore / normalizedConfig.systemScoreMax) * 100,
  );

  return {
    systemScore,
    systemScoreMax: normalizedConfig.systemScoreMax,
    defenseScoreMax: normalizedConfig.defenseScoreMax,
    normalizedPercentage,
    provisionalGrade: calculateGradeFromPercentage(normalizedPercentage),
    // Backward-compatible fields used by existing report consumers
    score: systemScore,
    grade: calculateGradeFromPercentage(normalizedPercentage),
    weights: normalizedConfig.weights,
    maxVisitations: normalizedConfig.maxVisitations,
    components: {
      logbook,
      evaluation,
      assessment,
      visitation,
    },
    weightedPoints,
    defenseScoreNote:
      "Defense contributes remaining 20% and is entered externally by the school.",
  };
};

module.exports = {
  calculateSystemContinuousScore,
  DEFAULT_SYSTEM_SCORE_MAX,
  DEFAULT_DEFENSE_SCORE_MAX,
  DEFAULT_VISITATION_LIMIT,
  DEFAULT_WEIGHTS,
  normalizeScoringConfig,
};
