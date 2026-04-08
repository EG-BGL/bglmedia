// Seed data for the football competition - Australian-style clubs
export const SEED_CLUBS = [
  { name: 'Bayside Hawks', short_name: 'BAY', primary_color: '#1a365d', secondary_color: '#d69e2e', home_ground: 'Bayside Oval', founded_year: 1923, description: 'One of the founding clubs of the league, the Hawks have a proud history.' },
  { name: 'Riverside Tigers', short_name: 'RIV', primary_color: '#92400e', secondary_color: '#fbbf24', home_ground: 'Riverside Park', founded_year: 1935, description: 'Known for their fierce attack and passionate supporters.' },
  { name: 'Mountain Lions', short_name: 'MTN', primary_color: '#065f46', secondary_color: '#f5f5f4', home_ground: 'Lions Den Arena', founded_year: 1948, description: 'A club built on strong community values and relentless pressure footy.' },
  { name: 'Coastal Dolphins', short_name: 'CST', primary_color: '#1e40af', secondary_color: '#60a5fa', home_ground: 'Coastal Reserve', founded_year: 1951, description: 'Playing seaside footy with flair and skill.' },
  { name: 'Northern Wolves', short_name: 'NTH', primary_color: '#374151', secondary_color: '#ef4444', home_ground: 'Northgate Oval', founded_year: 1940, description: 'The Wolves are known for their pack mentality and never-give-up attitude.' },
  { name: 'Eastern Eagles', short_name: 'EST', primary_color: '#312e81', secondary_color: '#818cf8', home_ground: 'Eagles Nest Ground', founded_year: 1929, description: 'Soaring to success with speed and skill across the midfield.' },
  { name: 'Southern Saints', short_name: 'STH', primary_color: '#991b1b', secondary_color: '#fef2f2', home_ground: 'Saints Park', founded_year: 1932, description: 'A powerhouse club with multiple premierships to their name.' },
  { name: 'Western Bulldogs', short_name: 'WST', primary_color: '#1e3a5f', secondary_color: '#e5e7eb', home_ground: 'Bulldog Stadium', founded_year: 1945, description: 'Tenacious and hard-working, the Bulldogs never back down.' },
];

export const SEED_PLAYERS_PER_TEAM = [
  { first_name: 'Jack', last_name: 'Mitchell', jersey_number: 1, position: 'Full Back' },
  { first_name: 'Tom', last_name: 'Williams', jersey_number: 2, position: 'Back Pocket' },
  { first_name: 'Liam', last_name: 'O\'Brien', jersey_number: 3, position: 'Back Pocket' },
  { first_name: 'Ryan', last_name: 'Thompson', jersey_number: 4, position: 'Centre Half Back' },
  { first_name: 'Josh', last_name: 'Davis', jersey_number: 5, position: 'Half Back' },
  { first_name: 'Ben', last_name: 'Clark', jersey_number: 6, position: 'Half Back' },
  { first_name: 'Sam', last_name: 'Kelly', jersey_number: 7, position: 'Wing' },
  { first_name: 'Matt', last_name: 'Brown', jersey_number: 8, position: 'Centre' },
  { first_name: 'Luke', last_name: 'Taylor', jersey_number: 9, position: 'Wing' },
  { first_name: 'Jake', last_name: 'Anderson', jersey_number: 10, position: 'Half Forward' },
  { first_name: 'Dylan', last_name: 'Martin', jersey_number: 11, position: 'Half Forward' },
  { first_name: 'Zach', last_name: 'Wilson', jersey_number: 12, position: 'Centre Half Forward' },
  { first_name: 'Noah', last_name: 'Harris', jersey_number: 13, position: 'Forward Pocket' },
  { first_name: 'Ethan', last_name: 'White', jersey_number: 14, position: 'Forward Pocket' },
  { first_name: 'Max', last_name: 'Lewis', jersey_number: 15, position: 'Full Forward' },
  { first_name: 'Alex', last_name: 'Walker', jersey_number: 16, position: 'Ruck' },
  { first_name: 'Chris', last_name: 'Hall', jersey_number: 17, position: 'Ruck Rover' },
  { first_name: 'James', last_name: 'Young', jersey_number: 18, position: 'Rover' },
  { first_name: 'Cooper', last_name: 'King', jersey_number: 19, position: 'Interchange' },
  { first_name: 'Harry', last_name: 'Wright', jersey_number: 20, position: 'Interchange' },
  { first_name: 'Oscar', last_name: 'Green', jersey_number: 21, position: 'Interchange' },
  { first_name: 'Will', last_name: 'Baker', jersey_number: 22, position: 'Interchange' },
];

// Generate quarter scores in AFL format (goals.behinds)
function genQuarter(): { goals: number; behinds: number } {
  return { goals: Math.floor(Math.random() * 6), behinds: Math.floor(Math.random() * 5) };
}

export function generateMatchResult(homeClub: string, awayClub: string) {
  const hq = [genQuarter(), genQuarter(), genQuarter(), genQuarter()];
  const aq = [genQuarter(), genQuarter(), genQuarter(), genQuarter()];
  
  let hGoals = 0, hBehinds = 0, aGoals = 0, aBehinds = 0;
  const homeQtrs: string[] = [];
  const awayQtrs: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    hGoals += hq[i].goals;
    hBehinds += hq[i].behinds;
    aGoals += aq[i].goals;
    aBehinds += aq[i].behinds;
    homeQtrs.push(`${hGoals}.${hBehinds}.${hGoals * 6 + hBehinds}`);
    awayQtrs.push(`${aGoals}.${aBehinds}.${aGoals * 6 + aBehinds}`);
  }
  
  return {
    home_score: hGoals * 6 + hBehinds,
    away_score: aGoals * 6 + aBehinds,
    home_goals: hGoals,
    home_behinds: hBehinds,
    away_goals: aGoals,
    away_behinds: aBehinds,
    home_q1: homeQtrs[0],
    home_q2: homeQtrs[1],
    home_q3: homeQtrs[2],
    home_q4: homeQtrs[3],
    away_q1: awayQtrs[0],
    away_q2: awayQtrs[1],
    away_q3: awayQtrs[2],
    away_q4: awayQtrs[3],
  };
}

export const VENUES = [
  'Bayside Oval', 'Riverside Park', 'Lions Den Arena', 'Coastal Reserve',
  'Northgate Oval', 'Eagles Nest Ground', 'Saints Park', 'Bulldog Stadium',
];
