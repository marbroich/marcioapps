/**
 * Pythagorean numerology calculator.
 *
 * Letter→number map (A=1..I=9, J=1..R=9, S=1..Z=8). Master numbers 11/22/33 are
 * preserved (not reduced) at intermediate AND final steps for life path, expression,
 * soul urge, personality. Birthday number is reduced unless it lands on a master number.
 */

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
// Y is treated as a vowel when it's not adjacent to another vowel and produces
// the only vowel sound in a syllable. Implementing the full rule is fragile —
// most apps either always count Y as a vowel or never. We treat Y as a vowel
// when it's not adjacent to any other vowel, which is a reasonable middle.
function isYAVowel(letters, idx) {
  const prev = letters[idx - 1];
  const next = letters[idx + 1];
  return !(prev && VOWELS.has(prev)) && !(next && VOWELS.has(next));
}

const LETTER_VALUES = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const MASTER_NUMBERS = new Set([11, 22, 33]);

function reduce(n) {
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n).split('').reduce((a, d) => a + Number(d), 0);
  }
  return n;
}

function normalizeName(name) {
  return (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .trim();
}

function letterArray(name) {
  return normalizeName(name).split('').filter(c => /[A-Z]/.test(c));
}

function isVowel(letters, idx) {
  const c = letters[idx];
  if (VOWELS.has(c)) return true;
  if (c === 'Y') return isYAVowel(letters, idx);
  return false;
}

export function lifePath(birthDateStr) {
  // birthDateStr: 'YYYY-MM-DD'
  if (!birthDateStr) return null;
  const [y, m, d] = birthDateStr.split('-').map(Number);
  // Reduce each component preserving master numbers, then sum, then reduce final.
  const ry = reduce(y);
  const rm = reduce(m);
  const rd = reduce(d);
  return reduce(ry + rm + rd);
}

export function birthdayNumber(birthDateStr) {
  if (!birthDateStr) return null;
  const day = Number(birthDateStr.split('-')[2]);
  return reduce(day);
}

export function expression(name) {
  const letters = letterArray(name);
  if (!letters.length) return null;
  const sum = letters.reduce((a, c) => a + (LETTER_VALUES[c] || 0), 0);
  return reduce(sum);
}

export function soulUrge(name) {
  const letters = letterArray(name);
  if (!letters.length) return null;
  let sum = 0;
  for (let i = 0; i < letters.length; i++) {
    if (isVowel(letters, i)) sum += LETTER_VALUES[letters[i]] || 0;
  }
  return reduce(sum);
}

export function personality(name) {
  const letters = letterArray(name);
  if (!letters.length) return null;
  let sum = 0;
  for (let i = 0; i < letters.length; i++) {
    if (!isVowel(letters, i)) sum += LETTER_VALUES[letters[i]] || 0;
  }
  return reduce(sum);
}

export function personalYear(birthDateStr, refYear = new Date().getFullYear()) {
  if (!birthDateStr) return null;
  const [, m, d] = birthDateStr.split('-').map(Number);
  return reduce(reduce(m) + reduce(d) + reduce(refYear));
}

export function maturity(birthDateStr, name) {
  const lp = lifePath(birthDateStr);
  const ex = expression(name);
  if (lp == null || ex == null) return null;
  return reduce(lp + ex);
}

export function computeAll(name, birthDateStr, refYear) {
  return {
    lifePath: lifePath(birthDateStr),
    expression: expression(name),
    soulUrge: soulUrge(name),
    personality: personality(name),
    birthdayNumber: birthdayNumber(birthDateStr),
    personalYear: personalYear(birthDateStr, refYear),
    maturity: maturity(birthDateStr, name),
  };
}

// ---- Interpretations (compact) ----
export const NUMBER_INTERPRETATIONS = {
  lifePath: {
    title: 'Life Path',
    summary: 'The arc of your life — the lessons, themes, and direction you came here to walk.',
    meanings: {
      1: 'Independent, pioneering, self-reliant. Lessons in leadership and standing alone without becoming closed off.',
      2: 'Diplomatic, sensitive, cooperative. Lessons in partnership, patience, and not losing yourself in service to others.',
      3: 'Expressive, creative, social. Lessons in finishing what you start and using your voice with depth, not just charm.',
      4: 'Builder, methodical, loyal. Lessons in flexibility, trusting process, and not confusing structure with safety.',
      5: 'Restless, adventurous, freedom-seeking. Lessons in commitment without losing curiosity, and in choosing rather than fleeing.',
      6: 'Caretaker, harmonizer, responsible. Lessons in giving without absorbing, and letting others carry their own weight.',
      7: 'Seeker, analyst, contemplative. Lessons in trusting intuition alongside logic, and not retreating from intimacy.',
      8: 'Power, ambition, material mastery. Lessons in using authority with integrity and recognizing wealth beyond money.',
      9: 'Humanitarian, completion, old-soul. Lessons in releasing what is finished, and serving without martyring.',
      11: 'Master Intuitive. The 2 path with heightened sensitivity — visionary, inspirational, often anxious. Channel insight into form.',
      22: 'Master Builder. The 4 path supersized — practical visionary, large-scale impact possible. Resists pressure to play small.',
      33: 'Master Teacher. The 6 path elevated — devotional service, guiding others. Rare; demands self-care to sustain.',
    },
  },
  expression: {
    title: 'Expression / Destiny',
    summary: 'Your natural talents and the form your contribution takes when you\'re fully yourself.',
    meanings: {
      1: 'You build something new. Original, decisive, a self-starter.',
      2: 'You bring people and ideas together. Mediator, partner, listener.',
      3: 'You communicate. Writer, performer, connector — words and feeling.',
      4: 'You make things solid. Engineer, organizer, foundation-layer.',
      5: 'You change the room. Promoter, traveler, agent of variety.',
      6: 'You hold space for others. Counselor, parent, healer, host.',
      7: 'You go deep. Researcher, mystic, specialist.',
      8: 'You lead and earn. Executive, founder, financier.',
      9: 'You serve a wider whole. Artist, activist, philosopher.',
      11: 'You inspire by example. Spiritual messenger; high-frequency.',
      22: 'You build at scale. Master architect; ideas that outlast you.',
      33: 'You teach and uplift. Compassion as vocation.',
    },
  },
  soulUrge: {
    title: 'Soul Urge / Heart\'s Desire',
    summary: 'What you actually want underneath what you say you want — the inner motivator.',
    meanings: {
      1: 'To be original. To lead, not follow.',
      2: 'To love and be loved. Peace, partnership.',
      3: 'To express. To delight and be delighted.',
      4: 'To build something that lasts.',
      5: 'To experience everything. Freedom.',
      6: 'To be needed. To care for and be cared for.',
      7: 'To understand. Truth over comfort.',
      8: 'To master the material world.',
      9: 'To matter to many. To leave the world better.',
      11: 'To illuminate. Spiritual truth as oxygen.',
      22: 'To leave a structure behind that helps people.',
      33: 'To love the world into being whole.',
    },
  },
  personality: {
    title: 'Personality',
    summary: 'How you come across in first impressions and casual contact — your social interface.',
    meanings: {
      1: 'Confident, direct, slightly aloof.',
      2: 'Warm, gentle, approachable.',
      3: 'Charming, witty, expressive.',
      4: 'Steady, grounded, serious.',
      5: 'Magnetic, restless, fun.',
      6: 'Caring, responsible, parental.',
      7: 'Enigmatic, thoughtful, private.',
      8: 'Authoritative, capable, polished.',
      9: 'Worldly, wise, slightly distant.',
      11: 'Intense, sensitive, intuitive presence.',
      22: 'Quietly powerful, dependable, ambitious.',
      33: 'Maternal/paternal in a universal sense.',
    },
  },
  birthdayNumber: {
    title: 'Birthday',
    summary: 'A specific gift the day of your birth gives you — flavor on top of the life path.',
    meanings: {
      1: 'Self-starter; independence shows up early.',
      2: 'Sensitive; reads the room before the room reads you.',
      3: 'Expressive from childhood.',
      4: 'Naturally orderly.',
      5: 'Curious; needs variety.',
      6: 'Nurturing instincts.',
      7: 'Naturally introspective.',
      8: 'Drawn to capability and capacity.',
      9: 'Old-soul tilt.',
      11: 'Heightened intuition since youth.',
      22: 'Big-picture thinker very young.',
      33: 'Profoundly empathic.',
    },
  },
  personalYear: {
    title: 'Personal Year',
    summary: 'The theme for the calendar year you\'re currently in. Cycles 1→9 then resets.',
    meanings: {
      1: 'A new cycle begins. Plant. Initiate. Take risks on yourself.',
      2: 'Slow down. Cooperate. Wait for the right partnership / timing.',
      3: 'Express, create, socialize. Visibility year.',
      4: 'Build. Discipline. Pay attention to foundations.',
      5: 'Change, freedom, travel. Don\'t over-commit.',
      6: 'Family, home, responsibility. Tend what you love.',
      7: 'Inward year. Study, reflect. Don\'t force outer momentum.',
      8: 'Power, money, recognition. Lean in. Don\'t be timid.',
      9: 'Completion. Release what\'s finished. Cleanse for next cycle.',
      11: 'Spiritual awakening accelerates. Trust signs.',
      22: 'Big-build year — lay the cornerstone of a long project.',
      33: 'Year of service that costs and gives back.',
    },
  },
  maturity: {
    title: 'Maturity',
    summary: 'A theme that emerges most strongly from your mid-30s onward — what you grow into.',
    meanings: {
      1: 'Maturing into your own authority.',
      2: 'Maturing into partnership and patience.',
      3: 'Maturing into fuller self-expression.',
      4: 'Maturing into reliable mastery.',
      5: 'Maturing into chosen freedom.',
      6: 'Maturing into wise care.',
      7: 'Maturing into integrated wisdom.',
      8: 'Maturing into legacy and stewardship.',
      9: 'Maturing into wider service.',
      11: 'Maturing into a teacher of inner truth.',
      22: 'Maturing into builder of lasting form.',
      33: 'Maturing into compassion at scale.',
    },
  },
};
