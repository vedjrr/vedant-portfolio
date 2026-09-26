export const GITHUB_USER = "vedjrr";

const gh = (repo = "") =>
  `https://github.com/${GITHUB_USER}${repo ? `/${repo}` : ""}`;

export const site = {
  url: "https://vedantambre.com",
  title: "Vedant Ambre · Business analyst who ships software",
  description:
    "Business analyst in Maynooth, Ireland who ships working software. Builder of Hold My Code, sourced case studies and data products.",
};

export const profile = {
  name: "Vedant Ambre",
  initials: "VA",
  avatar: "/avatar.webp",
  email: "vedantambre.tech@gmail.com",
  location: "Maynooth, Ireland",
  banner: ["Open to business", "analyst roles"],
  flipWords: ["Business Analyst", "Ships software", "Maynooth, Ireland"],
  status: "Available · Business analyst roles",
  about: [
    "I'm a business analyst who ships software. I scope a problem the way an analyst does, then build the fix myself.",
    "I came up through engineering because I liked how a clean query could change what a team believed about its own numbers. That took me from a Diploma in Computer Science and a B.Tech in IT in Mumbai to a Master's in Business Analytics at Maynooth University.",
    "I still work the way I was trained: pin down the question, agree what good looks like, then build the thing and check it against the numbers.",
    "The latest is Hold My Code, a macOS app that keeps a Mac awake while coding agents work, even with the lid closed.",
  ],
};

export type Social = {
  title: string;
  href: string;
  icon: "github" | "linkedin" | "mail" | "globe";
};

export const socials: Social[] = [
  { title: "GitHub", href: gh(), icon: "github" },
  {
    title: "LinkedIn",
    href: "https://linkedin.com/in/vedantambre",
    icon: "linkedin",
  },
  { title: "Mail", href: `mailto:${profile.email}`, icon: "mail" },
  { title: "Hold My Code", href: "https://holdmycode.xyz", icon: "globe" },
];

export type Education = {
  school: string;
  degree: string;
  field: string;
  period: string;
  details: string[];
};

export const education: Education[] = [
  {
    school: "Maynooth University",
    degree: "Master's",
    field: "Business Analytics",
    period: "2025 — 2026",
    details: [
      "Consulting project with Sustainable Energy Ireland: KPI framework and a Power BI and SQL pricing dashboard (AdFlex).",
      "Market strategy for an IEEE 2030.5 energy data gateway.",
    ],
  },
  {
    school: "Ramrao Adik Institute of Technology",
    degree: "B.Tech",
    field: "Information Technology",
    period: "2022 — 2025",
    details: [
      "DY Patil University, Mumbai.",
      "Co-authored research on diabetic foot detection: 88% accuracy on 15,000+ thermal images.",
    ],
  },
  {
    school: "V.P.M's Polytechnic",
    degree: "Diploma",
    field: "Computer Science",
    period: "2019 — 2022",
    details: ["Mumbai."],
  },
];

export const stack: { title: string; items: string[] }[] = [
  { title: "Analyse", items: ["SQL", "Python", "Pandas", "Excel"] },
  { title: "Present", items: ["Power BI", "Tableau", "Recharts"] },
  {
    title: "Build",
    items: ["Swift", "SwiftUI", "Next.js", "React", "FastAPI", "PostgreSQL"],
  },
  {
    title: "Practice",
    items: ["Requirements", "KPI modelling", "Source tracing"],
  },
];

export type Project = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  date: string;
  status: "Live" | "Built" | "In progress";
  liveUrl?: string;
  repoUrl?: string;
  image?: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: "hold-my-code",
    name: "Hold My Code",
    tagline: "macOS app",
    description:
      "A Swift menu bar app that keeps a Mac awake while coding agents work, even with the lid closed. Watches 10 agents through their own hooks, shows usage limits and cost, and updates itself in one click.",
    stack: ["Swift 6", "SwiftUI", "AppKit", "XPC"],
    date: "09.2026",
    status: "Live",
    liveUrl: "https://holdmycode.xyz",
    repoUrl: gh("Hold-My-Code"),
    image: "/projects/hold-my-code.webp",
    featured: true,
  },
  {
    id: "nvidia",
    name: "NVIDIA case study",
    tagline: "Interactive case study",
    description:
      "Traces NVIDIA from a gaming GPU company to a $5T AI infrastructure supplier using only SEC filings and primary reporting. 68 sourced timeline events and a public log of rejected claims.",
    stack: ["SEC filings", "Next.js", "Recharts"],
    date: "06.2026",
    status: "Live",
    liveUrl: "https://nvidia-case-study-ved.vercel.app/",
    repoUrl: gh("Nvidia-Case-Study"),
    image: "/projects/nvidia.webp",
    featured: true,
  },
  {
    id: "starbucks",
    name: "Starbucks case study",
    tagline: "Business analytics case",
    description:
      "Three growth levers under the Back to Starbucks turnaround, built from public filings. Toggle each lever, break results down by store segment and trace every number to a named disclosure.",
    stack: ["Excel", "Power BI", "Tableau", "Next.js"],
    date: "05.2026",
    status: "Live",
    liveUrl: "https://starbucks-case-study-ved.vercel.app/",
    repoUrl: gh("Starbucks-Analysis"),
    image: "/projects/starbucks.webp",
    featured: true,
  },
  {
    id: "adflex",
    name: "AdFlex",
    tagline: "Pricing dashboard",
    description:
      "Master's consulting project with Sustainable Energy Ireland. Stakeholder requirements turned into a KPI framework and a pricing dashboard so non-technical teams can compare tariff scenarios.",
    stack: ["Power BI", "SQL", "KPI modelling"],
    date: "2026",
    status: "In progress",
    liveUrl: "https://adflex-dynamic-prices-vedant.vercel.app/login",
    image: "/projects/adflex.webp",
    featured: true,
  },
  {
    id: "codeshelf",
    name: "Codeshelf",
    tagline: "Web app",
    description:
      "Scans a machine for coding projects and scores how recoverable each one is, from 0 to 100. Every factor shows its score and the one action that would raise it.",
    stack: ["Next.js 16", "React 19", "Prisma", "PostgreSQL"],
    date: "09.2026",
    status: "Live",
    liveUrl: "https://codeshelf-seven.vercel.app",
    repoUrl: gh("Codeshelf"),
  },
  {
    id: "meridian",
    name: "Meridian",
    tagline: "Process mining",
    description:
      "Rebuilds how a loan process really runs from 561,671 events in the BPI Challenge 2017 log. Hand-written mining, token-replay conformance and bottleneck classification.",
    stack: ["Python", "PostgreSQL", "FastAPI", "Next.js"],
    date: "09.2026",
    status: "In progress",
    repoUrl: gh("Meridian"),
  },
  {
    id: "gridpeer",
    name: "GridPeer",
    tagline: "Multi-agent simulation",
    description:
      "Households trade solar surplus with each other through a continuous double auction, measured against an export-to-grid baseline on real Irish smart-meter data.",
    stack: ["Python", "Pydantic", "LightGBM", "Streamlit"],
    date: "09.2026",
    status: "In progress",
    repoUrl: gh("Gridpeer"),
  },
  {
    id: "second-brain",
    name: "Second Brain",
    tagline: "Telegram bot",
    description:
      "A personal memory system in Telegram. Classifies messages, runs OCR, transcribes voice notes locally and answers only from what was saved.",
    stack: ["Python", "FastAPI", "SQLite", "Whisper"],
    date: "09.2026",
    status: "Built",
    repoUrl: gh("Second-Brain"),
  },
  {
    id: "retentioniq",
    name: "RetentionIQ",
    tagline: "Product analytics",
    description:
      "Activation, funnel drop-off and retention cohorts. SQL-first KPI aggregation with a plain-English panel beside each chart.",
    stack: ["Next.js", "FastAPI", "PostgreSQL"],
    date: "03.2026",
    status: "Live",
    liveUrl: "https://retention-iq-seven.vercel.app",
    repoUrl: gh("RetentionIQ"),
    image: "/projects/retentioniq.webp",
  },
  {
    id: "insightpilot",
    name: "InsightPilot",
    tagline: "AI analyst",
    description:
      "Ask a CSV questions in plain English and get chart-backed answers. The agent writes, validates and runs read-only SQL, and shows each step it took.",
    stack: ["Next.js", "FastAPI", "Gemini", "Neon"],
    date: "03.2026",
    status: "Live",
    liveUrl: "https://insightpilot-orpin.vercel.app",
    repoUrl: gh("InsightPilot"),
    image: "/projects/insightpilot.webp",
  },
  {
    id: "votion",
    name: "Votion",
    tagline: "Workspace app",
    description: "A Notion-style workspace with real-time sync.",
    stack: ["Next.js", "Convex", "Tailwind"],
    date: "2026",
    status: "Live",
    liveUrl: "https://votion-ved.vercel.app",
    repoUrl: gh("Votion"),
    image: "/projects/votion.webp",
  },
  {
    id: "lumen",
    name: "Lumen",
    tagline: "BI dashboard",
    description:
      "Drop in a spreadsheet and get KPIs, anomalies and answers to plain-English questions.",
    stack: ["Next.js", "FastAPI", "Pandas", "Claude"],
    date: "2026",
    status: "Built",
    repoUrl: gh("AI-Business-Intelligence-Dashboard"),
    image: "/projects/lumen.webp",
  },
  {
    id: "pricesense",
    name: "PriceSense",
    tagline: "Price intelligence",
    description:
      "Competitor price history and volatility from scheduled scrapes.",
    stack: ["Next.js", "Scraping", "Vercel"],
    date: "2026",
    status: "Built",
    repoUrl: gh("Competitor-Price-Intelligence-Engine"),
    image: "/projects/pricesense.webp",
  },
  {
    id: "vcg",
    name: "Virtual Communication Gateway",
    tagline: "Market strategy",
    description:
      "Go-to-market for an IEEE 2030.5 energy data gateway: demand validation, SaaS revenue models and feasibility analysis.",
    stack: ["Market research", "SaaS modelling"],
    date: "2026",
    status: "In progress",
    repoUrl: gh("virtual-gateway"),
    image: "/projects/vcg.webp",
  },
  {
    id: "habitifyyy",
    name: "Habitifyyy",
    tagline: "iOS app",
    description: "Habit tracker with heatmaps and Pomodoro focus.",
    stack: ["SwiftUI", "Swift"],
    date: "2025",
    status: "Built",
    repoUrl: gh("Habitifyyy"),
  },
  {
    id: "touchless-zoom",
    name: "Touchless Zoom",
    tagline: "Computer vision",
    description: "Pinch the air to zoom the screen.",
    stack: ["Python", "OpenCV", "MediaPipe"],
    date: "2024",
    status: "Built",
    repoUrl: gh("Touchless-Zoom"),
  },
  {
    id: "air-canvas",
    name: "Air Canvas",
    tagline: "Computer vision",
    description: "Draw in the air with hand gestures.",
    stack: ["Python", "OpenCV", "NumPy"],
    date: "2024",
    status: "Built",
    repoUrl: gh("Air-Canvas."),
  },
  {
    id: "photography",
    name: "Photography portfolio",
    tagline: "Website",
    description: "Photo site with a click-speed game and leaderboard.",
    stack: ["Node.js", "Express", "JavaScript"],
    date: "2023",
    status: "Built",
    repoUrl: gh("Photography-Portfolio"),
  },
];

export const quote = {
  text: "Without data, you're just another person with an opinion.",
  author: "W. Edwards Deming",
};
