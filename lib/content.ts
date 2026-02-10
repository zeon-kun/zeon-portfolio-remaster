export const PERSONAL_INFO = {
  name: "Muhammad Rafif Tri Risqullah",
  alias: "Jeong / Rafif",
  title: "Software Engineer",
  location: "Based Remotely",
  email: "rafif.zeon@gmail.com",
  github: "https://github.com/zeon-kun",
  linkedin: "https://linkedin.com/in/muhammad-rafif-tri-risqullah-65311421a",
  summary:
    "Junior Developer with Fullstack Development experience at Huawei. Google-certified Associate Cloud Engineer with experience building full-stack applications. Proven track record in teaching complex programming concepts and delivering production-ready software solutions through systematic problem-solving and architectural thinking.",
  education: {
    institution: "Institut Teknologi Sepuluh Nopember",
    location: "Surabaya, Indonesia",
    degree: "Bachelor of Informatics Engineering",
    gpa: "3.48/4.00",
    period: "Sep 2021 — Sep 2025",
    highlights: [
      "Contributed in Pekan Kreatifitas Mahasiswa (PKM) with Alpha Academy Team, reached finals in PIMNAS 36",
      "Teaching Assistant in Database System, Fundamental Programming, Data Structure, Network Computing, and Operation System",
    ],
  },
} as const;

export type SkillCategory = {
  label: string;
  items: string[];
};

export const SKILLS: SkillCategory[] = [
  { label: "Languages", items: ["C", "C++", "PHP", "Python", "JavaScript", "TypeScript", "Solidity"] },
  { label: "Frameworks", items: ["Express.js", "Laravel", "Next.js"] },
  { label: "Databases", items: ["MySQL", "PostgreSQL", "SQLite"] },
  { label: "Tools", items: ["Docker", "Linux", "Figma"] },
  { label: "Cloud", items: ["GCP (ACE Certified)"] },
];

export type Certification = {
  title: string;
  issuer: string;
  year: number;
};

export const CERTIFICATIONS: Certification[] = [
  { title: "Associate Cloud Engineer", issuer: "Google", year: 2024 },
  { title: "English for Business Communication", issuer: "The British Institute", year: 2024 },
  { title: "English EFL Test", issuer: "ITS", year: 2021 },
];

export type WorkEntry = {
  company: string;
  location: string;
  role: string;
  period: string;
  description: string;
  highlights: string[];
};

export const WORK_EXPERIENCE: WorkEntry[] = [
  {
    company: "Huawei",
    location: "Jakarta Selatan, Indonesia",
    role: "Full Stack Developer",
    period: "Nov 2025 — Present",
    description:
      "Multinational technology company providing ICT infrastructure, smart devices, and consumer electronics.",
    highlights: [
      "Contributing to the full-stack development of a high-impact application for Indosat, translating client specifications into functional technical features",
      "Collaborating within a multi-vendor environment — including Nokia and Deloitte — participating in technical syncs and requirements gathering conducted in English",
    ],
  },
  {
    company: "DPTSI ITS",
    location: "Surabaya, Indonesia",
    role: "Backend Developer Intern",
    period: "Sep 2024 — Jan 2025",
    description: "Direktorat Pengembangan Teknologi dan Sistem Informasi ITS.",
    highlights: [
      "Refactored the Webinar booking module using Laravel with a team of 2, delivered to stakeholder satisfaction in 4 months",
      "Implemented SOLID principles and Domain-Driven Design (DDD) with well-defined layers",
      "Integrated external APIs (Zoom API) and DPTSI Laravel libraries to optimize module performance",
    ],
  },
  {
    company: "Bangkit Academy",
    location: "Indonesia",
    role: "Cloud Computing Cohort",
    period: "Feb 2024 — Jul 2024",
    description: "Led by Google, Tokopedia, Gojek, & Traveloka.",
    highlights: [
      "Completed over 100 hours of intensive coursework in cloud computing, networking, IT & system administration, and GCP services",
      "Developed Glucofit, a cloud-based health monitoring platform, collaborating with cross-functional teams",
      "Built integrated backend services using Express.js and Flask, deployed on Google Cloud Platform",
    ],
  },
];

export type OrgEntry = {
  name: string;
  location: string;
  role: string;
  period: string;
  highlights: string[];
};

export const ORGANIZATIONS: OrgEntry[] = [
  {
    name: "Schematics",
    location: "Surabaya, Indonesia",
    role: "Expert Creative Team Staff",
    period: "Jul 2022 — Dec 2023",
    highlights: [
      "Designed and developed creative concepts for decorative purposes",
      "Contributed to 10+ social media designs, enhancing visual engagement",
      "Participated in and led event preparations and live execution",
    ],
  },
  {
    name: "Dies Natalis ITS 63",
    location: "Surabaya, Indonesia",
    role: "Expert Event Staff",
    period: "Aug 2023 — Nov 2023",
    highlights: [
      "Contributed in creating the event concept of Esport tournament",
      "Managed the team and staffs throughout 2 months of work",
    ],
  },
];

export type Project = {
  id: string;
  title: string;
  year: number;
  tagline: string;
  description: string;
  tech: string[];
  links: { label: string; href: string }[];
};

export const PROJECTS: Project[] = [
  {
    id: "artchain",
    title: "ArtChain",
    year: 2025,
    tagline: "Web3 revenue model for artist-fan interaction",
    description:
      "Proposed web3 contracts for implementing a new revenue model for artist-fan interaction. Smart contracts handle royalty distribution and fan engagement mechanics on-chain.",
    tech: ["Solidity", "Sepolia Testnet", "Web3"],
    links: [{ label: "GitHub", href: "https://github.com/zeon-kun/artchain" }],
  },
  {
    id: "sim-mbkm",
    title: "SIM MBKM",
    year: 2025,
    tagline: "Academic management system with microservices",
    description:
      "Academic Management Information System for MBKM activities. Uses microservices architecture and DevOps pipeline. Includes integrated SSO authentication, User Management System (RBAC), Assessment Management, and Data Report Management.",
    tech: ["Microservices", "DevOps", "SSO", "RBAC"],
    links: [{ label: "GitHub", href: "https://github.com/sim-mbkm" }],
  },
  {
    id: "glucofit",
    title: "Glucofit",
    year: 2024,
    tagline: "AI-powered diabetes prevention app",
    description:
      "Health & Wellness Management Application. AI-powered mobile application for diabetes prevention in Indonesia, featuring food image recognition and personalized nutrition tracking capabilities.",
    tech: ["Express.js", "Flask", "GCP", "Machine Learning"],
    links: [{ label: "GitHub", href: "https://github.com/glucofit" }],
  },
  {
    id: "minecraft-server",
    title: "Minecraft Server Management",
    year: 2024,
    tagline: "Docker-based game server hosting solution",
    description:
      "Complete solution offering both legacy screen-based scripts and modern Docker deployment options for flexible server hosting.",
    tech: ["Docker", "Bash", "Linux"],
    links: [{ label: "GitHub", href: "https://github.com/zeon-kun/mc-server" }],
  },
];
