# Island Reborn: The Ecoresort Challenge

A team-based sustainability game built from the Ecoresort assignment described in Green (2022), *Critiquing the Learning Design of a SENCERized Team-Based Activity*, Science Education and Civic Engagement: An International Journal, 14(1).

Teams of three play a consulting firm hired to rebuild a bulldozed island as a sustainable ecoresort. Every task in the original assignment is now a decision. The island on screen changes as they decide: buildings rise, reefs recover or bleach, mangroves regrow, guests and staff walk the paths, and storms test the plan during a ten-year simulation.

No build step, no dependencies, no server. Plain HTML, CSS, and JavaScript.

## Run it

Open `index.html` in a browser. To publish with GitHub Pages: push this folder to a repository, then go to Settings, Pages, and choose the main branch and root folder.

## How the assignment maps to the game

| Assignment task | Game phase |
|---|---|
| Elect a Board of Directors matched to majors | Team: build three avatars, pick majors and roles. Directors with the right major lead related phases |
| Company name | Name your resort (sign appears on the island) |
| Why people come, visitors a year, recreation, mitigation | Concept |
| Water, food, energy | Three phases with coverage bars against guest demand |
| Waste (no shipping, no dumping) | Waste. The forbidden options are selectable but block progress, so students meet the rule |
| Transportation on the island and off it | Transportation |
| Employee housing | Employee housing |
| Public health | Public health |
| Wildlife areas and corridors | Wildlife areas: four habitat sliders plus corridor choices |
| Indicator species and niche | Indicator species with a niche challenge for each habitat |
| Climate change and sea-level rise | Climate |
| Earth Charter learning module and outreach | Earth Charter: one program per pillar plus a matching challenge |
| Ecological footprint | Ecological footprint with a live breakdown tab |
| Digital map of the layout | Resort map: place nine facilities on twelve plots |
| Triple bottom line Venn diagram | Triple bottom line, live Venn diagram in the dashboard |
| Webpage deliverable | Final report exports a starter pitch webpage |
| Midpoint assessment, knowledge checks, reflection | Midpoint board review, a knowledge check and reflection prompt in every phase |
| Final feedback survey outcomes | Confidence sliders on the final report |
| Civic questions | Civic debrief on the final report |


## Walking the island

The island is playable, not just viewable. Your director walks it with the arrow keys or WASD (or tap the map, or use the on-screen pad on touch devices). Press E near someone to talk, or near a glowing marker to inspect it.

- **Townspeople**: nine residents and advisors live on the island. Most decision phases start with a required conversation (a gold "!" marks who to see, and a beacon shows the way). Each conversation is a short branching chat. Respectful questions earn trust and local knowledge that appears in the phase panel and the pitch export. Dismissive answers lose trust. Trust changes the community score.
- **Skip option**: any conversation can be skipped, so instructors can shorten the game.
- **Quests**: a shoreline cleanup (collect litter, then report to Old Tomas) and a six-point field survey with live readings of water clarity, mangrove nursery, reef, rubble, nesting beach, and the notice board.
- **Hero switching**: the lead director for each phase becomes the playable hero. Click any director on the board to play as them.
- **Content**: all conversations live in `js/npcs.js`.


## Depth: reactions, side quests, locks, and the tour

- **Village tour**: a new game opens with a guided walk. Students step ashore, learn the controls by using them, meet Iris and Jo, read the notice board, and pick up litter. It can be skipped.
- **Reactions**: townspeople notice what the team built. A 💬 over someone means they have a reaction to a past decision, such as a fisher confronting overwater bungalows. The team's reply changes trust.
- **Side quests**: six quests open as the plan progresses (pond, rubble census, fever alert, town meeting, night watch, youth rangers). Each has inspect-and-report steps, gives an island bonus based on the answer, and unlocks a new option in a later phase.
- **Locks and unlocks**: high trust with a person or a finished quest unlocks extra options (locked options show why). Very low trust can lock existing ones. For example, a fisher who does not trust you will not join a fishers' cooperative.
- All of this content is in `js/npcs.js` (quests, reactions, tour) and `js/data.js` (the gated options, marked `need` or `block`).

## How it works

- **Model** (`js/model.js`): every option carries effects on capital, yearly cost, revenue, footprint, biodiversity, water quality, community, health, guest happiness, resilience, and habitat zones. Supply options add capacity, efficiency options cut demand, and the model compares both with guest numbers.
- **Habitats**: four zone qualities rise with diminishing returns. Biodiversity blends the mean, the weakest zone, and corridor connectivity. The indicator species needs different zones in different proportions.
- **Siting**: each facility scores differently on each plot (height, mangrove or pond proximity, forest, brownfield reuse, coastline).
- **Simulation** (`js/sim.js`): ten events, from a permit hearing to a king tide. Earlier decisions set severity, and the team's response changes the impact.
- **Scoring**: environment, people, and profit combine as a geometric mean, so one weak circle drags the whole result down. Nine achievements reward specific strategies.
- **Difficulty**: Guided shows all effects, Standard tightens the budget, Challenge hides the effects.

## Customize

- `js/config.js`: island name and region, budgets, economics, difficulty, feature switches.
- `js/data.js`: every option, effect number, advisor line, quiz question, event, and reflection prompt.
- `css/style.css`: the palette is set in `:root` at the top.

The economics and ecology are simplified teaching models with hypothetical numbers, not predictive science.

## Classroom use

Instructors get a results CSV and full game file from Menu, Instructor panel. Teams can save and load game files, so play can span several class sessions. Progress also autosaves in the browser. See `docs/instructor-guide.md`.

## Files

```
index.html
css/style.css
js/config.js            instructor settings
js/data.js              content and numbers
js/avatars.js           SVG avatar generator
js/model.js             scoring, siting, validation
js/sim.js               ten-year simulation
js/scene-facilities.js  facility sprites
js/scene.js             animated island canvas, walking, villagers
js/npcs.js              townspeople, conversations, field spots
js/export.js            pitch page, CSV, Venn diagram
js/ui.js                phases, dashboard, interactions
js/main.js              entry point
```

## License

MIT, see `LICENSE`.
