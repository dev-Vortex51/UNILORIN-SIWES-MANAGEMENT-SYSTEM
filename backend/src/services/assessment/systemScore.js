const { LOGBOOK_STATUS, ASSESSMENT_STATUS } = require("../../utils/constants");
const { calculateScore } = require("./helpers");

const DEFAULT_SYSTEM_SCORE_MAX = 80;
const DEFAULT_DEFENSE_SCORE_MAX = 20;

const DEFAULT_WEIGHTS = {
  logbook: 50,
  assessment: 30,
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

const calculateAssessmentComponent = (assessments) => {
  const usable = assessments.filter(
    (assessment) =>
      assessment.status === ASSESSMENT_STATUS.COMPLETED &&
      assessment.type !== "industrial",
  );

  const score = average(usable.map((assessment) => calculateScore(assessment)));

  return {
    score: round2(score),
    count: usable.length,
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

  const weights = {
    logbook: Number(scoringConfig.logbookWeight),
    assessment: Number(scoringConfig.assessmentWeight),
  };

  const safeWeights = {
    logbook:
      Number.isFinite(weights.logbook) && weights.logbook >= 0
        ? weights.logbook
        : DEFAULT_WEIGHTS.logbook,
    assessment:
      Number.isFinite(weights.assessment) && weights.assessment >= 0
        ? weights.assessment
        : DEFAULT_WEIGHTS.assessment,
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
    weights: totalWeight > 0 ? safeWeights : DEFAULT_WEIGHTS,
  };
};

const calculateSystemContinuousScore = ({
  logbooks = [],
  assessments = [],
  placement = null,
  scoringConfig = {},
}) => {
  const normalizedConfig = normalizeScoringConfig(scoringConfig);
  const logbook = calculateLogbookCompletion(logbooks, placement);
  const assessment = calculateAssessmentComponent(assessments);

  const totalWeight = Object.values(normalizedConfig.weights).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  const weightFactor = normalizedConfig.systemScoreMax / totalWeight;

  const weightedPoints = {
    logbook: round2(
      (logbook.score / 100) * normalizedConfig.weights.logbook * weightFactor,
    ),
    assessment: round2(
      (assessment.score / 100) *
        normalizedConfig.weights.assessment *
        weightFactor,
    ),
  };

  const systemScore = round2(
    weightedPoints.logbook + weightedPoints.assessment,
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
    score: systemScore,
    grade: calculateGradeFromPercentage(normalizedPercentage),
    weights: normalizedConfig.weights,
    components: {
      logbook,
      assessment,
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
  DEFAULT_WEIGHTS,
  normalizeScoringConfig,
};
