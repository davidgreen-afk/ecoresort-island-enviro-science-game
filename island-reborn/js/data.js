/* Island Reborn: content and data.
   Every learning task from the Ecoresort assignment lives here so instructors can edit wording and numbers.
   Effect keys: cost (capital, $M), ops (annual, $M), rev ($ per visit), fp (footprint), bio, wq, comm, health,
   guest, resil, jobs, edu, empl, conn (habitat connectivity), cap (guests supported, thousands), dem (demand cut, 0-1),
   z (zone quality changes), v:true (scales with visitor volume), mit (recreation impact reduction). */
(function () {
  const D = {};

  D.majors = [
    { id: "bio",  label: "Biology or ecology",        icon: "🌿" },
    { id: "biz",  label: "Business or economics",     icon: "💼" },
    { id: "eng",  label: "Engineering",               icon: "🛠️" },
    { id: "ph",   label: "Public health",             icon: "🩺" },
    { id: "comm", label: "Communications or media",   icon: "📣" },
    { id: "edu",  label: "Education",                 icon: "🎓" },
    { id: "pol",  label: "Policy or political science", icon: "🏛️" },
    { id: "soc",  label: "Anthropology or social science", icon: "🤝" },
    { id: "hosp", label: "Hospitality management",    icon: "🛎️" },
    { id: "cs",   label: "Data or computer science",  icon: "📊" }
  ];

  D.roles = [
    "Chief Executive Officer",
    "Chief Sustainability Officer",
    "Chief Financial Officer",
    "Chief Operating Officer",
    "Director of Community Relations",
    "Director of Science and Restoration"
  ];

  // Avatar parts are indexes into arrays defined in avatars.js
  D.advisors = {
    nia:    { name: "Dr. Nia Okafor",      role: "Conservation biologist", av: { skin: 4, hairStyle: "curly", hairColor: 0, outfit: 0, acc: "glasses", bg: "#cfe8e4" } },
    marcus: { name: "Marcus Bell",         role: "Island engineer",        av: { skin: 3, hairStyle: "buzz",  hairColor: 0, outfit: 5, acc: "headset", bg: "#dbe6f3" } },
    elena:  { name: "Elena Vasquez",       role: "Impact investor",        av: { skin: 2, hairStyle: "bun",   hairColor: 1, outfit: 3, acc: "none",    bg: "#f6e6c4" } },
    iris:   { name: "Iris Sutherland",     role: "Island council member",  av: { skin: 5, hairStyle: "puff",  hairColor: 5, outfit: 1, acc: "none",    bg: "#f3dccf" } },
    kenji:  { name: "Dr. Kenji Watanabe",  role: "Public-health physician", av: { skin: 1, hairStyle: "short", hairColor: 0, outfit: 6, acc: "glasses", bg: "#d9eadb" } }
  };

  D.effMeta = {
    cost:  { label: "Capital",          fmt: v => "$" + v + "M",                bad: "pos" },
    ops:   { label: "Yearly cost",      fmt: v => "$" + v + "M/yr",             bad: "pos" },
    rev:   { label: "Revenue per visit", fmt: v => "$" + v,                     bad: "neg" },
    fp:    { label: "Footprint",        fmt: v => String(v),                    bad: "pos" },
    bio:   { label: "Biodiversity",     fmt: v => String(v),                    bad: "neg" },
    wq:    { label: "Water quality",    fmt: v => String(v),                    bad: "neg" },
    comm:  { label: "Community",        fmt: v => String(v),                    bad: "neg" },
    health:{ label: "Health",           fmt: v => String(v),                    bad: "neg" },
    guest: { label: "Guest happiness",  fmt: v => String(v),                    bad: "neg" },
    resil: { label: "Storm resilience", fmt: v => String(v),                    bad: "neg" },
    jobs:  { label: "Local jobs",       fmt: v => String(v),                    bad: "neg" },
    edu:   { label: "Learning",         fmt: v => String(v),                    bad: "neg" },
    empl:  { label: "Staff well-being", fmt: v => String(v),                    bad: "neg" },
    conn:  { label: "Connectivity",     fmt: v => String(v),                    bad: "neg" }
  };

  D.zones = [
    { id: "watershed", name: "Watershed and riparian buffers", short: "Watershed", icon: "💧", base: 30, k: 8,  color: "#3aa6c9",
      what: "Swales, native buffer strips, and repaired streams that filter runoff before it reaches the coast." },
    { id: "inland",    name: "Inland, terrestrial, and freshwater reserves", short: "Inland reserves", icon: "🌴", base: 25, k: 12, color: "#4c9a3f",
      what: "Native forest replanting, invasive plant removal, dune vegetation, and restored freshwater ponds." },
    { id: "mangrove",  name: "Mangrove, salt marsh, and estuary preserves", short: "Mangroves", icon: "🌱", base: 20, k: 10, color: "#2f6b4f",
      what: "Restored tidal flow, replanted mangroves, and protected nursery creeks." },
    { id: "reef",      name: "Marine and reef protected areas", short: "Reef", icon: "🪸", base: 40, k: 15, color: "#e0736a",
      what: "No-take zones, coral nurseries, seagrass recovery, and enforcement patrols." }
  ];

  // ---------- Decision groups ----------
  const G = [];

  G.push({ id: "lodging", phase: "concept", title: "Guest lodging", min: 1, max: 2,
    prompt: "Where will guests sleep? Pick up to two styles.",
    options: [
      { id: "cabins", name: "Elevated eco-cabins", icon: "🛖", d: "Low-rise cabins on stilts with natural ventilation and recycled-composite decks.",
        eff: { cost: 22, ops: 1.2, cap: 45, guest: 8, rev: 150, bio: -3, fp: 2 }, v: ["ops", "fp"] },
      { id: "treehouse", name: "Canopy villas", icon: "🌳", d: "Luxury villas on slim piles, threaded between existing trees.",
        eff: { cost: 30, ops: 1.5, cap: 30, guest: 12, rev: 320, bio: -5, fp: 2 }, v: ["ops", "fp"] },
      { id: "reuse", name: "Reuse the derelict hotel shell", icon: "🏗️", d: "Rebuild inside the concrete frame the last developer abandoned.",
        eff: { cost: 16, ops: 1, cap: 60, guest: 2, bio: 4, comm: 3, fp: 1 }, v: ["ops"], flag: "reuse",
        n: "Reusing an existing frame avoids new clearing and the carbon locked into fresh concrete." },
      { id: "overwater", name: "Overwater bungalows", icon: "🏝️", d: "The postcard image. Very profitable, very close to the reef.",
        eff: { cost: 34, ops: 1.6, cap: 40, guest: 14, rev: 420, bio: -9, wq: -4, fp: 3, z: { reef: -8, mangrove: -4 } }, v: ["ops", "fp"] }
    ] });

  G.push({ id: "recreation", phase: "concept", title: "Recreation you will sell", min: 2, max: 5,
    prompt: "What will guests do? Pick two to five activities. Impacts scale with guest numbers.",
    options: [
      { id: "snorkel", name: "Guided reef snorkeling", icon: "🤿", d: "Small groups with a naturalist.", eff: { rev: 90, bio: -3, guest: 6, fp: 1 }, v: ["bio", "fp"] },
      { id: "kayak", name: "Mangrove kayak tours", icon: "🛶", d: "Quiet paddling through nursery creeks.", eff: { rev: 70, bio: -2, guest: 6, comm: 2 }, v: ["bio"] },
      { id: "scuba", name: "Scuba diving", icon: "🫧", d: "Dive center and boat.", eff: { cost: 3, rev: 180, bio: -4, guest: 5, fp: 2 }, v: ["bio", "fp"] },
      { id: "jetski", name: "Jet skis and parasailing", icon: "🚤", d: "Loud, fast, and popular.", eff: { rev: 120, bio: -8, wq: -3, guest: 3, comm: -4, fp: 5 }, v: ["bio", "wq", "fp"] },
      { id: "fishing", name: "Catch-and-release sport fishing", icon: "🎣", d: "Guides with barbless hooks and quotas.", eff: { rev: 110, bio: -3, guest: 4, comm: 2, fp: 2 }, v: ["bio", "fp"] },
      { id: "watch", name: "Turtle and bird watching", icon: "🐢", d: "Dawn walks and dark-sky nights.", eff: { rev: 60, bio: -1, guest: 8, edu: 3, comm: 2 }, v: ["bio"] },
      { id: "coralgarden", name: "Citizen-science coral gardening", icon: "🪸", d: "Guests help grow and plant coral fragments.", eff: { cost: 2, rev: 80, bio: 3, guest: 7, edu: 4, z: { reef: 4 } } },
      { id: "spa", name: "Forest spa and wellness trails", icon: "🧘", d: "Massage huts and shaded walks.", eff: { cost: 5, rev: 140, bio: -2, guest: 7 }, v: ["bio"] },
      { id: "golf", name: "Nine-hole golf course", icon: "⛳", d: "Needs water, fertilizer, and a lot of cleared land.", eff: { cost: 18, rev: 150, bio: -12, wq: -10, guest: 4, fp: 6, z: { inland: -12 } }, v: ["fp"] },
      { id: "sail", name: "Sunset sailing", icon: "⛵", d: "Wind-powered evenings.", eff: { rev: 75, guest: 6, comm: 1, fp: 1 }, v: ["fp"] }
    ] });

  G.push({ id: "mitigation", phase: "concept", title: "How you limit recreation damage", min: 2, max: 5,
    prompt: "Every activity leaves marks. Pick the safeguards you will enforce.",
    options: [
      { id: "buoys", name: "Mooring buoys and no-anchor zones", icon: "⚓", d: "Boats tie up without dragging anchors across coral.", eff: { cost: 1.5, z: { reef: 3 } }, mit: 0.18 },
      { id: "caps", name: "Daily carrying-capacity permits", icon: "🎟️", d: "Hard caps on divers, paddlers, and trail users.", eff: { ops: 0.3, rev: -30, guest: -2 }, mit: 0.2 },
      { id: "reefsafe", name: "Reef-safe sunscreen and toxin-free amenities", icon: "🧴", d: "No oxybenzone, no microbeads.", eff: { cost: 0.5, guest: 1, wq: 2 }, mit: 0.1 },
      { id: "guides", name: "Certified naturalist guides, hired locally", icon: "🧭", d: "Trained island residents lead every trip.", eff: { ops: 1.2, jobs: 25, comm: 5, guest: 4 }, mit: 0.15 },
      { id: "seasonal", name: "Seasonal closures for nesting and spawning", icon: "📅", d: "Sensitive areas rest when animals need them.", eff: { rev: -25, bio: 2 }, mit: 0.15 },
      { id: "briefing", name: "Arrival briefing and code of conduct", icon: "📋", d: "Every guest learns the rules on day one.", eff: { cost: 0.2, edu: 3 }, mit: 0.1 },
      { id: "boardwalk", name: "Hardened trails and boardwalks", icon: "🪵", d: "Feet stay off dune plants and nesting ground.", eff: { cost: 3 }, mit: 0.12 }
    ] });

  G.push({ id: "water", phase: "water", title: "Fresh water", min: 1, max: 4,
    prompt: "Choose your supply and efficiency measures. Watch the coverage bar.",
    options: [
      { id: "cistern", name: "Rainwater cisterns", icon: "🛢️", d: "Roof catchment with covered storage sized for the dry season.", eff: { cost: 5, ops: 0.3, cap: 25, wq: 1, resil: 3, fp: 0.5 } },
      { id: "ro_solar", name: "Solar-powered reverse-osmosis plant", icon: "🏭", d: "Turns seawater into drinking water.", eff: { cost: 14, ops: 1.8, cap: 80, fp: 3, bio: -2, z: { reef: -3 } }, v: ["ops", "fp", "bio"],
        n: "Brine is saltier than seawater. Diffusers spread it out so reef and seagrass are not stressed." },
      { id: "wells", name: "Groundwater wells", icon: "🚰", d: "Cheap and fast to drill.", eff: { cost: 3, ops: 0.5, cap: 60, wq: -6, bio: -3, resil: -4, z: { inland: -4 } }, v: ["wq", "bio"],
        n: "Over-pumping lets seawater creep into the thin freshwater lens under the island (saltwater intrusion)." },
      { id: "greywater", name: "Greywater recycling with a constructed wetland", icon: "🌾", d: "Sink and shower water is cleaned by plants and reused.", eff: { cost: 9, ops: 0.8, dem: 0.2, wq: 4, edu: 2, z: { watershed: 3 } } },
      { id: "fixtures", name: "Low-flow fixtures and leak sensors", icon: "🚿", d: "The cheapest liter is the one you never use.", eff: { cost: 2, ops: 0.2, dem: 0.15, guest: -1 } }
    ] });

  G.push({ id: "food", phase: "food", title: "Food", min: 1, max: 4,
    prompt: "Where will your kitchens get food? Balance local supply, cost, and the sea.",
    options: [
      { id: "agro", name: "Regenerative agroforestry farm", icon: "🥭", d: "Fruit trees, vegetables, and soil-building crops.", eff: { cost: 8, ops: 1.2, cap: 35, bio: 3, comm: 4, jobs: 20, fp: -3, z: { inland: 3 } }, v: ["fp"], local: true },
      { id: "aqua", name: "Aquaponics greenhouse", icon: "🥬", d: "Fish and leafy greens share one recycling water loop.", eff: { cost: 10, ops: 1.5, cap: 20, jobs: 8, fp: 1, wq: 1 }, v: ["fp"], local: true },
      { id: "mari", name: "Restorative mariculture", icon: "🦪", d: "Oysters and seaweed that filter the water as they grow.", eff: { cost: 6, ops: 0.8, cap: 20, wq: 5, bio: 2, jobs: 10, comm: 3 }, local: true },
      { id: "coop", name: "Fishers' cooperative with catch limits", icon: "🐠", d: "Island fishers supply the kitchens under a quota.", eff: { cost: 2, ops: 1.5, cap: 30, comm: 9, jobs: 25, guest: 5, bio: -1 }, v: ["bio"], local: true },
      { id: "import", name: "Imported provisions by cargo ship", icon: "🚢", d: "Whatever the menu needs, whenever.", eff: { cost: 1, ops: 3, cap: 100, fp: 9, comm: -3 }, v: ["ops", "fp"] },
      { id: "foodwaste", name: "Menu planning and kitchen waste reduction", icon: "🍽️", d: "Buffets replaced by made-to-order plates.", eff: { cost: 1, dem: 0.15, fp: -1, edu: 1 }, v: ["fp"] }
    ] });

  G.push({ id: "energy", phase: "energy", title: "Energy", min: 1, max: 4,
    prompt: "Power the resort. Renewable share and coverage both matter.",
    options: [
      { id: "solar", name: "Solar arrays with battery storage", icon: "☀️", d: "Panels on roofs and cleared ground, batteries for the night.", eff: { cost: 24, ops: 0.8, cap: 60, fp: 1, bio: -2, resil: 3 }, v: ["fp"], renew: true,
        n: "Batteries shift daytime solar into the evening, which is when guests use the most power." },
      { id: "wind", name: "Small wind turbines", icon: "🌬️", d: "Ridge-line turbines, sited away from bird routes.", eff: { cost: 16, ops: 0.9, cap: 35, fp: 1, bio: -3 }, v: ["fp"], renew: true },
      { id: "biomass", name: "Biomass from removed invasive plants", icon: "🌿", d: "Cleared Australian pine and other invaders fuel a small plant.", eff: { cost: 12, ops: 1.6, cap: 25, bio: 3, fp: 3, comm: 2, jobs: 8, health: -2 }, v: ["fp"], renew: true },
      { id: "diesel", name: "Diesel generators", icon: "🛢️", d: "Cheap to install, reliable, and dirty.", eff: { cost: 4, ops: 3.5, cap: 100, fp: 11, health: -3, wq: -2, resil: -2 }, v: ["ops", "fp", "wq"] },
      { id: "tidal", name: "Tidal-current microturbines", icon: "🌊", d: "Turbines in the channel, quiet and steady.", eff: { cost: 26, ops: 1.2, cap: 30, fp: 0.5, guest: 3, bio: -1, z: { reef: -2 } }, renew: true },
      { id: "efficiency", name: "Passive cooling and efficient design", icon: "🏠", d: "Shade, cross-breezes, and light-colored roofs.", eff: { cost: 6, ops: -0.2, dem: 0.25, guest: 2, fp: -1 }, v: ["fp"] }
    ] });

  G.push({ id: "waste", phase: "waste", title: "Waste and wastewater", min: 1, max: 5,
    prompt: "The brief forbids simply shipping waste away or dumping it. Design a way to close the loop.",
    options: [
      { id: "compost", name: "Composting and biodigester", icon: "🍂", d: "Food scraps become soil and biogas.", eff: { cost: 7, ops: 0.8, cap: 45, fp: -2, comm: 2, jobs: 6 }, v: ["fp"] },
      { id: "recover", name: "Materials recovery and upcycling workshop", icon: "♻️", d: "Glass, metal, and plastic get a second life.", eff: { cost: 6, ops: 1, cap: 35, jobs: 12, comm: 4, edu: 2, fp: -1 }, v: ["fp"] },
      { id: "wetland_sew", name: "Constructed-wetland wastewater treatment", icon: "🪷", d: "Reed beds clean sewage and become bird habitat.", eff: { cost: 10, ops: 0.8, cap: 50, wq: 6, edu: 1, z: { watershed: 3 } } },
      { id: "wte", name: "Waste-to-energy gasifier", icon: "🔥", d: "Burns residual waste for heat and power.", eff: { cost: 18, ops: 1.5, cap: 80, health: -3, fp: 2 }, v: ["fp"] },
      { id: "decon", name: "Circular deconstruction of the derelict resort", icon: "🧱", d: "Sort the old rubble and reuse it in new foundations and paths.", eff: { cost: 6, bio: 3, comm: 3, z: { inland: 6 } }, site: true, flag: "decon" },
      { id: "ship", name: "Ship residual waste to the mainland", icon: "🚢", d: "Out of sight, out of mind.", eff: { cost: 0.5, ops: 2.5, cap: 100, fp: 8 }, v: ["ops", "fp"], violates: "The client brief does not allow shipping waste to another location." },
      { id: "landfill", name: "Bury it in an on-island landfill", icon: "⛰️", d: "The fastest way to make it disappear.", eff: { cost: 2, ops: 0.5, cap: 100, wq: -10, bio: -6 }, v: ["wq"], violates: "The client brief does not allow dumping waste in a landfill." }
    ] });

  G.push({ id: "transportIsland", phase: "transport", title: "Getting around the island", min: 1, max: 3,
    prompt: "How will people and goods move on the island?",
    options: [
      { id: "eshuttle", name: "Electric shuttles and bikes", icon: "🚐", d: "Quiet, charged from your microgrid.", eff: { cost: 5, ops: 0.5, guest: 5, comm: 1, fp: 1 }, v: ["fp"] },
      { id: "walkways", name: "Boardwalk and trail network", icon: "🚶", d: "Walking is the default.", eff: { cost: 4, guest: 4, bio: -1, health: 2 } },
      { id: "carfree", name: "Car-free guest policy", icon: "🚫", d: "Guests park at the dock and walk or ride.", eff: { guest: -1, fp: -3, health: 2 }, v: ["fp"] },
      { id: "carts", name: "Gas-powered golf carts", icon: "🛺", d: "Cheap and convenient.", eff: { cost: 1, guest: 3, fp: 5, health: -1, comm: -1 }, v: ["fp"] }
    ] });

  G.push({ id: "transportOff", phase: "transport", title: "Between the island and elsewhere", min: 1, max: 3,
    prompt: "How do guests, staff, and supplies get to the island?",
    options: [
      { id: "efferry", name: "Electric fast ferry", icon: "⛴️", d: "Battery-electric, slower than a jet, gentler on the sea.", eff: { cost: 18, ops: 1.4, guest: 5, comm: 2, fp: 4 }, v: ["ops", "fp"] },
      { id: "sailcargo", name: "Sail-assisted cargo vessel", icon: "⛵", d: "Wind does most of the work for supplies.", eff: { cost: 9, ops: 1, comm: 2, fp: 2 }, v: ["fp"] },
      { id: "seaplane", name: "Biofuel seaplane shuttle", icon: "🛩️", d: "A 25-minute hop from the mainland.", eff: { cost: 12, ops: 2.5, guest: 9, rev: 90, bio: -2, fp: 7 }, v: ["ops", "fp", "bio"] },
      { id: "jet", name: "Private-jet airstrip", icon: "✈️", d: "A runway for high-end charters. It means clearing a long strip of land.", eff: { cost: 30, ops: 3, guest: 10, rev: 260, bio: -14, comm: -3, fp: 16 }, v: ["ops", "fp"] }
    ] });

  G.push({ id: "housing", phase: "housing", title: "Employee housing", min: 1, max: 2,
    prompt: "Where and how will employees live?",
    options: [
      { id: "village", name: "Elevated modular staff village", icon: "🏘️", d: "Solar roofs, shared courtyards, above the flood line.", eff: { cost: 12, empl: 10, comm: 3, resil: 2, fp: 0.5 } },
      { id: "adaptive", name: "Rehabilitated brownfield dormitories", icon: "🏚️", d: "Convert old worker barracks left by the last developer.", eff: { cost: 8, empl: 6, bio: 3, comm: 2 }, flag: "brownfieldHousing" },
      { id: "mainland", name: "Commuter housing on the mainland", icon: "🚢", d: "Cheap, but staff spend hours on the water each day.", eff: { cost: 3, ops: 1.4, empl: -6, comm: -6, fp: 4 }, v: ["ops", "fp"] },
      { id: "tents", name: "Seasonal tent camp", icon: "⛺", d: "Fast and inexpensive.", eff: { cost: 0.5, empl: -12, health: -5, bio: -4, comm: -4 } }
    ] });

  G.push({ id: "housingPolicy", phase: "housing", title: "Employment commitments", min: 0, max: 3,
    prompt: "Optional policies that shape daily life for staff. Up to three.",
    options: [
      { id: "garden", name: "Community garden and shared kitchen", icon: "🥕", d: "Staff and neighbors grow food together.", eff: { cost: 1, empl: 5, comm: 3, fp: -1 } },
      { id: "childcare", name: "Childcare and family housing", icon: "🧒", d: "Staff can bring their families.", eff: { cost: 3, ops: 0.5, empl: 8, comm: 5 } },
      { id: "livingwage", name: "Living wage and local-hire pledge", icon: "💵", d: "Priority for island residents at fair pay.", eff: { ops: 3, empl: 8, comm: 8, jobs: 30 }, v: ["ops"] },
      { id: "transit", name: "Free staff shuttle and bike share", icon: "🚲", d: "Getting to work costs nothing.", eff: { cost: 1, ops: 0.2, empl: 3, fp: -1 } }
    ] });

  G.push({ id: "health", phase: "health", title: "Public health", min: 2, max: 4,
    prompt: "Guests and staff need care. Choose up to four measures.",
    options: [
      { id: "clinic", name: "On-site clinic with telemedicine", icon: "🏥", d: "Nurse-led, with video links to specialists.", eff: { cost: 6, ops: 1.4, health: 12, comm: 4, jobs: 8, guest: 3 } },
      { id: "vector", name: "Integrated mosquito management", icon: "🦟", d: "Drain breeding sites, stock larvae-eating fish, no blanket spraying.", eff: { cost: 1, ops: 0.4, health: 7, bio: 1, wq: 1 } },
      { id: "waterlab", name: "Drinking-water and beach-water testing lab", icon: "🧪", d: "Daily tests posted publicly.", eff: { cost: 2, ops: 0.4, health: 6, wq: 2, edu: 1 } },
      { id: "rescue", name: "Marine rescue and dive-medicine team", icon: "🛟", d: "Trained responders for water emergencies.", eff: { cost: 4, ops: 1, health: 5, guest: 4, comm: 1 } },
      { id: "wellness", name: "Staff mental-health and wellness program", icon: "💚", d: "Counseling and recovery time.", eff: { cost: 1, ops: 0.6, health: 5, empl: 6 } },
      { id: "evac", name: "Air-evacuation agreement with a mainland hospital", icon: "🚁", d: "Serious cases reach a full hospital fast.", eff: { cost: 0.5, ops: 1, health: 5, guest: 3, resil: 3 } },
      { id: "vaccine", name: "Travel-health screening and vaccination clinics", icon: "💉", d: "Keeps outbreaks from arriving with guests.", eff: { cost: 1.2, ops: 0.3, health: 4, guest: 1 } },
      { id: "spraying", name: "Blanket pesticide fogging", icon: "☁️", d: "Kills mosquitoes quickly. Also kills many other things.", eff: { cost: 0.5, ops: 0.3, health: 3, bio: -6, wq: -3, comm: -2 } }
    ] });

  G.push({ id: "corridors", phase: "habitats", title: "Wildlife corridors", min: 1, max: 3,
    prompt: "How will animals move between habitats? Pick up to three.",
    options: [
      { id: "riparian", name: "Riparian greenway from uplands to coast", icon: "🌳", d: "A continuous vegetated strip along the stream.", eff: { cost: 3, conn: 22, z: { watershed: 2, inland: 2 } } },
      { id: "crossings", name: "Wildlife crossings and narrow roads", icon: "🛣️", d: "Culverts, rope bridges, and speed limits.", eff: { cost: 2, conn: 12, bio: 1 } },
      { id: "mangroveReef", name: "Mangrove, seagrass, and reef linkage", icon: "🐟", d: "No dredging and marked no-anchor lanes between nurseries and reef.", eff: { cost: 2.5, conn: 25, z: { mangrove: 2, reef: 2 } } },
      { id: "darksky", name: "Dark-sky lighting and low-glow paths", icon: "🌙", d: "Shielded, amber lights that protect nesting animals.", eff: { cost: 0.8, conn: 10, bio: 1, guest: 2 } },
      { id: "fence", name: "Fenced wildlife enclosure", icon: "🚧", d: "Keep the animals in one place and the guests out.", eff: { cost: 4, conn: -15, bio: -2, guest: 2 } }
    ] });

  G.push({ id: "climate", phase: "climate", title: "Climate defenses", min: 1, max: 3,
    prompt: "Protect the island from sea-level rise and stronger storms. Pick up to three.",
    options: [
      { id: "livingShore", name: "Living shoreline", icon: "🌱", d: "Mangroves, oyster reefs, and dunes take the waves.", eff: { cost: 8, resil: 14, bio: 2, conn: 6, z: { mangrove: 4 } } },
      { id: "elevate", name: "Elevate critical buildings on piles", icon: "🏗️", d: "Water and power stay above the surge.", eff: { cost: 10, resil: 12 } },
      { id: "seawall", name: "Concrete seawall", icon: "🧱", d: "Hard armor along the beach.", eff: { cost: 14, resil: 8, bio: -4, conn: -8, guest: -3, z: { mangrove: -6 } },
        n: "Seawalls reflect wave energy, scour beaches, and block habitats from shifting inland as seas rise." },
      { id: "retreat", name: "No-build setbacks on low-lying land", icon: "↗️", d: "Leave the lowest ground for wetlands to migrate into.", eff: { cost: 1, resil: 9, bio: 3, guest: -1, z: { mangrove: 3 } } },
      { id: "greenstorm", name: "Green stormwater infrastructure", icon: "🌧️", d: "Rain gardens, swales, and permeable paths.", eff: { cost: 4, resil: 6, wq: 4, z: { watershed: 2 } } },
      { id: "earlywarn", name: "Early-warning system and storm shelter", icon: "📡", d: "Sirens, forecasts, and a shelter with supplies.", eff: { cost: 3, resil: 7, comm: 3, health: 3 } },
      { id: "coralnursery", name: "Heat-tolerant coral nursery", icon: "🪸", d: "Grow corals that better tolerate warm water.", eff: { cost: 5, resil: 5, edu: 1, z: { reef: 5 } } }
    ] });

  G.push({ id: "ec1", phase: "earthcharter", title: "Respect and care for the community of life", min: 1, max: 1, pillar: "I",
    prompt: "How will you teach and practice this pillar?",
    options: [
      { id: "ec1a", name: "Meet-the-island orientation and species guide", icon: "📖", d: "Every guest learns who lives here before they unpack.", eff: { cost: 0.5, edu: 4, comm: 1 } },
      { id: "ec1b", name: "School partnership: students co-monitor wildlife", icon: "🧑‍🏫", d: "Island students run monitoring transects with your scientists.", eff: { cost: 1.5, ops: 0.3, edu: 7, comm: 5, jobs: 3 } },
      { id: "ec1c", name: "Stewardship board for each reserve", icon: "🛡️", d: "Local caretakers with authority over reserve rules.", eff: { edu: 3, comm: 4, bio: 2 } }
    ] });
  G.push({ id: "ec2", phase: "earthcharter", title: "Ecological integrity", min: 1, max: 1, pillar: "II",
    prompt: "How will you teach and practice this pillar?",
    options: [
      { id: "ec2a", name: "Public reef and mangrove monitoring dashboard", icon: "📊", d: "Live data anyone on the island can read.", eff: { cost: 1, edu: 5, comm: 2 } },
      { id: "ec2b", name: "Community restoration days", icon: "🌴", d: "Monthly planting and cleanup days.", eff: { ops: 0.3, edu: 5, comm: 5, bio: 1 } },
      { id: "ec2c", name: "Precautionary review for every new build", icon: "🔍", d: "If harm is uncertain, wait and study.", eff: { cost: 0.3, ops: 0.2, bio: 2, edu: 3 } }
    ] });
  G.push({ id: "ec3", phase: "earthcharter", title: "Social and economic justice", min: 1, max: 1, pillar: "III",
    prompt: "How will you teach and practice this pillar?",
    options: [
      { id: "ec3a", name: "Scholarships and apprenticeships for island youth", icon: "🎓", d: "Paid training in ecology, hospitality, and engineering.", eff: { ops: 1, comm: 8, jobs: 10, edu: 3 } },
      { id: "ec3b", name: "Locally owned artisan and supplier market", icon: "🧺", d: "Guests buy from neighbors, not catalogs.", eff: { cost: 1, comm: 7, jobs: 15, guest: 4, rev: 30 } },
      { id: "ec3c", name: "Community trust funded by 2% of revenue", icon: "🤲", d: "Residents decide how the money is used.", eff: { ops: 1.2, comm: 9, edu: 1 }, v: ["ops"] }
    ] });
  G.push({ id: "ec4", phase: "earthcharter", title: "Democracy, nonviolence, and peace", min: 1, max: 1, pillar: "IV",
    prompt: "How will you teach and practice this pillar?",
    options: [
      { id: "ec4a", name: "Community council with binding board seats", icon: "🏛️", d: "Residents vote on major decisions.", eff: { comm: 9, edu: 2 } },
      { id: "ec4b", name: "Open town halls and public annual report", icon: "📢", d: "Numbers and plans are shared in the open.", eff: { cost: 0.3, comm: 6, edu: 3 } },
      { id: "ec4c", name: "Grievance and conflict-resolution process", icon: "🕊️", d: "A fair path for workers and neighbors to raise problems.", eff: { comm: 5, empl: 4, health: 1 } }
    ] });

  G.push({ id: "footprint", phase: "footprint", title: "Footprint reduction", min: 1, max: 4,
    prompt: "Shrink what is left. Pick up to four measures.",
    options: [
      { id: "bluecarbon", name: "Blue-carbon offsets from your own mangroves", icon: "🌿", d: "Count the carbon stored in the wetlands you restore.", eff: { cost: 2, fp: -6, z: { mangrove: 2 } } },
      { id: "plasticfree", name: "Plastic-free supply chain", icon: "🧃", d: "Suppliers ship in reusable crates.", eff: { cost: 1, ops: 0.5, fp: -3, wq: 2, guest: 1 }, v: ["ops", "fp"] },
      { id: "plantforward", name: "Plant-forward, seasonal menus", icon: "🥗", d: "Delicious and lighter on the land and sea.", eff: { cost: 0.2, fp: -4, guest: 1, health: 2 }, v: ["fp"] },
      { id: "dashboard", name: "In-room footprint dashboards and guest nudges", icon: "📱", d: "Guests see their own energy and water use.", eff: { cost: 1.5, fp: -3, edu: 3 }, v: ["fp"] },
      { id: "localprocure", name: "Local-first procurement rules", icon: "📍", d: "Buy on the island first.", eff: { ops: 0.5, fp: -3, comm: 4, jobs: 8 }, v: ["fp"] },
      { id: "trainpkg", name: "Low-carbon travel packages", icon: "🚆", d: "Rail, ferry, and bike from home to island.", eff: { cost: 0.8, fp: -4, guest: 1, rev: -15 }, v: ["fp"] },
      { id: "certify", name: "Third-party sustainable-tourism certification", icon: "🏅", d: "Independent audits and a public badge.", eff: { cost: 1, ops: 0.3, guest: 3, rev: 90, fp: -1, edu: 1 } }
    ] });


  // ---------- Options unlocked by trust or quests, and options that can be blocked ----------
  const gg = id => G.find(g => g.id === id), oo = (gid, id) => gg(gid).options.find(x => x.id === id);
  gg("water").options.push({ id: "commcistern", name: "Village cistern partnership", icon: "🏘️", d: "Share storage with the village so everyone has water in the dry season.", eff: { cost: 3, ops: 0.2, cap: 20, comm: 5, resil: 2 }, need: { trust: { npc: "odette", min: 3 } } });
  gg("food").options.push({ id: "heritage", name: "Heritage fishing-ground management", icon: "🎣", d: "Fishers and scientists co-manage the banks, with traditional closures.", eff: { cost: 1.5, ops: 0.6, cap: 15, comm: 6, bio: 2, jobs: 8 }, local: true, need: { trust: { npc: "tomas", min: 3 } } });
  gg("energy").options.push({ id: "solarcoop", name: "Community solar co-op", icon: "🤝", d: "Residents own shares in the panels and share the profits.", eff: { cost: 20, ops: 0.6, cap: 45, fp: 0.5, comm: 5, jobs: 6, resil: 3 }, v: ["fp"], renew: true, need: { trust: { npc: "marcus", min: 3 } } });
  gg("waste").options.push({ id: "rubbleloop", name: "Rubble reuse loop", icon: "🧱", d: "Marcus's method: crush the rubble on site into road base and foundations.", eff: { cost: 3, bio: 2, comm: 2, z: { inland: 3 } }, site: true, need: { quest: "engineer" } });
  gg("housingPolicy").options.push({ id: "lottery", name: "Island-first housing lottery", icon: "🎟️", d: "Residents get first pick of staff housing and family units.", eff: { cost: 1, empl: 5, comm: 7, jobs: 10 }, need: { trust: { npc: "iris", min: 3 } } });
  gg("health").options.push({ id: "chw", name: "Community health worker program", icon: "🧑‍⚕️", d: "Trained residents check on neighbors and staff.", eff: { cost: 1.5, ops: 0.7, health: 8, comm: 5, jobs: 10 }, need: { trust: { npc: "kenji", min: 3 } } });
  gg("corridors").options.push({ id: "wetlandbuffer", name: "Wetland buffer strip", icon: "🌾", d: "Reeds and shrubs between the pond and the coast, planted with Odette.", eff: { cost: 2, conn: 18, wq: 3, z: { watershed: 4 } }, need: { quest: "pond" } });
  gg("corridors").options.push({ id: "darkskyord", name: "Dark-sky ordinance co-written with Dr. Okafor", icon: "🌌", d: "A binding lighting rule for the whole island.", eff: { cost: 0.3, conn: 12, bio: 1, guest: 2 }, need: { trust: { npc: "nia", min: 3 } } });
  gg("climate").options.push({ id: "turtledune", name: "Turtle-safe dune restoration", icon: "🏖️", d: "Rebuild dunes with native plants, set back from the nesting beach.", eff: { cost: 3, resil: 8, bio: 3, z: { inland: 3 } }, need: { quest: "turtle" } });
  gg("climate").options.push({ id: "coolrefuge", name: "Heat and vector-safe cool refuges", icon: "🌴", d: "Shaded, drained gathering spots for hot days and storm surges.", eff: { cost: 2.5, resil: 3, health: 5, guest: 2 }, need: { quest: "fever" } });
  gg("climate").options.push({ id: "fisherplant", name: "Mangrove replanting with the fishers", icon: "🌱", d: "Old Tomas and the co-op plant and guard the shoreline.", eff: { cost: 3, resil: 6, comm: 4, jobs: 8, z: { mangrove: 4 } }, need: { trust: { npc: "tomas", min: 3 } } });
  gg("ec4").options.push({ id: "ec4d", name: "Binding community charter", icon: "📜", d: "The agreement from the town meeting becomes a legal charter.", eff: { cost: 0.3, comm: 12, edu: 3 }, need: { quest: "council" } });
  gg("footprint").options.push({ id: "auditkids", name: "Student-run footprint audit", icon: "🧑‍🎓", d: "Island students measure and publish the resort's footprint each year.", eff: { cost: 0.5, fp: -3, edu: 4, comm: 2 }, v: ["fp"], need: { quest: "youth" } });
  oo("food", "coop").block = { npc: "tomas", max: -3 };
  oo("mitigation", "guides").block = { npc: "iris", max: -3 };
  oo("food", "agro").block = { npc: "odette", max: -3 };

  D.groups = G;
  D.groupById = {};
  G.forEach(g => { D.groupById[g.id] = g; g.options.forEach(o => { o.group = g.id; }); });

  // Facilities placed on the map. "groups" lists the decision groups that determine how each facility looks.
  D.facilities = [
    { id: "lodging",   name: "Guest lodging",        icon: "🛏️", groups: ["lodging"] },
    { id: "energy",    name: "Energy plant",         icon: "⚡", groups: ["energy"] },
    { id: "water",     name: "Water works",          icon: "💧", groups: ["water"] },
    { id: "food",      name: "Food production",      icon: "🥕", groups: ["food"] },
    { id: "waste",     name: "Waste and recycling hub", icon: "♻️", groups: ["waste"] },
    { id: "transport", name: "Dock and terminal",    icon: "⚓", groups: ["transportOff"] },
    { id: "housing",   name: "Employee housing",     icon: "🏘️", groups: ["housing"] },
    { id: "clinic",    name: "Health post",          icon: "🏥", groups: ["health"] },
    { id: "edu",       name: "Learning center",      icon: "🎓", groups: ["ec1", "ec2", "ec3", "ec4"] }
  ];

  // Plots are positioned by polar coordinates around the island centre (angle in degrees, s = fraction of radius).
  D.plots = [
    { id: "p1",  name: "North Beach",      a: -90,  s: 0.78, elev: 0, t: ["coast"] },
    { id: "p2",  name: "Lagoon Point",     a: -45,  s: 0.80, elev: 0, t: ["coast", "mangrove"] },
    { id: "p3",  name: "East Ridge",       a: -10,  s: 0.62, elev: 2, t: ["interior", "forest"] },
    { id: "p4",  name: "Southeast Cove",   a: 40,   s: 0.80, elev: 1, t: ["coast"] },
    { id: "p5",  name: "South Beach",      a: 90,   s: 0.78, elev: 0, t: ["coast"] },
    { id: "p6",  name: "Southwest Bluff",  a: 138,  s: 0.72, elev: 2, t: ["coast"] },
    { id: "p7",  name: "West Flats",       a: 180,  s: 0.74, elev: 1, t: ["coast"] },
    { id: "p8",  name: "Northwest Point",  a: -135, s: 0.74, elev: 1, t: ["coast", "forest"] },
    { id: "p9",  name: "Highlands",        a: -70,  s: 0.32, elev: 2, t: ["interior", "forest"] },
    { id: "p10", name: "Meadow",           a: 180,  s: 0.36, elev: 1, t: ["interior"] },
    { id: "p11", name: "Pondside",         a: 78,   s: 0.40, elev: 1, t: ["interior", "pond"] },
    { id: "p12", name: "Old resort site",  a: 120,  s: 0.42, elev: 1, t: ["interior", "brownfield"] }
  ];

  D.species = [
    { id: "tarpon", name: "Atlantic tarpon", sci: "Megalops atlanticus", icon: "🐟",
      needs: { watershed: 0.15, inland: 0.15, mangrove: 0.4, reef: 0.3 },
      blurb: "A silver, air-breathing fish. Larvae drift from offshore spawning grounds into mangrove creeks. Adults patrol inlets and reef edges.",
      niche: [
        { zone: "reef", q: "What does a tarpon do in the marine and reef zone?",
          opts: ["Adults graze algae off coral heads", "Adults hunt schooling fish along reef edges and migrate offshore to spawn", "Adults bury themselves in sand all year"], a: 1,
          why: "Adult tarpon are predators of baitfish and travel offshore to spawn." },
        { zone: "mangrove", q: "Why do young tarpon need mangrove creeks?",
          opts: ["Sheltered shallows hide them from predators while they grow", "They avoid all shallow water", "They feed only on coral polyps"], a: 0,
          why: "Mangrove roots and calm water make a nursery with fewer predators." },
        { zone: "inland", q: "How can juvenile tarpon use freshwater ponds?",
          opts: ["They can gulp air at the surface, so low-oxygen, low-salinity pools are usable", "They cannot survive any drop in salinity", "They nest in the forest canopy"], a: 0,
          why: "Tarpon can breathe air and tolerate a wide range of salinity as juveniles." },
        { zone: "watershed", q: "How does the watershed affect tarpon?",
          opts: ["Clean, well-buffered runoff keeps nursery water clear and prevents algal blooms that use up oxygen", "Runoff has no effect because tarpon live offshore", "More runoff always improves nursery habitat"], a: 0,
          why: "Nutrient-rich runoff can trigger blooms that crash oxygen in shallow nurseries." }
      ] },
    { id: "turtle", name: "Green sea turtle", sci: "Chelonia mydas", icon: "🐢",
      needs: { watershed: 0.2, inland: 0.3, mangrove: 0.2, reef: 0.3 },
      blurb: "A grazer of seagrass that nests on dark, quiet beaches. It rests around reef ledges and depends on clear water.",
      niche: [
        { zone: "reef", q: "How do green turtles use the reef zone?",
          opts: ["They rest in reef ledges and feed on nearby seagrass and algae", "They eat live coral and destroy the reef", "They live only on land"], a: 0,
          why: "Adults are mostly herbivores that graze seagrass and algae and rest in reef shelter." },
        { zone: "mangrove", q: "Why do sheltered lagoons and mangrove edges matter?",
          opts: ["Seagrass beds there feed and hide young turtles", "Mangroves are toxic to turtles", "Turtles nest in mangrove roots"], a: 0,
          why: "Young turtles grow in calm seagrass habitat close to mangrove shorelines." },
        { zone: "inland", q: "What does a nesting female need from the land?",
          opts: ["Dark, vegetated dunes above the high-tide line, free of bright lights", "An underwater burrow", "Bright floodlights so hatchlings can find the sea"], a: 0,
          why: "Artificial light disorients hatchlings, which head for the brightest horizon." },
        { zone: "watershed", q: "How can watershed runoff harm turtles?",
          opts: ["Sediment and nutrients can smother seagrass and reef, cutting their food supply", "Runoff plants new seagrass automatically", "Watersheds only affect land animals"], a: 0,
          why: "Healthy watersheds keep the water clear enough for seagrass to grow." }
      ] },
    { id: "croc", name: "American crocodile", sci: "Crocodylus acutus", icon: "🐊",
      needs: { watershed: 0.25, inland: 0.3, mangrove: 0.35, reef: 0.1 },
      blurb: "A shy, salt-tolerant reptile of brackish creeks and lagoons. It nests on sandy banks and needs lower-salinity water for its young.",
      niche: [
        { zone: "reef", q: "How do crocodiles connect to the marine zone?",
          opts: ["They travel through shallow coastal water between lagoons, where boat strikes and dredging are risks", "They spend most of their lives on coral heads", "They migrate across oceans every year"], a: 0,
          why: "They use nearshore water as a corridor between lagoons and creeks." },
        { zone: "mangrove", q: "What is the mangrove zone to a crocodile?",
          opts: ["Core habitat for hunting fish, crabs, and birds in brackish water", "Water it avoids entirely", "A place to eat only plants"], a: 0,
          why: "Brackish creeks and mangrove lagoons are their main hunting ground." },
        { zone: "inland", q: "What do crocodiles need from inland areas?",
          opts: ["Sandy banks above flood level for nests, and lower-salinity ponds for hatchlings", "Nest sites in the open ocean", "Nothing at all from the land"], a: 0,
          why: "Hatchlings dehydrate in very salty water, so freshwater seeps and ponds matter." },
        { zone: "watershed", q: "Why does the watershed matter to crocodiles?",
          opts: ["Freshwater inflow dilutes estuary salinity, helping hatchlings survive", "Freshwater flow always kills hatchlings", "Watersheds do not affect estuaries"], a: 0,
          why: "Rain and stream flow set the salinity in nursery lagoons." }
      ] }
  ];

  D.pillarQuiz = [
    { text: "We protect all life, including species that are not useful to us.", a: "I" },
    { text: "We keep ecosystems healthy and use resources within their limits.", a: "II" },
    { text: "Everyone shares fairly in the benefits, with equal opportunity.", a: "III" },
    { text: "Decisions are made openly with those affected, and disputes are settled peacefully.", a: "IV" }
  ];
  D.pillarNames = {
    I: "Respect and care for the community of life",
    II: "Ecological integrity",
    III: "Social and economic justice",
    IV: "Democracy, nonviolence, and peace"
  };

  D.civicQuestions = [
    "Who is responsible for ensuring that we have clean air to breathe, clean water to drink, and healthy ecosystems to support life?",
    "What public policies promote or impede environmental sustainability?",
    "What are the tradeoffs between economic development and environmental sustainability, and who should decide?",
    "In light of the environmental challenges faced in underserved communities, what are your thoughts on social justice, equity, and economic opportunity?"
  ];

  D.objectives = [
    "I can conduct basic research on current environmental issues such as energy, food, fresh water, waste, human health, and habitat restoration.",
    "I can make evidence-based decisions about the degradation of natural capital in human-dominated systems.",
    "I can develop business proposals that treat environmental sustainability as a fundamental bottom-line consideration.",
    "I can collaborate in teams with effective communication and critical thinking.",
    "I can connect issues of civic importance to my daily life and decisions."
  ];

  // ---------- Phases ----------
  D.phases = [
    { id: "intro", title: "Welcome to the island", icon: "🏝️", advisor: "elena" },
    { id: "team", title: "Elect your Board of Directors", icon: "👥", advisor: "elena", type: "team",
      brief: ["Your consulting firm has won the pitch. Before anything is built, you need a board of three directors, and each seat should match a major.", "Build your avatars, then give each director a role. Directors with the right expertise will lead the decisions where their major matters most."] },
    { id: "name", title: "Name your resort", icon: "🪧", advisor: "elena", type: "name", expert: ["comm", "hosp"],
      brief: ["A name is the first promise a guest hears. Choose one that tells the truth about the island you are rebuilding."],
      insight: "The best resort names hint at place and purpose. If it could be any beach anywhere, keep looking.",
      science: "Branding matters in tourism because guests choose destinations on emotion first. Honest branding also protects you from greenwashing claims that erode trust.",
      reflect: "What does your resort's name promise, and how will you keep that promise?" },
    { id: "concept", title: "Concept: guests, lodging, and recreation", icon: "🌴", advisor: "elena", type: "groups", groups: ["lodging", "recreation", "mitigation"], visitors: true, expert: ["biz", "hosp", "soc"],
      brief: ["Investors want to know why people would fly to a rebuilt island, and how many will come. More guests means more revenue and more pressure on everything the island has left.", "Set your yearly guest number, choose your lodging and activities, then decide how you will limit the damage those activities cause."],
      insight: "Carrying capacity is a design choice, not a leftover. Set the guest number first, then check that lodging, water, and energy can actually carry it.",
      science: "Tourism brings jobs and tax revenue but can degrade reefs, mangroves, and water. Managers use carrying-capacity limits, permits, and trained guides to keep visitor impact within acceptable limits of change.",
      reflect: "Why will guests choose your resort, how many will visit each year, and how will you limit the damage from their activities?",
      quiz: { q: "What does carrying capacity mean for a tourism site?", opts: ["The most visitors a site can host without unacceptable damage to the environment or the experience", "The number of rooms a hotel can build", "How many boats fit in a marina"], a: 0, why: "It is a limit set by the ecosystem and the community, not by how much can be built." } },
    { id: "water", title: "Fresh water", icon: "💧", advisor: "marcus", type: "groups", groups: ["water"], expert: ["eng", "ph", "bio"],
      brief: ["Every guest uses water, and an island has no river to borrow from. Pick the mix that keeps taps running in a dry season without draining the freshwater lens or harming the reef."],
      insight: "Check the coverage bar. If supply falls short you will truck in emergency water, which costs money and adds to your footprint.",
      science: "Small islands rely on a thin lens of fresh groundwater floating on denser seawater. Pumping too fast pulls salt water upward, and desalination brine must be diffused so it does not stress nearby reef and seagrass.",
      reflect: "Which water sources did you choose, and how do they protect both guests and the ecosystem?",
      quiz: { q: "Why is over-pumping groundwater risky on a small island?", opts: ["Salt water can move into the freshwater lens", "It stops rainfall", "It cools the ocean"], a: 0, why: "This is called saltwater intrusion, and it can ruin a well for years." } },
    { id: "food", title: "Food", icon: "🥭", advisor: "iris", type: "groups", groups: ["food"], expert: ["hosp", "soc", "biz", "bio"],
      brief: ["Island families have fished these waters for generations. Your kitchens can either feed the community or compete with it."],
      insight: "Local food keeps money on the island, but only if catch limits and farming methods protect the sea and soil.",
      science: "Locally produced food cuts transport emissions and keeps money circulating, but overfishing and fertilizer runoff can harm the same ecosystems, so sourcing needs limits.",
      reflect: "Where will your food come from, and how does that choice affect the community and the environment?",
      quiz: { q: "Which choice best reduces food miles?", opts: ["Buying from local farms and fishers", "Flying in fresh produce weekly", "Buying only imported organic food"], a: 0, why: "Shorter supply chains mean less fuel burned per meal." } },
    { id: "energy", title: "Energy", icon: "⚡", advisor: "marcus", type: "groups", groups: ["energy"], expert: ["eng", "cs", "pol"],
      brief: ["Diesel is cheap to install and expensive to live with. Sun, wind, and biomass cost more up front. Batteries carry daytime power into the night.", "Cutting demand first is usually the cheapest kilowatt you will ever find."],
      insight: "Look at renewable share, not just total coverage. A grid that is 100% covered but mostly diesel is a footprint problem.",
      science: "Renewable microgrids pair generation (solar, wind) with storage and efficiency. Fuel that arrives by ship is also a resilience risk when prices spike.",
      reflect: "How does your energy plan supply the resort, and what tradeoffs did you accept?",
      quiz: { q: "What is the main job of battery storage in a solar microgrid?", opts: ["Store daytime solar for evening and night demand", "Make panels produce more power", "Purify seawater"], a: 0, why: "Demand peaks after sunset, when solar is not producing." } },
    { id: "waste", title: "Waste", icon: "♻️", advisor: "marcus", type: "groups", groups: ["waste"], expert: ["eng", "bio", "edu"],
      brief: ["The brief is blunt: shipping waste elsewhere or dumping it is not acceptable. Waste is a design problem to solve on the island.", "The derelict resort left tons of rubble too. Deconstructing it well is part of the plan."],
      insight: "Wastewater counts as waste. A constructed wetland can treat it and create habitat at the same time.",
      science: "The waste hierarchy ranks reduce and reuse first, then recycling and composting, then energy recovery, with disposal last. Constructed wetlands can clean wastewater while providing habitat.",
      reflect: "How will your resort get rid of waste without shipping it away or dumping it?",
      quiz: { q: "Which step is highest in the waste hierarchy?", opts: ["Reduce and reuse", "Landfill", "Recycling only"], a: 0, why: "Preventing waste beats every method of handling it." } },
    { id: "transport", title: "Transportation", icon: "⛴️", advisor: "elena", type: "groups", groups: ["transportIsland", "transportOff"], expert: ["eng", "pol", "biz"],
      brief: ["Getting people to the island is often the largest slice of a tourism footprint. Choose both how people move on the island and how they reach it."],
      insight: "A single runway can outweigh every other green choice you make. Price out the whole trip, not just the last mile.",
      science: "Air travel is the largest emitter per passenger-kilometre in most tourism trips. Boats vary widely with speed and fuel, while walking, cycling, and electric shuttles keep on-island emissions small.",
      reflect: "What is your transportation plan on the island and between the island and other places?",
      quiz: { q: "Which usually emits the most per passenger-kilometre?", opts: ["Private jet", "Ferry", "Bicycle"], a: 0, why: "Small aircraft burn a lot of fuel for very few passengers." } },
    { id: "housing", title: "Employee housing", icon: "🏘️", advisor: "iris", type: "groups", groups: ["housing", "housingPolicy"], expert: ["soc", "ph", "edu"],
      brief: ["The people who run the resort need somewhere decent to live. Where and how you house them decides who benefits from your project."],
      insight: "Ask who is missing from your plan. Housing is where fairness turns into a building.",
      science: "Employee housing shapes commute emissions, whether wages stay in the community, and pressure on local housing. Building on already-cleared land avoids new habitat loss.",
      reflect: "Where is employee housing, and how does it minimize ecological impact?",
      quiz: { q: "Why does housing staff on the island support sustainability?", opts: ["Shorter commutes, stronger community ties, and more local spending", "Workers do not need water", "It lets you skip wastewater treatment"], a: 0, why: "Living close to work cuts travel and keeps wages local." } },
    { id: "health", title: "Public health", icon: "🩺", advisor: "kenji", type: "groups", groups: ["health"], expert: ["ph", "bio"],
      brief: ["A remote island cannot count on a hospital next door. Guests and staff need care on site, clean water, and a plan for outbreaks and emergencies."],
      insight: "Prevention is cheaper than treatment. Water testing and mosquito control protect more people than a clinic alone.",
      science: "The One Health approach links human, animal, and ecosystem health. Blanket pesticide spraying can harm pollinators and marine life. Integrated vector management targets breeding sites instead.",
      reflect: "How will you manage healthcare for employees and guests, and address public health issues?",
      quiz: { q: "What is the One Health idea?", opts: ["Human, animal, and environmental health are linked", "Everyone gets one health check a year", "Islands only need one clinic"], a: 0, why: "Problems in one area, such as polluted water, show up in the others." } },
    { id: "midpoint", title: "Midpoint board review", icon: "📈", advisor: "elena", type: "midpoint", expert: ["hosp", "ph", "biz"],
      brief: ["Halfway there. The board wants an honest look at how your plan is shaping up before you commit to the habitat work."],
      insight: "Look for a gap between your best and worst dial. Balanced plans survive storms.",
      science: "Formative checkpoints help teams see what is working before final decisions lock in. Compare your numbers with your goals, not with other teams.",
      reflect: "Name one decision you are proud of and one you would revisit. What evidence would change your mind?" },
    { id: "habitats", title: "Wildlife areas and corridors", icon: "🦜", advisor: "nia", type: "habitats", groups: ["corridors"], expert: ["bio", "cs"],
      brief: ["This is the heart of the plan. The island's wildlife needs four connected habitats: watershed, inland reserves, mangroves, and reef. Invest in each, then connect them.", "Your weakest habitat limits the whole chain, so balance matters."],
      insight: "Restoration has diminishing returns. The tenth million in one habitat rarely beats the first million in a neglected one.",
      science: "Ecosystems are connected. Runoff from the watershed shapes estuary water, mangroves shelter young fish that later live on reefs, and animals need corridors to move between habitats.",
      reflect: "Why did you choose this restoration and corridor plan, and how does it preserve biodiversity?",
      quiz: { q: "Why do mangroves matter for reef fish?", opts: ["Many reef fish shelter in mangrove roots as juveniles", "Mangroves make coral grow faster by shading it", "Mangroves add sand to reefs"], a: 0, why: "Mangroves are nurseries that later stock the reef." } },
    { id: "species", title: "Indicator species", icon: "🐢", advisor: "nia", type: "species", expert: ["bio"],
      brief: ["Pick one indicator species. If it thrives, the ecosystem is probably healthy. Then prove you understand its niche in each habitat."],
      insight: "A good indicator needs several habitats in good shape at once. That is what makes it a good alarm bell.",
      science: "A niche is the full set of conditions and resources a species uses and the roles it plays. Indicator species reveal ecosystem health because they depend on many parts of the system.",
      reflect: "Describe your species' way of life and how it interacts with each ecosystem type on your island." },
    { id: "climate", title: "Climate and sea-level rise", icon: "🌀", advisor: "marcus", type: "groups", groups: ["climate"], expert: ["eng", "bio", "pol"],
      brief: ["Seas are rising and storms are getting stronger. Protect the island without walling off the ecosystem you are restoring."],
      insight: "Ask what each defense does to connectivity. Anything that blocks habitats from shifting inland will cost you later.",
      science: "Nature-based defenses such as mangroves, dunes, and reefs absorb wave energy and can keep pace with sea-level rise. Hard seawalls reflect waves, erode beaches, and block habitat migration.",
      reflect: "How will you protect the island from climate change while keeping ecological integrity and connectivity?",
      quiz: { q: "Which shoreline approach can grow upward as seas rise?", opts: ["Living shorelines such as mangroves and oyster reef", "A concrete seawall", "A paved parking lot"], a: 0, why: "Living systems can build sediment and adapt; concrete cannot." } },
    { id: "earthcharter", title: "Earth Charter learning module", icon: "🌍", advisor: "iris", type: "earthcharter", groups: ["ec1", "ec2", "ec3", "ec4"], expert: ["edu", "soc", "comm", "pol"],
      brief: ["The Earth Charter rests on four pillars. Show how your resort teaches and practices each one with the community, and prove you can tell them apart."],
      insight: "Education that only happens at the resort is outreach in name only. Give the community a real role.",
      science: "The Earth Charter is a global statement of ethical principles for a just, sustainable, and peaceful world. Its four main parts cover respect and care for life, ecological integrity, social and economic justice, and democracy, nonviolence, and peace.",
      reflect: "How will your resort provide education and outreach to the local community about your sustainable development plans?" },
    { id: "footprint", title: "Ecological footprint", icon: "👣", advisor: "nia", type: "groups", groups: ["footprint"], footprintChart: true, expert: ["cs", "edu", "bio"],
      brief: ["Time to shrink what is left. Think back to the footprint exercise from earlier in the semester. Where does most of your footprint come from?"],
      insight: "Attack the biggest bar first. Offsets are the last step after avoiding and reducing.",
      science: "An ecological footprint estimates the land and sea area needed to supply what you use and absorb your waste. Avoid first, reduce second, and offset only what remains.",
      reflect: "How does your plan minimize the resort's overall ecological footprint?",
      quiz: { q: "What does an ecological footprint estimate?", opts: ["The land and sea area needed to supply resources and absorb waste", "The number of hiking trails", "How many species live on an island"], a: 0, why: "It turns consumption into an area so it can be compared with what the planet provides." } },
    { id: "map", title: "Resort map", icon: "🗺️", advisor: "marcus", type: "map", expert: ["eng", "cs", "bio"],
      brief: ["Now place each facility on the island. Height above sea level, distance from habitats, and old bulldozed land all matter.", "Tap a facility, then tap a plot on the map. The auto-place button gives a solid starting layout."],
      insight: "Critical services on low ground are the first thing a storm surge finds.",
      science: "Siting matters as much as design. Building on previously disturbed land (a brownfield) avoids new habitat loss, and keeping critical services above flood height protects people in storms.",
      reflect: "Explain the layout of your ecoresort and why you sited the most important facilities where you did.",
      quiz: { q: "Why build on the abandoned resort site instead of intact forest?", opts: ["It avoids clearing new habitat and can reuse existing foundations", "Forest cannot legally be built on", "Brownfields never need cleanup"], a: 0, why: "Development on land that is already disturbed spares natural areas." } },
    { id: "tbl", title: "Triple bottom line", icon: "🔵", advisor: "elena", type: "tbl", expert: ["biz", "pol", "cs"],
      brief: ["The triple bottom line asks whether your resort works for planet, people, and profit at the same time. The overlap is what counts as sustainable."],
      insight: "The overlap is a geometric mean, so one weak circle drags the whole score down.",
      science: "Sustainability lives where environmental responsibility, social well-being, and economic growth overlap. Weakness in one circle shrinks the overlap.",
      reflect: "Explain how your resort relates to environmental responsibility, social well-being, and economic growth.",
      quiz: { q: "Which three areas make up the triple bottom line?", opts: ["People, planet, and profit", "Politics, plastic, and price", "Plants, power, and pollution"], a: 0, why: "Success is measured in social, environmental, and financial results together." } },
    { id: "sim", title: "The first ten years", icon: "⏳", advisor: "elena", type: "sim", expert: ["biz", "pol", "soc"],
      brief: ["It is 2030 and the ribbon is cut. Ten years of storms, market swings, and community decisions are ahead. How you prepared will show."],
      insight: "Your earlier choices set the odds. Your responses now decide how bad a bad year gets." },
    { id: "results", title: "Final report", icon: "🏆", advisor: "elena", type: "results", expert: ["comm"],
      brief: ["The board has reviewed your first decade. Here is how the island and the business ended up."],
      insight: "Communicate the honest story. Guests and communities can tell when a pitch hides its tradeoffs." }
  ];

  // ---------- Sim events ----------
  // impact values apply at severity 1. Keys: cash ($M), bio, comm, guest, resil, health, wq.
  D.events = [
    { id: "permit", year: 1, icon: "📜", title: "The council reviews your plan",
      text: "Construction is underway. The island council holds a public hearing on your restoration plan and building permits.",
      sevKey: "permit", impact: { comm: -8, cash: -3 },
      choices: [
        { label: "Hold open workshops and revise the plan with residents", mult: 0.4, extra: { cash: -1, comm: 4, bio: 1 }, msg: "Residents help fix two siting problems. The permit passes with praise." },
        { label: "Submit the paperwork and answer only formal questions", mult: 1.0, extra: {}, msg: "The permit passes, but trust is thin." },
        { label: "Lean on your investors to speed things along", mult: 1.6, extra: { cash: 1, comm: -5 }, msg: "You save a month. Neighbors remember how you did it." } ] },
    { id: "fuel", year: 2, icon: "⛽", title: "Global fuel prices spike",
      text: "A supply shock doubles the price of shipped fuel and goods for six months.",
      sevKey: "fuel", impact: { cash: -9, guest: -3 },
      choices: [
        { label: "Absorb the cost and protect guest prices", mult: 1.0, extra: { guest: 2 }, msg: "Margins take a hit, guests notice nothing." },
        { label: "Pass a fuel surcharge to guests", mult: 0.6, extra: { guest: -4 }, msg: "Cash holds up. Some guests grumble." },
        { label: "Cut ferry runs and consolidate deliveries", mult: 0.5, extra: { guest: -2, comm: -1 }, msg: "Fewer trips, fewer surprises. Some staff commutes get harder." } ] },
    { id: "hurricane", year: 3, icon: "🌀", title: "Hurricane Delphine takes aim",
      text: "A category 3 storm is forecast to pass within 50 miles. Guests are on the island.",
      sevKey: "hurricane", impact: { cash: -12, bio: -8, guest: -6, resil: -4, comm: -2 }, fx: "storm",
      choices: [
        { label: "Evacuate guests and non-essential staff early", mult: 0.75, extra: { cash: -2, comm: 3, health: 2 }, msg: "Everyone is safe. The refund bill hurts." },
        { label: "Shelter in place in the storm shelter", mult: 1.0, extra: {}, msg: "The shelter works. The cleanup is long." },
        { label: "Keep operating until the last flight", mult: 1.35, extra: { cash: 2, comm: -6, health: -6 }, msg: "You banked two more days of revenue. Staff and guests will not forget the fear." } ] },
    { id: "investor", year: 4, icon: "💼", title: "An investor wants growth",
      text: "A major backer offers new capital if you double your guest numbers next season.",
      sevKey: "flat", impact: { bio: -6, comm: -4, cash: 0 },
      choices: [
        { label: "Accept and double the guest numbers", mult: 1.5, extra: { cash: 16, guest: -4 }, msg: "Revenue jumps. Reefs and trails feel it." },
        { label: "Counter with a 15% increase and higher reserve fees", mult: 0.5, extra: { cash: 6, comm: 1 }, msg: "A measured deal that pays for more restoration." },
        { label: "Decline politely", mult: 0.0, extra: { cash: -2, comm: 3, bio: 1 }, msg: "You stay small and stay trusted." } ] },
    { id: "bleach", year: 5, icon: "🌡️", title: "Marine heat wave",
      text: "Ocean temperatures stay above the bleaching threshold for eight weeks.",
      sevKey: "bleach", impact: { bio: -10, guest: -4, cash: -3, resil: -2 }, fx: "bleach",
      choices: [
        { label: "Close reef tours for six weeks and shade coral nurseries", mult: 0.6, extra: { cash: -3, comm: 1 }, msg: "Corals get a break. Tour income dips." },
        { label: "Keep tours running with tighter limits", mult: 1.0, extra: {}, msg: "A mixed outcome. Some coral recovers." },
        { label: "Business as usual", mult: 1.4, extra: { cash: 2, comm: -2 }, msg: "Tour revenue holds, coral death spreads." } ] },
    { id: "outbreak", year: 6, icon: "🦠", title: "Illness spreads among staff",
      text: "A mosquito-borne fever appears in the staff village after heavy rains.",
      sevKey: "outbreak", impact: { health: -12, comm: -3, cash: -4, guest: -3 },
      choices: [
        { label: "Rapid testing, targeted drainage, and paid sick leave", mult: 0.5, extra: { cash: -2, comm: 3 }, msg: "Cases peak within a week and fall." },
        { label: "Follow the clinic's standard protocol", mult: 1.0, extra: {}, msg: "Control takes a few weeks." },
        { label: "Fog the whole island with pesticide", mult: 0.8, extra: { bio: -5, comm: -3, cash: -1 }, msg: "Mosquitoes drop fast, and so do pollinators and reef fish." } ] },
    { id: "species", year: 7, icon: "🔬", title: "Indicator species report",
      text: "Your monitoring team reports on your indicator species this year.",
      sevKey: "species", impact: { bio: -8, comm: -2, guest: -2 },
      choices: [
        { label: "Fund extra monitoring and publish the results", mult: 0.6, extra: { cash: -1, comm: 3, bio: 1 }, msg: "Data guides quick fixes. Trust grows." },
        { label: "Share results with the board only", mult: 1.0, extra: {}, msg: "Nothing changes." },
        { label: "Hold the report until after the season", mult: 1.3, extra: { comm: -4 }, msg: "A leak makes it look worse than it was." } ] },
    { id: "press", year: 8, icon: "📰", title: "A travel magazine features you",
      text: "Demand spikes. Waiting lists stretch to eight months.",
      sevKey: "flat", impact: { bio: -4, comm: -2, guest: 0 },
      choices: [
        { label: "Keep your caps and raise prices", mult: 0.3, extra: { cash: 8, guest: 2 }, msg: "Higher margin without more crowds." },
        { label: "Add a small lodge to meet demand", mult: 1.2, extra: { cash: 10, guest: -1 }, msg: "More income, more pressure." },
        { label: "Use the attention to fund a community trust", mult: 0.2, extra: { cash: 3, comm: 6, guest: 2 }, msg: "You turn spotlight into goodwill." } ] },
    { id: "surge", year: 9, icon: "🌊", title: "King tide and storm surge",
      text: "Sea level and a passing storm push water over low ground.",
      sevKey: "surge", impact: { cash: -9, resil: -4, bio: -4, guest: -4, comm: -2 }, fx: "flood",
      choices: [
        { label: "Activate the early-warning plan and move guests uphill", mult: 0.6, extra: { cash: -1, comm: 2 }, msg: "Water rises, people are already gone." },
        { label: "Sandbag the low buildings", mult: 1.0, extra: {}, msg: "Some buildings flood." },
        { label: "Wait and see", mult: 1.4, extra: { health: -3, comm: -3 }, msg: "The water arrives first." } ] },
    { id: "audit", year: 10, icon: "🏅", title: "Ten-year sustainability audit",
      text: "An independent auditor reviews the island's ecology, community, and financial records.",
      sevKey: "none", impact: {}, choices: [ { label: "Welcome the audit team", mult: 0, extra: {}, msg: "The findings go into your final report." } ] }
  ];

  window.DATA = D;
})();
