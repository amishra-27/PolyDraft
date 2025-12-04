export const minikitConfig = {
  accountAssociation: {
    "header": "",
    "payload": "",
    "signature": ""
  },
  miniapp: {
    version: "1",
    name: "PolyDraft", 
    subtitle: "Fantasy Sports Drafting", 
    description: "Draft fantasy sports teams with friends on Base",
    screenshotUrls: [`${process.env.ROOT_URL || 'http://localhost:3000'}/screenshot-portrait.png`],
    iconUrl: `${process.env.ROOT_URL || 'http://localhost:3000'}/icon.png`,
    splashImageUrl: `${process.env.ROOT_URL || 'http://localhost:3000'}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: process.env.ROOT_URL || 'http://localhost:3000',
    webhookUrl: `${process.env.ROOT_URL || 'http://localhost:3000'}/api/webhook`,
    primaryCategory: "games",
    tags: ["fantasy", "sports", "drafting", "gaming", "base"],
    heroImageUrl: `${process.env.ROOT_URL || 'http://localhost:3000'}/hero.png`, 
    tagline: "Draft. Compete. Win.",
    ogTitle: "PolyDraft - Fantasy Sports on Base",
    ogDescription: "Draft fantasy sports teams with friends on Base blockchain",
    ogImageUrl: `${process.env.ROOT_URL || 'http://localhost:3000'}/hero.png`,
  },
} as const;