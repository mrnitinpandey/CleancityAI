/**
 * CleanCity AI - Gamification & Karma Badge System
 * Calculates dynamic points, levels, ranks and unlocks badges for Citizens & Sanitation Crews.
 */

// Citizen Badges Definition
export const CITIZEN_BADGES = [
  { id: 'first_report', name: 'Civic Scout', icon: '🌱', threshold: 1, desc: 'Reported your first cleanliness issue in Kanpur' },
  { id: 'clean_crusader', name: 'Clean Crusader', icon: '🛡️', threshold: 3, desc: 'Reported 3+ verified civic cleanliness issues' },
  { id: 'eco_guardian', name: 'Eco Guardian', icon: '🌟', threshold: 5, desc: 'Active citizen with 5+ community reports' },
  { id: 'kanpur_champion', name: 'Kanpur Civic Hero', icon: '👑', threshold: 10, desc: 'Top tier civic champion transforming Kanpur' }
];

// Field Crew Worker Badges Definition
export const CREW_BADGES = [
  { id: 'first_fix', name: 'Field Responder', icon: '⚡', threshold: 1, desc: 'Resolved your first on-site municipal job with photo proof' },
  { id: 'rapid_cleaner', name: 'Rapid Sanitation Pro', icon: '🚀', threshold: 3, desc: 'Successfully cleared and verified 3+ civic work orders' },
  { id: 'master_sweeper', name: 'Master Sanitation Lead', icon: '🏆', threshold: 5, desc: 'Achieved 5+ photo-verified site resolutions' },
  { id: 'city_savior', name: 'Kanpur Swachh Legend', icon: '🎖️', threshold: 10, desc: 'Elite municipal leader with 10+ rapid resolutions' }
];

/**
 * Calculates Citizen Level and unlocked badges
 */
export function calculateCitizenKarma(reportsCount = 0, resolvedCount = 0) {
  // 50 points per report filed + 100 bonus points per resolved issue
  const points = (reportsCount * 50) + (resolvedCount * 100);
  
  let tier = 'Bronze Citizen';
  let tierColor = '#94a3b8';
  if (points >= 800) {
    tier = 'Diamond Civic Leader';
    tierColor = '#38bdf8';
  } else if (points >= 400) {
    tier = 'Gold Civic Champion';
    tierColor = '#fbbf24';
  } else if (points >= 150) {
    tier = 'Silver Contributor';
    tierColor = '#cbd5e1';
  }

  const unlockedBadges = CITIZEN_BADGES.filter(b => reportsCount >= b.threshold);

  return {
    points,
    tier,
    tierColor,
    reportsCount,
    resolvedCount,
    unlockedBadges,
    allBadges: CITIZEN_BADGES
  };
}

/**
 * Calculates Field Crew Worker Rewards & Badges
 */
export function calculateCrewKarma(resolvedCount = 0) {
  // 150 points per photo-verified job resolved + bonus for speed
  const points = resolvedCount * 150;
  
  let rank = 'Junior Field Crew';
  let rankColor = '#94a3b8';
  if (resolvedCount >= 10) {
    rank = 'Kanpur Chief Field Officer';
    rankColor = '#a855f7';
  } else if (resolvedCount >= 5) {
    rank = 'Elite Master Sanitation Lead';
    rankColor = '#fbbf24';
  } else if (resolvedCount >= 2) {
    rank = 'Senior Rapid Crew';
    rankColor = '#34d399';
  }

  const unlockedBadges = CREW_BADGES.filter(b => resolvedCount >= b.threshold);

  return {
    points,
    rank,
    rankColor,
    resolvedCount,
    unlockedBadges,
    allBadges: CREW_BADGES
  };
}
