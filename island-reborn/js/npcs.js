/* Island Reborn: the people of the island. Townspeople, conversations, field spots, and the shoreline cleanup quest.
   Every phase with a "consult" person needs a conversation. Answers give local knowledge and change community trust. */
(function () {
  const D = window.DATA, G = window.Model.Geo;
  const pol = (a, s, dx, dy) => { const p = G.P(a * Math.PI / 180, s); return { x: p.x + (dx || 0), y: p.y + (dy || 0) }; };
  const V = pol(12, 0.72);   // the settlement

  const N = {};
  const add = (id, o) => { o.id = id; N[id] = o; };

  // Advisors also live on the island. Their portraits come from data.js.
  add("elena", { name: D.advisors.elena.name, role: "Impact investor", av: D.advisors.elena.av, at: pol(-22, 0.93), spot: "the northeast landing" });
  add("marcus", { name: D.advisors.marcus.name, role: "Island engineer", av: D.advisors.marcus.av, at: pol(120, 0.42, 42, 24), spot: "the old resort site" });
  add("nia", { name: D.advisors.nia.name, role: "Conservation biologist", av: D.advisors.nia.av, at: pol(-64, 0.95), spot: "the mangrove shore" });
  add("iris", { name: D.advisors.iris.name, role: "Island council member", av: D.advisors.iris.av, at: { x: V.x + 2, y: V.y + 12 }, spot: "the village square" });
  add("kenji", { name: D.advisors.kenji.name, role: "Public-health physician", av: D.advisors.kenji.av, at: { x: V.x + 36, y: V.y - 2 }, spot: "the clinic hut" });
  add("tomas", { name: "Old Tomas", role: "Fisher", av: { skin: 4, hairStyle: "buzz", hairColor: 5, outfit: 2, acc: "sunhat", bg: "#dbe6f3" }, at: pol(62, 0.93, 0, 0), spot: "the southeast beach" });
  add("odette", { name: "Odette Pinder", role: "Farmer and gardener", av: { skin: 5, hairStyle: "puff", hairColor: 0, outfit: 6, acc: "none", bg: "#d9eadb" }, at: { x: V.x + 4, y: V.y - 44 }, spot: "the village garden" });
  add("rhea", { name: "Ms. Rhea Coakley", role: "Schoolteacher", av: { skin: 3, hairStyle: "wavy", hairColor: 1, outfit: 4, acc: "glasses", bg: "#e2dcf3" }, at: { x: V.x - 34, y: V.y - 2 }, spot: "the schoolhouse" });
  add("jo", { name: "Jo", role: "Island kid", av: { skin: 2, hairStyle: "short", hairColor: 3, outfit: 7, acc: "none", bg: "#f6e6c4" }, at: pol(-100, 0.5), spot: "the hillside path" });

  // Topics: keyed by phase id. Each option can carry trust (respect shown) and a tip (local knowledge shown in the phase).
  const T = (say, opts) => ({ say, opts });
  const o = (t, say, trust, tip) => ({ t, say, trust, tip });

  N.jo.topics = { name: T("You're the resort people! Everybody says 'the Cay', but the old-timers say it used to have a real name. What are you going to call it?", [
    o("What did the old-timers call it?", "Pelican Rest. Pelicans slept on the mangrove point before the bulldozers came.", 3, "Locals remember pelicans and mangroves. A name that honors them will feel honest."),
    o("What do you love about the island?", "The night beach, when the water glows blue. Please do not put floodlights on it!", 3, "Glowing night water is a local treasure. Protect the dark."),
    o("We'll pick whatever guests will love.", "Oh. So it's for tourists.", -2, null)]) };
  N.elena.topics = {
    concept: T("The board wants a number. How many guests a year can this island really carry?", [
      o("What do other ecolodges run at?", "Most small ecolodges host 10 to 40 thousand guests. Beyond that, costs and pressure climb fast.", 2, "Small ecolodges often host 10 to 40 thousand guests a year. Growth beyond that raises costs and pressure quickly."),
      o("Can we charge more for fewer guests?", "You can. Guests pay premiums for rare experiences, and visible caps are a selling point.", 2, "Premium lodging plus visitor caps can earn more per guest while easing pressure."),
      o("Just maximize revenue.", "Investors like that. Reefs and neighbors do not.", -2, null)]),
    tbl: T("Three circles, one overlap. Which one worries you most?", [
      o("Whichever is weakest.", "Right. Lifting the weakest circle raises the overlap more than polishing the strongest.", 2, "Fix your weakest circle first. It lifts the overlap the most."),
      o("How do investors judge this?", "More and more, on all three. Impact investors ask for evidence, not slogans.", 2, "Impact investors want evidence on people, planet, and profit together."),
      o("Profit, obviously.", "Profit keeps the doors open. A resort that hollows out the other two rarely lasts.", -1, null)]) };
  N.odette.topics = {
    water: T("Rain is our bank account. We catch it off every roof, and by May the tanks run low.", [
      o("How do you make it last?", "Covered tanks, no leaks, and watering at dawn. Small habits add up.", 3, "Covered cisterns and leak control stretch rainwater through the dry season."),
      o("Why not just drill wells?", "My uncle did. Two summers later his tap ran salty. Pump too hard and the sea moves in.", 3, "Over-pumped wells pull in salt water. Locals have already lost wells this way."),
      o("We'll import water by boat.", "Every day? Through a hurricane season?", -1, null)]),
    waste: T("Nothing goes to waste in my garden. Scraps, shells, fish bones: it all comes back as soil.", [
      o("Could a resort do that at scale?", "With a proper digester, yes. You will need people to run it, and I know who.", 3, "Composting and a biodigester turn kitchen scraps into soil and create local jobs."),
      o("What about plastic and glass?", "Bottles come in by boat and pile up. Ask Tomas about the beaches.", 3, "Packaging arrives by boat and piles up. Cut it at the supplier before it lands."),
      o("Can't you just burn it?", "Smoke drifts over the school. We tried that once.", -1, "Open burning drifts over the village and the school. Neighbors oppose it.")]) };
  N.tomas.topics = {
    food: T("Three generations of my family fished this bank. Lately the conch are small and the grouper are gone.", [
      o("Would a catch quota help?", "If we set it ourselves, yes. If outsiders set it, people will cheat.", 4, "Community-set catch limits work better than rules handed down from outside."),
      o("Could your co-op supply the kitchens?", "Fresh fish twice a week, gladly. But it has to be fair pay, or I cannot crew the boat.", 3, "A fishers' co-op needs fair, steady pricing to work."),
      o("Fishing here is over. Time to move on.", "Say that to my face again and see how the tide treats you.", -4, null)]),
    climate: T("That surge in '19 put three feet of water through the church. The old mangrove point held better than any wall.", [
      o("Where does the water come in worst?", "Low ground by the north beach and the lagoon. Anything built there gets wet.", 3, "The north beach and lagoon point flood first."),
      o("Would a seawall protect the shore?", "The wall at the old resort scoured the beach in a season. The sand went out with the next storm.", 3, "Seawalls scour beaches. The old resort wall already did."),
      o("It will not happen again.", "That is what they said before.", -3, null)]) };
  N.marcus.topics = {
    energy: T("Diesel arrives by barge and the price swings like a pendulum. Every outage costs money.", [
      o("What is the best mix for an island?", "Solar with batteries carries most of it. Wind fills gaps. Cut demand first with shade and airflow.", 3, "Efficient design plus solar and storage covers most island demand. Cutting demand is cheapest."),
      o("Is diesel really that bad?", "It is the easy button. Loud, dirty, and painful when fuel spikes. Keep it as backup at most.", 2, "Diesel is a price and outage risk. At most, keep it as backup."),
      o("Just pick the cheapest.", "Cheapest to build is rarely cheapest to run.", -1, null)]),
    transport: T("Every guest has to get here and back. Most of your footprint may sit in that one decision.", [
      o("What about a private runway?", "It clears a long strip of habitat and burns fuel by the barrel. It wrecks the footprint.", 2, "A runway clears a long strip of habitat and dominates the footprint."),
      o("Are electric ferries realistic?", "On short island routes, yes. Slower than a jet, but the crossing becomes part of the trip.", 3, "Electric ferries suit short island routes, and the slow crossing becomes part of the experience."),
      o("Speed matters most.", "Then expect a bigger footprint, and own it.", -1, null)]),
    map: T("Read the map the way a storm would. High ground, old scars, and stay off the nurseries.", [
      o("Where should critical services go?", "High and dry. Water, power, clinic, housing: keep them above the surge.", 3, "Put water, power, clinic, and housing on higher ground."),
      o("Is the old resort site useful?", "Already cleared, already scarred. Building there spares fresh forest.", 3, "The old resort site is already cleared. Reuse it before clearing forest."),
      o("What about the mangrove point?", "Leave it alone. It is a nursery and a storm buffer.", 2, "Keep buildings away from the mangrove nursery.")]) };
  N.iris.topics = {
    housing: T("Half our young people left for work on the mainland. Give them a reason and a roof and they will come home.", [
      o("What would they need?", "A fair wage, a place for a family, and a say in how it runs.", 4, "Fair pay, family housing, and a real voice would bring young people home."),
      o("Could staff live on the mainland?", "Two hours on a boat each way? Nobody keeps a job like that.", 2, "Long commutes make jobs hard to keep."),
      o("We will hire from the mainland.", "Then this island gets the mess and none of the money.", -4, null)]),
    midpoint: T("Half the plan is done and the council is watching. How are you taking us into account?", [
      o("What worries the town most?", "Water, wages, and whether you listen when things go wrong.", 3, "The town's top worries are water, wages, and being heard."),
      o("We are on track.", "Good. Show us the numbers.", 1, null),
      o("It is too early to talk about this.", "The bulldozers said that too.", -3, null)]) };
  N.kenji.topics = { health: T("Mosquitoes, heat, and dive accidents: that is what I treat. The nearest hospital is ninety minutes away by air.", [
    o("What matters most for prevention?", "Clean water and drainage. Half of what fills the clinic starts with standing water.", 3, "Standing water breeds mosquitoes. Fix drainage before you fog."),
    o("Would fogging help?", "For a week. It also kills pollinators and fish fry. Drain and treat breeding sites instead.", 3, "Fogging kills pollinators and fish fry. Target breeding sites."),
    o("Guests will bring their own doctors.", "Unlikely, and staff need care too.", -2, null)]) };
  N.nia.topics = {
    habitats: T("Every habitat here is wounded, but they are linked: runoff, nursery, reef. Where would you start?", [
      o("Why balance them?", "The weakest link limits the chain. Reef fish need mangroves, and mangroves need clean water.", 3, "Balance restoration across all four habitats. The weakest one limits the rest."),
      o("Which is most urgent?", "Mangroves. Modest cost per acre, and they buffer storms too.", 3, "Mangroves deliver storm protection and nursery habitat for a modest cost."),
      o("Just do the reef, it is prettier.", "Pretty and fragile. Without nurseries it will not refill.", -2, null)]),
    species: T("Pick a species that needs everything. If it thrives, we did it right.", [
      o("What makes a good indicator?", "It uses many habitats and reacts fast when one fails.", 2, "A good indicator depends on several habitats and reacts quickly to damage."),
      o("Which is hardest to protect?", "The crocodile, because it scares people. The tarpon, because its nurseries are hidden. All need guest rules.", 2, "Pick a species you can also teach guests about."),
      o("Whichever looks cutest.", "Cute is fine if you learn its needs.", 0, null)]) };
  N.rhea.topics = {
    earthcharter: T("We teach the Earth Charter's four pillars at the school. The kids recite them better than the adults.", [
      o("How do kids learn it best?", "By doing: monitoring the beach, mapping the reef, presenting to the council.", 4, "Learning by doing beats lectures: monitoring, mapping, and presenting."),
      o("What should the resort do for the community?", "Share power, not just paychecks. Give us seats, data, and training.", 4, "Give residents seats, data, and training, not just jobs."),
      o("The resort will handle the education.", "Without us? Then it is outreach in name only.", -3, null)]),
    footprint: T("My class calculated the island's footprint last year. Boat trips were the biggest bar, then imported food.", [
      o("What surprised the kids?", "That fewer long trips mattered more than recycling. Big levers first.", 3, "Fewer long trips and imported goods matter more than small habits."),
      o("How do we cut it?", "Avoid, reduce, then offset. Offsets come last.", 3, "Avoid and reduce first. Offset only what remains."),
      o("Offsets fix everything.", "Not on their own. They cannot replace cuts.", -2, null)]) };

  const consultOf = { name: "jo", concept: "elena", water: "odette", food: "tomas", energy: "marcus", waste: "odette", transport: "marcus", housing: "iris", health: "kenji", midpoint: "iris", habitats: "nia", species: "nia", climate: "tomas", earthcharter: "rhea", footprint: "rhea", map: "marcus", tbl: "elena" };
  D.phases.forEach(p => { if (consultOf[p.id]) p.consult = consultOf[p.id]; });

  // Special topic: the shoreline cleanup reward
  N.tomas.debris = T("You cleaned the whole shoreline? Bottles, nets, cans... the tide brings it back, but nobody ever picked it up before.", [
    o("Where does most of it come from?", "Supply boats and the old resort. Cut the packaging at the source and the beaches stay clean.", 4, "Cleanups show how much packaging arrives by boat. Cut it at the source.")]);

  const chat = {
    tomas: ["The reef will tell you the truth, if you look.", "Wind's from the south. Good day to be on the water."],
    odette: ["Come by the garden at dawn. Nothing beats the first tomatoes.", "You look like you could use a mango."],
    rhea: ["The kids are drawing your resort. Some of them are surprisingly critical.", "Ask the children. They notice everything."],
    jo: ["Race you to the beach! Just kidding, I saw a turtle there yesterday.", "Have you seen the old bulldozer? It is kind of scary."],
    iris: ["The council meets Thursday. Bring your answers.", "People here remember promises for a very long time."],
    kenji: ["Drink water. Seriously. It fixes half of what I see.", "If you hear an alarm, go to the clinic."],
    marcus: ["Numbers first. Then the drawings.", "I can build almost anything. Whether I should is your question."],
    nia: ["Look closely at the roots. That is a nursery.", "Every animal here is a clue."],
    elena: ["Investors are patient with evidence, not with excuses.", "Show me the plan, and show me the risks."]
  };
  const barks = {
    tomas: (m) => m.zq.reef > 65 ? "The parrotfish are back on the reef. I counted a dozen." : m.zq.reef < 35 ? "Reef is mostly rubble out there now." : null,
    odette: (m) => m.wq > 70 ? "Pond ran clear this week. First time in years." : null,
    nia: (m) => m.zq.mangrove > 65 ? "Those saplings are taking. Look, tiny fish in the roots." : m.zq.mangrove < 30 ? "The mangrove edge is still bare." : null,
    iris: (m) => m.comm > 70 ? "People are talking about you, and mostly kindly." : m.comm < 40 ? "Folks are uneasy. Listen more." : null,
    marcus: (m) => m.renewShare > 0.7 ? "The microgrid is humming nicely." : null,
    elena: (m) => m.profit > 15 ? "The numbers look investable." : m.profit < 0 ? "The numbers do not close yet." : null,
    kenji: (m) => m.health > 70 ? "Clinic is quiet, which is exactly how I like it." : null
  };

  // Field spots: inspect for a live reading of the island
  const spots = [
    { id: "pond", at: pol(15, 0.35, 0, 38), icon: "🧪", label: "Water test kit", text: (m) => `Clarity reading: ${Math.round(m.zq.watershed)} of 100. ${m.zq.watershed > 65 ? "The pond runs clear and reeds line the edge." : m.zq.watershed > 40 ? "Cloudy with algae at the edges." : "Muddy and green. Runoff from bare ground is washing straight in."}` },
    { id: "mangrove", at: pol(-42, 0.98), icon: "🌱", label: "Nursery pool", text: (m) => `Mangrove quality: ${Math.round(m.zq.mangrove)} of 100. ${m.zq.mangrove > 65 ? "Silver fry dart between the roots." : m.zq.mangrove > 40 ? "A few juveniles hide in the roots." : "Bare mud and stumps. Almost nothing lives here."}` },
    { id: "reef", at: pol(105, 0.97), icon: "🪸", label: "Reef viewpoint", text: (m) => `Reef quality: ${Math.round(m.zq.reef)} of 100. ${m.zq.reef > 65 ? "Color everywhere, and schools of fish." : m.zq.reef > 40 ? "Pale patches with some live coral." : "Gray rubble with few fish."}` },
    { id: "rubble", at: pol(120, 0.42, -38, -8), icon: "🧱", label: "Rubble pile", text: (m) => m.flags.decon ? "Sorted piles of concrete and steel wait to be reused in your foundations." : "Broken concrete and rusting rebar, about two thousand tons. It leaches into the ground and blocks regrowth." },
    { id: "nest", at: pol(195, 0.97), icon: "🌙", label: "Nesting beach", text: (m) => `Dark-sky and dune check. ${(m.flags.darksky) ? "Shielded lights keep the beach dark for nesting animals." : "Nothing controls the lighting yet. Bright lights here would disorient hatchlings."}` },
    { id: "board", at: { x: V.x - 58, y: V.y + 30 }, icon: "📌", label: "Village notice board", text: (m) => `Community pulse: ${Math.round(m.comm)} of 100. ${m.comm > 65 ? "Notices thank the project for local hiring." : m.comm > 40 ? "A petition asks for more say in decisions." : "Angry notes cover the board."}` }
  ];

  // Shoreline debris to collect
  const debris = [-150, -118, -8, 30, 75, 128, 162, -178].map((a, i) => { const p = pol(a, 0.955); return { id: "d" + i, x: p.x, y: p.y, type: i % 3 }; });


  // ---------- Tour topics ----------
  const S0 = { x: V.x - 50, y: V.y + 62 };
  N.iris.topics.w_iris = T("Welcome to Pelican Cay. I am Iris, from the island council. Two things to know: a gold ! over someone means they have something to tell you, and a ? means you can report back. What people tell you shapes what we will let you build.", [
    o("What do you need from us?", "Listen, and keep your word. Read the notice board next, and see how the town feels.", 2, null),
    o("Can you show me around?", "The reef is south, the mangroves northeast, the old resort southwest. Talk to anyone you see.", 1, null)]);
  N.jo.topics.w_jo = T("Whoa, you are new! I saw a turtle track on the beach yesterday. Want a secret? People here like it when you pick up litter.", [
    o("Thanks, Jo. Where is the litter worst?", "Along the beaches, everywhere. Just walk over the sparkly stuff.", 1, null),
    o("What is the island like at night?", "The water glows blue near the mangroves. Please do not ruin it.", 2, null)]);
  const tutorial = [
    { id: "move", text: "Walk around with the arrow keys or WASD. You can also click or tap the map.", target: null },
    { id: "iris", text: "Press E to talk to Iris Sutherland in the village square.", npc: "iris" },
    { id: "board", text: "Inspect the village notice board. Stand next to it and press E.", spot: "board" },
    { id: "debris", text: "Pick up a piece of litter on the beach by walking over the sparkle.", debris: "d3" },
    { id: "jo", text: "Say hello to Jo on the hillside path.", npc: "jo" }
  ];

  // ---------- Side quests (they open as the plan progresses) ----------
  const acc = (t, say) => ({ t, say, accept: true }), dec = (t, say) => ({ t, say, decline: true });
  const quests = [
    { id: "pond", title: "Clear the pond", giver: "odette", unlock: s => !!s.done.water, teaser: "Unlocks the wetland buffer strip",
      offer: T("The pond has been cloudy since the bulldozers came. Would you test the water for me?", [acc("Happy to. I will read the test kit.", "Thank you. The kit is by the pond. Come back and tell me what it says."), dec("Not right now.", "The pond will still be here.")]),
      steps: [{ type: "inspect", spot: "pond", text: "Read the water test kit by the pond." },
        { type: "talk", npc: "odette", text: "Report to Odette Pinder.", node: T("So what did the kit say? How do we clear it?", [
          { t: "Plant a reed buffer and stop bare-soil runoff.", say: "Reeds it is. They filter the water and shelter frogs.", trust: 3, bonus: { wq: 3 } },
          { t: "Dredge the pond.", say: "Dredging stirs up everything. Risky, but we can try.", trust: 0, bonus: { wq: -1 } },
          { t: "Leave it alone.", say: "Then it stays cloudy.", trust: -1, bonus: {} }]) }], reward: { kp: 10 } },
    { id: "engineer", title: "Rubble census", giver: "marcus", unlock: s => !!s.done.energy, teaser: "Unlocks the rubble reuse loop in Waste",
      offer: T("Before the next phase, could you assess the rubble at the old resort site? I need to know what is reusable.", [acc("I will take a look.", "Good. The pile is beside the old shell. Report back when you have seen it."), dec("Maybe later.", "It is not going anywhere.")]),
      steps: [{ type: "inspect", spot: "rubble", text: "Inspect the rubble pile at the old resort site." },
        { type: "talk", npc: "marcus", text: "Report to Marcus Bell.", node: T("What is your call: reuse it or haul it away?", [
          { t: "Crush and reuse it on site.", say: "Cheaper and greener. I will draw up a loop.", trust: 3, bonus: { bio: 1 } },
          { t: "Haul it away to be safe.", say: "The expensive way, and it burns fuel. But it is safe.", trust: 0, bonus: {} },
          { t: "Bury it under the new build.", say: "Buried rebar leaches for decades. No.", trust: -2, bonus: { wq: -1 } }]) }], reward: { kp: 10 } },
    { id: "fever", title: "Fever alert", giver: "kenji", unlock: s => !!s.done.health, teaser: "Unlocks heat and vector-safe cool refuges in Climate",
      offer: T("There is a stagnant ditch by the village where mosquitoes breed. Look at it and tell me what to do.", [acc("I will go and see.", "The ditch runs behind the village houses. Tell me what you think."), dec("Not now.", "Please do not wait for the rainy season.")]),
      steps: [{ type: "inspect", spot: "ditch", text: "Inspect the drainage ditch beside the village." },
        { type: "talk", npc: "kenji", text: "Report to Dr. Watanabe.", node: T("What did you find, and what do we do about it?", [
          { t: "Regrade it to drain, and stock larvae-eating fish.", say: "Exactly. Fix the water, not the symptoms.", trust: 3, bonus: { health: 3 } },
          { t: "Spray it.", say: "Quick, but it kills the good insects too.", trust: 0, bonus: { health: 1, bio: -1 } },
          { t: "Ignore it.", say: "Then I will see you in the clinic.", trust: -3, bonus: {} }]) }], reward: { kp: 10 } },
    { id: "council", title: "Town meeting", giver: "iris", unlock: s => !!s.done.housing, teaser: "Unlocks the binding community charter in the Earth Charter",
      offer: T("The council wants a town meeting before ground is broken. Would you gather what people think, and present a plan?", [acc("Yes. I will listen to them first.", "Start with Odette, then Tomas, then Ms. Coakley. Come back to me last."), dec("We are too busy.", "The bulldozers said that too.")]),
      steps: [
        { type: "talk", npc: "odette", text: "Hear Odette Pinder's concerns.", node: T("Water and food. If the resort takes our rain or our fish, we lose.", [{ t: "We will protect both.", say: "Then we can talk.", trust: 2, bonus: {} }, { t: "I will pass that along.", say: "Please do more than pass it along.", trust: 0, bonus: {} }]) },
        { type: "talk", npc: "tomas", text: "Hear Old Tomas's concerns.", node: T("Fair prices for fish, and a seat at the table where the rules get made.", [{ t: "You will have both.", say: "I will hold you to it.", trust: 2, bonus: {} }, { t: "Seats are limited.", say: "Then so is my patience.", trust: -2, bonus: {} }]) },
        { type: "talk", npc: "rhea", text: "Hear Ms. Coakley's concerns.", node: T("Jobs for the kids that do not mean leaving the island, and a real role in the monitoring.", [{ t: "I will make sure they have both.", say: "The children will be watching.", trust: 2, bonus: {} }, { t: "That is not a resort decision.", say: "Everything you build is a decision about them.", trust: -2, bonus: {} }]) },
        { type: "talk", npc: "iris", text: "Present your plan to Iris Sutherland.", node: T("So, what do you promise the town?", [
          { t: "Local hiring first, and open books every year.", say: "That is a promise I can take to the council.", trust: 4, bonus: { comm: 4 } },
          { t: "Profit sharing through a community trust.", say: "That could work, if the trust has real authority.", trust: 3, bonus: { comm: 3, empl: 1 } },
          { t: "A statement of good intentions.", say: "Words. The council will not accept words.", trust: -3, bonus: {} }]) }], reward: { kp: 15 } },
    { id: "turtle", title: "Night watch", giver: "nia", unlock: s => !!s.done.habitats, teaser: "Unlocks turtle-safe dune restoration in Climate",
      offer: T("Since the restoration began I have seen tracks on the nesting beach. Could you survey the beach and the nursery pool for me?", [acc("Happy to. I will check both.", "Thank you. Inspect the nesting beach and the mangrove nursery pool, then come back."), dec("Not right now.", "Do come back. The season is short.")]),
      steps: [{ type: "inspect", spot: "nest", text: "Inspect the nesting beach on the west shore." },
        { type: "inspect", spot: "mangrove", text: "Inspect the mangrove nursery pool in the northeast." },
        { type: "talk", npc: "nia", text: "Report to Dr. Okafor.", node: T("So what did you find? What should we protect first?", [
          { t: "Keep the nesting beach dark and quiet.", say: "Agreed. Dark skies are the cheapest turtle protection there is.", trust: 3, bonus: { bio: 2 } },
          { t: "Protect the mangrove nursery first.", say: "Nurseries feed the whole system. Good call.", trust: 3, bonus: { bio: 1, resil: 1 } },
          { t: "Fence off both areas.", say: "Fences fragment habitat. But you are thinking about protection.", trust: 0, bonus: {} }]) }], reward: { kp: 12 } },
    { id: "youth", title: "Youth rangers", giver: "rhea", unlock: s => !!s.done.earthcharter, teaser: "Unlocks a student-run footprint audit",
      offer: T("The children want their own monitoring team. Would you meet Jo, and see the reef with them?", [acc("I would love to.", "Jo is on the hillside path. Then look at the reef from the viewpoint, and come back to me."), dec("Maybe later.", "The kids will be disappointed.")]),
      steps: [
        { type: "talk", npc: "jo", text: "Talk to Jo on the hillside path.", node: T("I want to count fish! Can I be a ranger?", [{ t: "Yes, you can join the survey team.", say: "Really?! I will bring a notebook!", trust: 3, bonus: {} }, { t: "Maybe when you are older.", say: "Oh. Okay.", trust: -2, bonus: {} }]) },
        { type: "inspect", spot: "reef", text: "Look at the reef from the viewpoint." },
        { type: "talk", npc: "rhea", text: "Report to Ms. Coakley.", node: T("What do you think? Should the kids monitor the reef?", [
          { t: "Fund a youth ranger program.", say: "That will change how they see this island.", trust: 4, bonus: { comm: 2 } },
          { t: "A one-off field trip is enough.", say: "A start. But I hoped for more.", trust: 1, bonus: {} },
          { t: "It is too much responsibility.", say: "Children handle more than you think.", trust: -2, bonus: {} }]) }], reward: { kp: 12 } }
  ];

  // ---------- Reactions: townspeople notice what you built ----------
  const has = (s, g, id) => (s.sel[g] || []).indexOf(id) >= 0;
  const R = (id, npc, when, say, opts) => ({ id, npc, when, node: T(say, opts) });
  const op = (t, say, trust) => ({ t, say, trust });
  const reactions = [
    R("tomas_overwater", "tomas", s => s.done.concept && has(s, "lodging", "overwater"), "Bungalows out over the reef? Every pile you drive is a hole in the nursery.", [
      op("We will add mooring buoys and strict caps.", "Buoys help. Watch the pilings, though.", 1), op("The reef view sells rooms.", "So does the reef. Until it is gone.", -3), op("What would you do instead?", "Land-based cabins and let the reef stay quiet.", 1)]),
    R("tomas_jetski", "tomas", s => s.done.concept && has(s, "recreation", "jetski"), "Jet skis? My grandchildren swim in those waters.", [
      op("We will keep them away from the reef and shore.", "Then keep them far away.", 1), op("Guests love them.", "Guests do not live here.", -3)]),
    R("tomas_coop", "tomas", s => s.done.food && has(s, "food", "coop"), "The co-op got its first steady pay in years. The crews are talking.", [
      op("We are glad to work with you.", "So are we. Honestly.", 2)]),
    R("tomas_reef", "tomas", (s, m) => s.done.habitats && m.zq.reef > 65, "The parrotfish are back on the reef. I counted a dozen.", [
      op("The credit belongs to everyone.", "Even the tourists?", 1), op("It is only the start.", "Good. Keep going.", 1)]),
    R("odette_wells", "odette", s => s.done.water && has(s, "water", "wells"), "You drilled wells? Wait until August. My uncle's tap ran salty.", [
      op("We will monitor salinity and add cisterns.", "Do that before summer.", 1), op("Wells are cheap and fast.", "Cheap until they are salty.", -3)]),
    R("odette_compost", "odette", s => s.done.waste && has(s, "waste", "compost"), "I saw the biodigester going in. Finally, someone who thinks like a gardener!", [op("It was your idea.", "I will bring the first compost.", 2)]),
    R("iris_mainland", "iris", s => s.done.housing && has(s, "housing", "mainland"), "Housing your staff on the mainland? That is the money leaving the island.", [
      op("We will add island housing later.", "Later is not a plan.", 1), op("It keeps costs down.", "Costs for you. Not for us.", -4)]),
    R("iris_wage", "iris", s => s.done.housing && has(s, "housingPolicy", "livingwage"), "A living wage and local hiring. The council was very glad to see it.", [op("It is the right thing to do.", "Then people will trust you.", 3)]),
    R("iris_jet", "iris", s => s.done.transport && has(s, "transportOff", "jet"), "A runway across the forest? People will petition.", [
      op("We will reconsider.", "Please do.", 1), op("Guests will demand it.", "Guests will not vote here.", -3)]),
    R("kenji_spray", "kenji", s => s.done.health && has(s, "health", "spraying"), "Blanket fogging? It kills the pollinators and fish fry.", [
      op("We will switch to drainage.", "Good. Drain and treat.", 1), op("It is fast.", "So is the harm.", -3)]),
    R("kenji_clinic", "kenji", s => s.done.health && has(s, "health", "clinic"), "A proper clinic with telemedicine. I could not have asked for more.", [op("You will lead it.", "I would be proud to.", 2)]),
    R("nia_seawall", "nia", s => s.done.climate && has(s, "climate", "seawall"), "A concrete wall along the shore? The mangroves have nowhere to retreat to.", [
      op("Only where buildings need it.", "Keep it short and low.", 1), op("It protects the buildings.", "For now.", -2)]),
    R("nia_fence", "nia", s => s.done.habitats && has(s, "corridors", "fence"), "A fenced enclosure? Animals need to move.", [
      op("We will open it up.", "Thank you.", 1), op("It keeps guests safe.", "It keeps animals trapped.", -3)]),
    R("nia_link", "nia", s => s.done.habitats && has(s, "corridors", "mangroveReef"), "You linked the mangroves to the reef! That corridor will feed the whole system.", [op("Your survey made the case.", "Well, it worked.", 2)]),
    R("marcus_diesel", "marcus", s => s.done.energy && has(s, "energy", "diesel"), "Diesel in the mix. I would keep it as a backup, and only a backup.", [
      op("Backup only, I promise.", "Then we are fine.", 1), op("It is reliable.", "Until the price spikes.", -1)]),
    R("marcus_low", "marcus", (s, m) => s.done.map && m.exposed > 0, "Some critical services sit on low ground. A surge will find them.", [
      op("We will move them.", "Good.", 1), op("We will manage.", "Storms do not care about plans.", -2)]),
    R("rhea_school", "rhea", s => s.done.earthcharter && has(s, "ec1", "ec1b"), "The students will co-monitor wildlife with your scientists? They are over the moon.", [op("They will do real science.", "They will never forget it.", 3)]),
    R("elena_budget", "elena", (s, m) => s.done.footprint && m.over > 0, "You are over budget. The loan interest is eating your margin.", [
      op("We will trim next round.", "Do.", 0), op("The investors will cover it.", "Do not count on it.", 0)]),
    R("jo_name", "jo", s => s.done.name && s.resortName.length > 2, "You named it something! Do I get free ice cream?", [op("Maybe. What do you think of the name?", "I like it. It sounds like a place I would visit.", 1)])
  ];

  const spot2 = { id: "ditch", at: { x: V.x - 20, y: V.y + 48 }, icon: "💧", label: "Village ditch", text: (m, s) => (s && s.sel && s.sel.health && s.sel.health.indexOf("vector") >= 0) ? "The ditch has been regraded and stocked with larvae-eating fish. Quiet water, no whining mosquitoes." : "Stagnant water fills the ditch, green and buzzing. This is where the fevers start." };
  spots.push(spot2);

  window.NPCS = { N, V, spots, debris, chat, barks, consultOf, pol, spawn: S0, quests, reactions, tutorial };
})();
