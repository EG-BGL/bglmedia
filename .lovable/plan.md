
## Multi-Sport Hub: Adding Cricket

### Phase 1: Database Schema Changes
- Add a `sports` table (id, name, slug, icon) with entries for "AFL" and "Cricket"
- Add `sport_id` column to `competitions` table to link competitions to a sport
- Create `cricket_match_results` table for cricket-specific scoring (runs, wickets, overs, innings, extras, run rate)
- Create `cricket_player_stats` table (runs, balls_faced, fours, sixes, strike_rate, overs_bowled, wickets, economy, maidens, catches, stumpings, run_outs)
- Create `cricket_team_stats` table (total_runs, total_wickets, extras, run_rate, overs_bowled)
- Update existing `competitions` rows to link to the AFL sport

### Phase 2: Sport Switcher UI
- Add a global sport context/provider so the whole app knows which sport is active
- Add a sport switcher to the header/nav (AFL ⚽ | Cricket 🏏)
- Persist selection in localStorage

### Phase 3: Cricket-Specific Pages & Components
- Cricket-adapted fixtures page (showing match format: T20/One-Day/Multi-Day)
- Cricket results with innings breakdowns
- Cricket ladder with NRR (Net Run Rate) instead of percentage
- Cricket Match Centre with batting/bowling scorecards
- Cricket player profiles with batting/bowling averages

### Phase 4: Shared Infrastructure Updates
- Update the admin dashboard to manage cricket competitions, seasons, and fixtures
- Update the submit result flow for cricket scoring (innings, overs, batting order)
- Update Player of the Round to work across both sports
- Update the homepage to show content from both sports

### Order of implementation
I'd suggest we tackle this in phases, starting with Phase 1 (database) → Phase 2 (sport switcher) → Phase 3 (cricket pages) → Phase 4 (admin tools). 

Shall I proceed with Phase 1?
