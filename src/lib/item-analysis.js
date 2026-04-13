// Per-question item analysis: correct%, wrong%, blank%, difficulty rating

/**
 * Analyze per-question performance across all students.
 * @param {object[]} results - scored student results
 * @param {object} config - test configuration with answer keys
 * @returns {Array<{ question: number, section: string, correctPct: number, wrongPct: number, blankPct: number, commonWrong: string, difficulty: string }>}
 */
export function analyzeItems(results, config) {
  if (results.length === 0) return [];
  const total = results.length;
  const items = [];

  // Phần I — multiple choice
  for (let q = 0; q < config.phanI.questionCount; q++) {
    const correct = config.phanI.answers[q];
    let correctCount = 0;
    let blankCount = 0;
    const wrongCounts = {};

    for (const r of results) {
      const ans = r.phanI?.[q];
      if (!ans) { blankCount++; continue; }
      if (ans === correct) { correctCount++; continue; }
      wrongCounts[ans] = (wrongCounts[ans] || 0) + 1;
    }

    const wrongEntries = Object.entries(wrongCounts);
    const commonWrong = wrongEntries.length > 0
      ? wrongEntries.sort((a, b) => b[1] - a[1])[0][0]
      : '-';

    const correctPct = Math.round((correctCount / total) * 100);
    items.push({
      question: q + 1,
      section: 'I',
      correctPct,
      wrongPct: Math.round(((total - correctCount - blankCount) / total) * 100),
      blankPct: Math.round((blankCount / total) * 100),
      commonWrong,
      difficulty: getDifficulty(correctPct),
    });
  }

  // Phần II — true/false per sub-option
  for (let q = 0; q < config.phanII.questionCount; q++) {
    const correct = config.phanII.answers[q];
    if (!correct) continue;
    let correctCount = 0;
    let totalSubs = 0;

    for (const r of results) {
      const ans = r.phanII?.[q];
      if (!ans) continue;
      for (const sub of ['a', 'b', 'c', 'd']) {
        totalSubs++;
        if (ans[sub] === correct[sub]) correctCount++;
      }
    }

    const correctPct = totalSubs > 0 ? Math.round((correctCount / totalSubs) * 100) : 0;
    items.push({
      question: q + 1,
      section: 'II',
      correctPct,
      wrongPct: 100 - correctPct,
      blankPct: 0,
      commonWrong: '-',
      difficulty: getDifficulty(correctPct),
    });
  }

  // Phần III — numerical
  for (let q = 0; q < config.phanIII.questionCount; q++) {
    const correct = config.phanIII.answers[q];
    let correctCount = 0;
    let blankCount = 0;

    for (const r of results) {
      const ans = r.phanIII?.[q];
      if (!ans) { blankCount++; continue; }
      if (ans === correct) correctCount++;
    }

    const correctPct = Math.round((correctCount / total) * 100);
    items.push({
      question: q + 1,
      section: 'III',
      correctPct,
      wrongPct: Math.round(((total - correctCount - blankCount) / total) * 100),
      blankPct: Math.round((blankCount / total) * 100),
      commonWrong: '-',
      difficulty: getDifficulty(correctPct),
    });
  }

  return items;
}

/** @param {number} correctPct @returns {'Dễ'|'TB'|'Khó'} */
function getDifficulty(correctPct) {
  if (correctPct >= 80) return 'Dễ';
  if (correctPct >= 50) return 'TB';
  return 'Khó';
}
