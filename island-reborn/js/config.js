/* Island Reborn: instructor configuration.
   Change the island, budgets and economics here. No build step is needed. */
window.ECO_CONFIG = {
  gameTitle: "Island Reborn",
  subtitle: "The Ecoresort Challenge",
  island: {
    name: "Pelican Cay",
    region: "the Sapphire Banks",
    year: 2030,
    acres: 1200,
    marineAcres: 800
  },
  // Budgets are in millions of US dollars (hypothetical).
  difficulty: {
    guided:    { label: "Guided",    budget: 300, sev: 0.8,  showEffects: true,  blurb: "Every choice shows its costs and effects. Best for a first play." },
    standard:  { label: "Standard",  budget: 250, sev: 1.0,  showEffects: true,  blurb: "A tighter budget and harsher storms." },
    challenge: { label: "Challenge", budget: 200, sev: 1.25, showEffects: false, blurb: "Effects are hidden. Reason from the science." }
  },
  economics: {
    baseRevenuePerVisit: 1400,   // dollars per guest visit
    baseOpsPerVisit: 350,        // dollars per guest visit
    sitePrepCost: 10,            // millions
    loanRate: 0.08               // interest on spending above budget
  },
  features: {
    pitchExport: true,           // lets teams download a starter pitch webpage
    teacherPanel: true,          // instructor export panel
    autosave: true
  },
  storageKey: "island-reborn-save-v1"
};
