/**
 * Seed script — migrates hard-coded portfolio data into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------- Data from portfolio.ts ----------

const siteSettings = {
  site_title: "Alex Rivera — Senior Full-Stack Developer",
  site_description:
    "I craft performant, elegant web experiences that push the boundaries of what's possible on the modern web.",
  contact_email: "hello@alexrivera.dev",
  social_links: {
    github: "https://github.com/alexrivera",
    linkedin: "https://linkedin.com/in/alexrivera",
    twitter: "https://x.com/alexrivera",
    dribbble: "https://dribbble.com/alexrivera",
  },
  contact_form_enabled: true,
  maintenance_mode: false,
};

const heroSection = {
  greeting: "Hey, I'm",
  name: "Alex Rivera",
  rotating_titles: [
    "Full-Stack Developer",
    "System Architect",
    "Open Source Builder",
    "Performance Obsessed",
  ],
  description:
    "I build digital experiences that are fast, accessible, and impossible to forget.",
  cta_primary_text: "See My Work",
  cta_primary_link: "#projects",
  cta_secondary_text: "Get In Touch",
  cta_secondary_link: "#contact",
};

const aboutSection = {
  heading: "About Me",
  subheading: "Crafting the web, one pixel at a time",
  bio: "I'm a Senior Full-Stack Developer with 8+ years of experience building scalable web applications and design systems. I specialize in React ecosystems, Node.js, and cloud architecture — always chasing that intersection of beautiful design and bulletproof engineering.",
  bio_secondary:
    "When I'm not shipping features, you'll find me contributing to open source, writing about web performance, or exploring the latest in AI-augmented development. I believe the best code is invisible — it just works, beautifully.",
  stats: [
    { label: "Years Experience", value: "8+" },
    { label: "Projects Delivered", value: "50+" },
    { label: "Open Source Contributions", value: "200+" },
    { label: "Cups of Coffee", value: "4,200+" },
  ],
  tech_stack: [
    "TypeScript",
    "React",
    "Next.js",
    "Vue.js",
    "Tailwind CSS",
    "Node.js",
    "Python",
    "Go",
    "GraphQL",
    "PostgreSQL",
    "Redis",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "Terraform",
  ],
};

const projects = [
  {
    title: "Nexus Platform",
    slug: "nexus-platform",
    short_description:
      "A real-time collaborative workspace for distributed teams. Built with WebSocket architecture, CRDT-based conflict resolution, and sub-50ms sync latency across global regions.",
    long_description:
      "Nexus reimagines how distributed teams collaborate in real-time. Using CRDTs for conflict-free state synchronization and a custom WebSocket mesh, it delivers sub-50ms sync across 12 global regions. The platform handles 100K+ concurrent users with graceful degradation.",
    tech_stack: ["React", "Node.js", "WebSocket", "Redis", "AWS"],
    live_url: "https://nexus-platform.dev",
    github_url: "https://github.com/alexrivera/nexus",
    featured: true,
    year: "2025",
    color: "#6366f1",
    sort_order: 0,
    published: true,
  },
  {
    title: "Aurora Design System",
    slug: "aurora-design-system",
    short_description:
      "An enterprise-grade design system powering 40+ products. Includes accessible components, theming engine, and automated visual regression testing.",
    long_description:
      "Aurora is a comprehensive design system serving 40+ products and 200+ developers. It features a token-based theming engine, WCAG AAA accessible components, automated visual regression testing, and Figma-to-code synchronization.",
    tech_stack: ["TypeScript", "React", "Storybook", "Figma API", "Chromatic"],
    live_url: "https://aurora-ds.dev",
    github_url: "https://github.com/alexrivera/aurora-ds",
    featured: true,
    year: "2024",
    color: "#f43f5e",
    sort_order: 1,
    published: true,
  },
  {
    title: "Quantum Analytics",
    slug: "quantum-analytics",
    short_description:
      "A high-performance analytics dashboard processing 10M+ events/day with real-time visualizations, anomaly detection, and predictive insights powered by ML.",
    long_description:
      "Quantum Analytics processes 10M+ events daily through a streaming pipeline built on Apache Kafka. Real-time dashboards use WebGL-accelerated charts, while the ML layer provides anomaly detection and predictive forecasting with 94% accuracy.",
    tech_stack: ["Next.js", "Python", "Kafka", "TensorFlow", "D3.js"],
    live_url: "https://quantum-analytics.io",
    github_url: "https://github.com/alexrivera/quantum",
    featured: true,
    year: "2025",
    color: "#10b981",
    sort_order: 2,
    published: true,
  },
  {
    title: "Velocity CLI",
    slug: "velocity-cli",
    short_description:
      "A developer productivity CLI that automates project scaffolding, CI/CD pipeline generation, and deployment workflows. 12K+ GitHub stars.",
    long_description:
      "Velocity is a zero-config CLI that eliminates boilerplate in modern development workflows. It generates project scaffolds, configures CI/CD pipelines, and manages multi-cloud deployments — all from simple commands. Over 12K GitHub stars and 500+ contributors.",
    tech_stack: ["Go", "Docker", "GitHub Actions", "Terraform"],
    live_url: "https://velocity.sh",
    github_url: "https://github.com/alexrivera/velocity",
    featured: false,
    year: "2024",
    color: "#f59e0b",
    sort_order: 3,
    published: true,
  },
  {
    title: "Echo Social",
    slug: "echo-social",
    short_description:
      "A privacy-first social platform with end-to-end encryption, zero-knowledge authentication, and federated architecture. 50K+ monthly active users.",
    long_description:
      "Echo is a privacy-first social platform built on a federated architecture. Every message is end-to-end encrypted, authentication uses zero-knowledge proofs, and users own their data. Scaled to 50K+ MAU with P2P content distribution.",
    tech_stack: ["React Native", "Rust", "libp2p", "SQLite", "E2EE"],
    live_url: "https://echo-social.app",
    github_url: "https://github.com/alexrivera/echo",
    featured: false,
    year: "2023",
    color: "#8b5cf6",
    sort_order: 4,
    published: true,
  },
];

// Map skills with category codes matching the DB schema
const skills = [
  // Frontend
  { name: "React / Next.js", category: "frontend", icon_name: "react", sort_order: 0 },
  { name: "TypeScript", category: "frontend", icon_name: "typescript", sort_order: 1 },
  { name: "Vue / Nuxt", category: "frontend", icon_name: "vuejs", sort_order: 2 },
  { name: "CSS / Tailwind", category: "frontend", icon_name: "tailwindcss", sort_order: 3 },
  { name: "Animation (GSAP / Motion)", category: "frontend", icon_name: "gsap", sort_order: 4 },
  { name: "WebGL / Three.js", category: "frontend", icon_name: "threejs", sort_order: 5 },
  // Backend
  { name: "Node.js / Express", category: "backend", icon_name: "nodejs", sort_order: 0 },
  { name: "Python / FastAPI", category: "backend", icon_name: "python", sort_order: 1 },
  { name: "Go", category: "backend", icon_name: "go", sort_order: 2 },
  { name: "GraphQL", category: "backend", icon_name: "graphql", sort_order: 3 },
  { name: "REST API Design", category: "backend", icon_name: "api", sort_order: 4 },
  { name: "Microservices", category: "backend", icon_name: "microservices", sort_order: 5 },
  // DevOps & Cloud
  { name: "AWS / GCP", category: "devops", icon_name: "aws", sort_order: 0 },
  { name: "Docker / Kubernetes", category: "devops", icon_name: "docker", sort_order: 1 },
  { name: "CI/CD Pipelines", category: "devops", icon_name: "githubactions", sort_order: 2 },
  { name: "Terraform / IaC", category: "devops", icon_name: "terraform", sort_order: 3 },
  { name: "Monitoring / Observability", category: "devops", icon_name: "grafana", sort_order: 4 },
  { name: "Security / Auth", category: "devops", icon_name: "security", sort_order: 5 },
  // Databases
  { name: "PostgreSQL", category: "database", icon_name: "postgresql", sort_order: 0 },
  { name: "Redis", category: "database", icon_name: "redis", sort_order: 1 },
  { name: "MongoDB", category: "database", icon_name: "mongodb", sort_order: 2 },
  { name: "Elasticsearch", category: "database", icon_name: "elasticsearch", sort_order: 3 },
  // Tools
  { name: "Git", category: "tools", icon_name: "git", sort_order: 0 },
  { name: "Linux", category: "tools", icon_name: "linux", sort_order: 1 },
  { name: "Vim", category: "tools", icon_name: "vim", sort_order: 2 },
  { name: "Figma", category: "tools", icon_name: "figma", sort_order: 3 },
  { name: "Webpack", category: "tools", icon_name: "webpack", sort_order: 4 },
  { name: "Vite", category: "tools", icon_name: "vite", sort_order: 5 },
  { name: "Jest", category: "tools", icon_name: "jest", sort_order: 6 },
  { name: "Cypress", category: "tools", icon_name: "cypress", sort_order: 7 },
  { name: "Playwright", category: "tools", icon_name: "playwright", sort_order: 8 },
  { name: "Storybook", category: "tools", icon_name: "storybook", sort_order: 9 },
];

const experience = [
  {
    company: "TechForge Labs",
    role: "Senior Full-Stack Developer",
    location: "San Francisco, CA",
    start_date: "2023-01-01",
    end_date: null,
    description:
      "Leading architecture and development of the core platform serving 2M+ users. Spearheaded migration from monolith to microservices, reducing deploy times by 80% and improving uptime to 99.99%.",
    achievements: [
      "Architected real-time collaboration engine with <50ms latency",
      "Led team of 8 engineers across 3 product squads",
      "Reduced infrastructure costs by 40% through optimization",
      "Established company-wide engineering standards and code review practices",
    ],
    company_url: "https://techforgelabs.com",
    sort_order: 0,
    published: true,
  },
  {
    company: "Quantum Digital",
    role: "Full-Stack Developer",
    location: "San Francisco, CA",
    start_date: "2021-01-01",
    end_date: "2023-01-01",
    description:
      "Built and maintained client-facing dashboards and internal tools processing millions of data points daily. Introduced automated testing that reduced production bugs by 65%.",
    achievements: [
      "Built analytics dashboard processing 10M+ events/day",
      "Introduced automated visual regression testing pipeline",
      "Mentored 4 junior developers to mid-level promotions",
      "Optimized database queries reducing P95 latency by 3x",
    ],
    company_url: "https://quantumdigital.io",
    sort_order: 1,
    published: true,
  },
  {
    company: "Pixel & Code",
    role: "Frontend Developer",
    location: "Portland, OR",
    start_date: "2019-01-01",
    end_date: "2021-01-01",
    description:
      "Developed interactive web experiences for Fortune 500 clients. Specialized in animation-heavy marketing sites and accessible component libraries.",
    achievements: [
      "Delivered 20+ client projects with 100% on-time rate",
      "Created an open-source animation library (3K+ GitHub stars)",
      "Achieved Lighthouse scores of 95+ across all client projects",
      "Spoke at 3 regional conferences on web animation",
    ],
    company_url: "https://pixelandcode.design",
    sort_order: 2,
    published: true,
  },
  {
    company: "StartupGrid",
    role: "Junior Developer",
    location: "Austin, TX",
    start_date: "2017-01-01",
    end_date: "2019-01-01",
    description:
      "Full-stack development in a fast-paced startup environment. Wore many hats — from frontend features to database optimization to deployment automation.",
    achievements: [
      "Built the MVP that secured $2M seed funding",
      "Scaled the platform from 0 to 50K users",
      "Implemented CI/CD pipeline reducing deploy time from hours to minutes",
    ],
    company_url: "https://startupgrid.co",
    sort_order: 3,
    published: true,
  },
];

const blogPosts = [
  {
    title: "Building Real-Time Collaboration with CRDTs",
    slug: "building-real-time-collaboration-crdts",
    excerpt:
      "A deep dive into conflict-free replicated data types and how we used them to build sub-50ms collaborative editing at scale.",
    content: "<p>Coming soon...</p>",
    tags: ["Architecture", "Real-Time", "Distributed Systems"],
    published: true,
    published_at: "2025-12-15T00:00:00Z",
    read_time_minutes: 12,
  },
  {
    title: "The Art of Web Animation: GSAP + React in 2026",
    slug: "art-of-web-animation-gsap-react-2026",
    excerpt:
      "Now that GSAP is fully free, here's how to build cinematic scroll experiences with ScrollTrigger, SplitText, and React 19.",
    content: "<p>Coming soon...</p>",
    tags: ["Animation", "React", "GSAP"],
    published: true,
    published_at: "2025-11-20T00:00:00Z",
    read_time_minutes: 8,
  },
  {
    title: "Scaling to 2M Users: Lessons from a Monolith Migration",
    slug: "scaling-2m-users-monolith-migration",
    excerpt:
      "What we learned migrating a 5-year-old monolith to microservices — the wins, the pain, and what we'd do differently.",
    content: "<p>Coming soon...</p>",
    tags: ["Backend", "Architecture", "DevOps"],
    published: true,
    published_at: "2025-09-05T00:00:00Z",
    read_time_minutes: 15,
  },
  {
    title: "TypeScript 5.9: The Features That Actually Matter",
    slug: "typescript-5-9-features-that-matter",
    excerpt:
      "Cutting through the noise — the TypeScript 5.9 features that will genuinely change how you write code every day.",
    content: "<p>Coming soon...</p>",
    tags: ["TypeScript", "Frontend"],
    published: true,
    published_at: "2025-07-12T00:00:00Z",
    read_time_minutes: 6,
  },
];

const resume = {
  full_name: "Alex Rivera",
  title: "Senior Full-Stack Software Developer",
  email: "hello@alexrivera.dev",
  location: "San Francisco, CA",
  website: "https://alexrivera.dev",
  linkedin: "https://linkedin.com/in/alexrivera",
  github: "https://github.com/alexrivera",
  summary:
    "Senior Full-Stack Developer with 8+ years of experience building scalable web applications, design systems, and developer tools. Specialized in React ecosystems, Node.js, and cloud architecture. Led teams of up to 8 engineers and delivered platforms serving 2M+ users.",
  education: [
    {
      school: "University of California, Berkeley",
      degree: "B.S. Computer Science",
      year: "2017",
    },
  ],
  certifications: [
    {
      name: "AWS Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      year: "2023",
    },
  ],
  additional_sections: [
    {
      title: "Open Source",
      items: [
        "Velocity CLI — 12K+ GitHub stars, 500+ contributors",
        "Aurora Design System — Enterprise-grade component library",
        "Regular contributor to React, Next.js, and GSAP ecosystems",
      ],
    },
  ],
};

// ---------- Seed function ----------

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Site settings
  const { error: e1 } = await supabase.from("site_settings").insert(siteSettings);
  console.log(e1 ? `❌ site_settings: ${e1.message}` : "✅ site_settings");

  // Hero
  const { error: e2 } = await supabase.from("hero_section").insert(heroSection);
  console.log(e2 ? `❌ hero_section: ${e2.message}` : "✅ hero_section");

  // About
  const { error: e3 } = await supabase.from("about_section").insert(aboutSection);
  console.log(e3 ? `❌ about_section: ${e3.message}` : "✅ about_section");

  // Projects
  const { error: e4 } = await supabase.from("projects").insert(projects);
  console.log(e4 ? `❌ projects: ${e4.message}` : `✅ projects (${projects.length} rows)`);

  // Skills
  const { error: e5 } = await supabase.from("skills").insert(skills);
  console.log(e5 ? `❌ skills: ${e5.message}` : `✅ skills (${skills.length} rows)`);

  // Experience
  const { error: e6 } = await supabase.from("experience").insert(experience);
  console.log(e6 ? `❌ experience: ${e6.message}` : `✅ experience (${experience.length} rows)`);

  // Blog posts
  const { error: e7 } = await supabase.from("blog_posts").insert(blogPosts);
  console.log(e7 ? `❌ blog_posts: ${e7.message}` : `✅ blog_posts (${blogPosts.length} rows)`);

  // Resume
  const { error: e8 } = await supabase.from("resume").insert(resume);
  console.log(e8 ? `❌ resume: ${e8.message}` : "✅ resume");

  console.log("\n🎉 Seed complete!");
}

seed().catch(console.error);
