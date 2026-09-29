# Instructor guide

## Time
A full play-through takes about 90 to 120 minutes for a team. Options:

- **Capstone**: one 2-hour session, or split across two with save and load.
- **Weekly modules**: play two or three phases a week alongside the related topic (water, energy, habitats).
- **Focused**: assign only some phases, then have teams export their game file and discuss.

## Suggested facilitation
1. Open with the before and after photos of a pristine and a bulldozed island, as in the original facilitator's guide, then launch the game.
2. Teams of three: one director leads each decision, and the others challenge with evidence. The game names the lead in every phase.
3. Pause at the midpoint board review for a whole-class check.
4. Use the final report's civic debrief questions for discussion.

## Assessment evidence
Menu, Instructor panel, Results CSV includes decisions, scores, reflections, civic answers, and confidence ratings. Use the reflections and the knowledge checks for formative feedback, and the pitch webpage export as the seed of the team's own webpage deliverable.

## Tuning
- Make it harder by lowering budgets or raising `sev` in `js/config.js`.
- Localize it by changing the island name and region in `js/config.js` and the species in `js/data.js`.
- Every number lives in `js/data.js`. Effects are index points, so an effect of 5 is meaningful and 15 is dramatic.

## Known simplifications
Habitat, finance, and event models are deliberately simple so students can reason about them. Treat the outputs as prompts for discussion, not predictions.
