export const siteConfig = {
  name: "Alex Rivera",
  title: "Senior Full-Stack Developer",
  description:
    "I craft performant, elegant web experiences that push the boundaries of what's possible on the modern web.",
  url: "https://alexrivera.dev",
  email: "hello@alexrivera.dev",
  location: "San Francisco, CA",
  availability: "Open to opportunities",
  socials: {
    github: "https://github.com/alexrivera",
    linkedin: "https://linkedin.com/in/alexrivera",
    twitter: "https://x.com/alexrivera",
    dribbble: "https://dribbble.com/alexrivera",
  },
};

export const heroData = {
  greeting: "Hey, I'm",
  name: "Alex Rivera",
  roles: [
    "Full-Stack Developer",
    "System Architect",
    "Open Source Builder",
    "Performance Obsessed",
  ],
  tagline:
    "I build digital experiences that are fast, accessible, and impossible to forget.",
  cta: { label: "See My Work", href: "#projects" },
  ctaSecondary: { label: "Get In Touch", href: "#contact" },
};

export const aboutData = {
  headline: "Crafting the web, one pixel at a time",
  description: [
    "I'm a Senior Full-Stack Developer with 8+ years of experience building scalable web applications and design systems. I specialize in React ecosystems, Node.js, and cloud architecture — always chasing that intersection of beautiful design and bulletproof engineering.",
    "When I'm not shipping features, you'll find me contributing to open source, writing about web performance, or exploring the latest in AI-augmented development. I believe the best code is invisible — it just works, beautifully.",
  ],
  stats: [
    { label: "Years Experience", value: 8 },
    { label: "Projects Delivered", value: 50 },
    { label: "Open Source Contributions", value: 200 },
    { label: "Cups of Coffee", value: 4200 },
  ],
  techStack: [
    { name: "TypeScript", category: "frontend" },
    { name: "React", category: "frontend" },
    { name: "Next.js", category: "frontend" },
    { name: "Vue.js", category: "frontend" },
    { name: "Tailwind CSS", category: "frontend" },
    { name: "Node.js", category: "backend" },
    { name: "Python", category: "backend" },
    { name: "Go", category: "backend" },
    { name: "GraphQL", category: "backend" },
    { name: "PostgreSQL", category: "database" },
    { name: "Redis", category: "database" },
    { name: "MongoDB", category: "database" },
    { name: "AWS", category: "devops" },
    { name: "Docker", category: "devops" },
    { name: "Kubernetes", category: "devops" },
    { name: "Terraform", category: "devops" },
  ],
};

export const projectsData = [
  {
    id: "nexus",
    title: "Nexus Platform",
    description:
      "A real-time collaborative workspace for distributed teams. Built with WebSocket architecture, CRDT-based conflict resolution, and sub-50ms sync latency across global regions.",
    longDescription:
      "Nexus reimagines how distributed teams collaborate in real-time. Using CRDTs for conflict-free state synchronization and a custom WebSocket mesh, it delivers sub-50ms sync across 12 global regions. The platform handles 100K+ concurrent users with graceful degradation.",
    tags: ["React", "Node.js", "WebSocket", "Redis", "AWS"],
    image: "/projects/nexus.jpg",
    liveUrl: "https://nexus-platform.dev",
    githubUrl: "https://github.com/alexrivera/nexus",
    featured: true,
    year: "2025",
    color: "#6366f1",
  },
  {
    id: "aurora",
    title: "Aurora Design System",
    description:
      "An enterprise-grade design system powering 40+ products. Includes accessible components, theming engine, and automated visual regression testing.",
    longDescription:
      "Aurora is a comprehensive design system serving 40+ products and 200+ developers. It features a token-based theming engine, WCAG AAA accessible components, automated visual regression testing, and Figma-to-code synchronization.",
    tags: ["TypeScript", "React", "Storybook", "Figma API", "Chromatic"],
    image: "/projects/aurora.jpg",
    liveUrl: "https://aurora-ds.dev",
    githubUrl: "https://github.com/alexrivera/aurora-ds",
    featured: true,
    year: "2024",
    color: "#f43f5e",
  },
  {
    id: "quantum",
    title: "Quantum Analytics",
    description:
      "A high-performance analytics dashboard processing 10M+ events/day with real-time visualizations, anomaly detection, and predictive insights powered by ML.",
    longDescription:
      "Quantum Analytics processes 10M+ events daily through a streaming pipeline built on Apache Kafka. Real-time dashboards use WebGL-accelerated charts, while the ML layer provides anomaly detection and predictive forecasting with 94% accuracy.",
    tags: ["Next.js", "Python", "Kafka", "TensorFlow", "D3.js"],
    image: "/projects/quantum.jpg",
    liveUrl: "https://quantum-analytics.io",
    githubUrl: "https://github.com/alexrivera/quantum",
    featured: true,
    year: "2025",
    color: "#10b981",
  },
  {
    id: "velocity",
    title: "Velocity CLI",
    description:
      "A developer productivity CLI that automates project scaffolding, CI/CD pipeline generation, and deployment workflows. 12K+ GitHub stars.",
    longDescription:
      "Velocity is a zero-config CLI that eliminates boilerplate in modern development workflows. It generates project scaffolds, configures CI/CD pipelines, and manages multi-cloud deployments — all from simple commands. Over 12K GitHub stars and 500+ contributors.",
    tags: ["Go", "Docker", "GitHub Actions", "Terraform"],
    image: "/projects/velocity.jpg",
    liveUrl: "https://velocity.sh",
    githubUrl: "https://github.com/alexrivera/velocity",
    featured: false,
    year: "2024",
    color: "#f59e0b",
  },
  {
    id: "echo",
    title: "Echo Social",
    description:
      "A privacy-first social platform with end-to-end encryption, zero-knowledge authentication, and federated architecture. 50K+ monthly active users.",
    longDescription:
      "Echo is a privacy-first social platform built on a federated architecture. Every message is end-to-end encrypted, authentication uses zero-knowledge proofs, and users own their data. Scaled to 50K+ MAU with P2P content distribution.",
    tags: ["React Native", "Rust", "libp2p", "SQLite", "E2EE"],
    image: "/projects/echo.jpg",
    liveUrl: "https://echo-social.app",
    githubUrl: "https://github.com/alexrivera/echo",
    featured: false,
    year: "2023",
    color: "#8b5cf6",
  },
];

export const skillsData = {
  categories: [
    {
      name: "Frontend",
      skills: [
        { name: "React / Next.js", level: 95 },
        { name: "TypeScript", level: 92 },
        { name: "Vue / Nuxt", level: 80 },
        { name: "CSS / Tailwind", level: 90 },
        { name: "Animation (GSAP / Motion)", level: 88 },
        { name: "WebGL / Three.js", level: 70 },
      ],
    },
    {
      name: "Backend",
      skills: [
        { name: "Node.js / Express", level: 93 },
        { name: "Python / FastAPI", level: 85 },
        { name: "Go", level: 75 },
        { name: "GraphQL", level: 88 },
        { name: "REST API Design", level: 95 },
        { name: "Microservices", level: 82 },
      ],
    },
    {
      name: "DevOps & Cloud",
      skills: [
        { name: "AWS / GCP", level: 88 },
        { name: "Docker / Kubernetes", level: 85 },
        { name: "CI/CD Pipelines", level: 90 },
        { name: "Terraform / IaC", level: 78 },
        { name: "Monitoring / Observability", level: 82 },
        { name: "Security / Auth", level: 80 },
      ],
    },
    {
      name: "Databases",
      skills: [
        { name: "PostgreSQL", level: 90 },
        { name: "Redis", level: 85 },
        { name: "MongoDB", level: 82 },
        { name: "Elasticsearch", level: 75 },
      ],
    },
  ],
};

export const experienceData = [
  {
    role: "Senior Full-Stack Developer",
    company: "TechForge Labs",
    companyUrl: "https://techforgelabs.com",
    period: "2023 — Present",
    description:
      "Leading architecture and development of the core platform serving 2M+ users. Spearheaded migration from monolith to microservices, reducing deploy times by 80% and improving uptime to 99.99%.",
    achievements: [
      "Architected real-time collaboration engine with <50ms latency",
      "Led team of 8 engineers across 3 product squads",
      "Reduced infrastructure costs by 40% through optimization",
      "Established company-wide engineering standards and code review practices",
    ],
  },
  {
    role: "Full-Stack Developer",
    company: "Quantum Digital",
    companyUrl: "https://quantumdigital.io",
    period: "2021 — 2023",
    description:
      "Built and maintained client-facing dashboards and internal tools processing millions of data points daily. Introduced automated testing that reduced production bugs by 65%.",
    achievements: [
      "Built analytics dashboard processing 10M+ events/day",
      "Introduced automated visual regression testing pipeline",
      "Mentored 4 junior developers to mid-level promotions",
      "Optimized database queries reducing P95 latency by 3x",
    ],
  },
  {
    role: "Frontend Developer",
    company: "Pixel & Code",
    companyUrl: "https://pixelandcode.design",
    period: "2019 — 2021",
    description:
      "Developed interactive web experiences for Fortune 500 clients. Specialized in animation-heavy marketing sites and accessible component libraries.",
    achievements: [
      "Delivered 20+ client projects with 100% on-time rate",
      "Created an open-source animation library (3K+ GitHub stars)",
      "Achieved Lighthouse scores of 95+ across all client projects",
      "Spoke at 3 regional conferences on web animation",
    ],
  },
  {
    role: "Junior Developer",
    company: "StartupGrid",
    companyUrl: "https://startupgrid.co",
    period: "2017 — 2019",
    description:
      "Full-stack development in a fast-paced startup environment. Wore many hats — from frontend features to database optimization to deployment automation.",
    achievements: [
      "Built the MVP that secured $2M seed funding",
      "Scaled the platform from 0 to 50K users",
      "Implemented CI/CD pipeline reducing deploy time from hours to minutes",
    ],
  },
];

export const blogData = [
  {
    title: "Building Real-Time Collaboration with CRDTs",
    excerpt:
      "A deep dive into conflict-free replicated data types and how we used them to build sub-50ms collaborative editing at scale.",
    date: "2025-12-15",
    readTime: "12 min",
    tags: ["Architecture", "Real-Time", "Distributed Systems"],
    slug: "building-real-time-collaboration-crdts",
  },
  {
    title: "The Art of Web Animation: GSAP + React in 2026",
    excerpt:
      "Now that GSAP is fully free, here's how to build cinematic scroll experiences with ScrollTrigger, SplitText, and React 19.",
    date: "2025-11-20",
    readTime: "8 min",
    tags: ["Animation", "React", "GSAP"],
    slug: "art-of-web-animation-gsap-react-2026",
  },
  {
    title: "Scaling to 2M Users: Lessons from a Monolith Migration",
    excerpt:
      "What we learned migrating a 5-year-old monolith to microservices — the wins, the pain, and what we'd do differently.",
    date: "2025-09-05",
    readTime: "15 min",
    tags: ["Backend", "Architecture", "DevOps"],
    slug: "scaling-2m-users-monolith-migration",
  },
  {
    title: "TypeScript 5.9: The Features That Actually Matter",
    excerpt:
      "Cutting through the noise — the TypeScript 5.9 features that will genuinely change how you write code every day.",
    date: "2025-07-12",
    readTime: "6 min",
    tags: ["TypeScript", "Frontend"],
    slug: "typescript-5-9-features-that-matter",
  },
];

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];
