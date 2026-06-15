const calculateGrade = (score) => {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
};

const calculateScore = (assessment) => {
  const scores = [
    assessment.technical,
    assessment.communication,
    assessment.punctuality,
    assessment.initiative,
    assessment.teamwork,
  ];

  const validScores = scores.filter((s) => s !== null && s !== undefined);
  if (validScores.length === 0) return 0;

  return Math.round(
    validScores.reduce((a, b) => a + b, 0) / validScores.length,
  );
};

module.exports = {
  calculateGrade,
  calculateScore,
};
