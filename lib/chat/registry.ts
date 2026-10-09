import type { OrbState } from "thinking-orbs";
import type { Dictionary } from "@/lib/i18n";
import { PERSONAL_INFO, PROJECTS, WORK_EXPERIENCE } from "@/lib/content";

// Everything here is language-independent. Copy lives in locales/*.json, keyed by MessageId.

export type MessageId = keyof Dictionary["messages"];
export type GroupId = keyof Dictionary["groups"];
export type BlockId = "skills" | "roleHighlights" | "recentProject" | "openSource" | "contactLinks";

/** A message plus the parameters that fill its template, e.g. the company for "role". */
export type MessageRef = { id: MessageId; params?: Record<string, string> };

/** Build-time facts the client can't derive itself (filesystem + git). */
export type ChatFacts = {
  postCount: number;
  latestPost: { slug: string; title: string; date: string; description: string } | null;
  commitCount: number;
  latestCommit: string;
};

export type MessageDef = {
  id: MessageId;
  group: GroupId;
  slash: string;
  /** thinking-orbs state shown while this answer is "thinking". */
  orb: OrbState;
  /** Route that renders in the panel. */
  href?: string | ((facts: ChatFacts) => string | undefined);
  block?: BlockId;
  action?: "downloadCv";
  followUps: MessageRef[];
  /** Needs params, so it is only reachable through follow-up chips. */
  hidden?: boolean;
};

const pastRoles: MessageRef[] = WORK_EXPERIENCE.filter((w) => !w.current)
  .slice(0, 3)
  .map((w) => ({ id: "role", params: { company: w.company } }));

export const MESSAGES: MessageDef[] = [
  { id: "who", group: "about", slash: "/who", orb: "composing", followUps: [{ id: "stack" }, { id: "now" }, { id: "work" }] },
  { id: "stack", group: "about", slash: "/stack", orb: "working", block: "skills", followUps: [{ id: "certifications" }, { id: "work" }] },
  { id: "certifications", group: "about", slash: "/certs", orb: "searching", followUps: [{ id: "education" }, { id: "experience" }] },
  { id: "education", group: "about", slash: "/education", orb: "searching", followUps: [{ id: "experience" }, { id: "stack" }] },

  { id: "experience", group: "experience", slash: "/experience", orb: "searching", href: "/experience", followUps: pastRoles },
  { id: "now", group: "experience", slash: "/now", orb: "composing", followUps: [{ id: "experience" }, { id: "booking" }] },
  { id: "role", group: "experience", slash: "/role", orb: "searching", block: "roleHighlights", hidden: true, followUps: [{ id: "experience" }, { id: "work" }] },

  { id: "work", group: "work", slash: "/work", orb: "weaving", href: "/work", followUps: [{ id: "recentProject" }, { id: "openSource" }, { id: "thisSite" }] },
  { id: "recentProject", group: "work", slash: "/latest-project", orb: "weaving", block: "recentProject", followUps: [{ id: "work" }, { id: "openSource" }] },
  { id: "openSource", group: "work", slash: "/oss", orb: "weaving", block: "openSource", followUps: [{ id: "work" }, { id: "contact" }] },

  { id: "writing", group: "writing", slash: "/blog", orb: "searching", href: "/blog", followUps: [{ id: "latestPost" }, { id: "thisSite" }] },
  { id: "latestPost", group: "writing", slash: "/latest-post", orb: "searching", href: (f) => (f.latestPost ? `/blog/${f.latestPost.slug}` : undefined), followUps: [{ id: "writing" }, { id: "changelog" }] },
  { id: "thisSite", group: "writing", slash: "/site", orb: "composing", href: "/blog/building-this-portfolio", followUps: [{ id: "changelog" }, { id: "writing" }] },
  { id: "changelog", group: "writing", slash: "/changelog", orb: "searching", href: "/changelog", followUps: [{ id: "writing" }, { id: "thisSite" }] },

  { id: "ratecard", group: "hire", slash: "/ratecard", orb: "solving", href: "/ratecard", followUps: [{ id: "booking" }, { id: "pay" }] },
  { id: "booking", group: "hire", slash: "/book", orb: "connecting", href: "/booking", followUps: [{ id: "ratecard" }, { id: "contact" }] },
  { id: "pay", group: "hire", slash: "/pay", orb: "connecting", href: "/payme", followUps: [{ id: "booking" }, { id: "contact" }] },
  { id: "cv", group: "hire", slash: "/cv", orb: "composing", action: "downloadCv", followUps: [{ id: "contact" }, { id: "experience" }] },
  { id: "contact", group: "hire", slash: "/contact", orb: "connecting", block: "contactLinks", followUps: [{ id: "booking" }, { id: "cv" }] },

  { id: "market", group: "extras", slash: "/market", orb: "searching", href: "/market", followUps: [{ id: "pokedex" }, { id: "pay" }] },
  { id: "pokedex", group: "extras", slash: "/pokedex", orb: "shaping", href: "/pokedex", followUps: [{ id: "market" }, { id: "who" }] },
];

export const GROUP_ORDER: GroupId[] = ["about", "experience", "work", "writing", "hire", "extras"];

/** Dock toolbox, in Alt+1…9 order. */
export const TOOLBOX: MessageId[] = ["who", "work", "experience", "writing", "changelog", "ratecard", "booking", "pay", "contact"];

/** Shown on the empty thread. */
export const SUGGESTIONS = ["work", "ratecard", "booking", "writing", "changelog"] as const satisfies readonly MessageId[];

const BY_ID = new Map(MESSAGES.map((m) => [m.id, m]));

export function getMessage(id: MessageId): MessageDef {
  return BY_ID.get(id)!;
}

export function resolveHref(def: MessageDef, facts: ChatFacts): string | undefined {
  return typeof def.href === "function" ? def.href(facts) : def.href;
}

export function recentProject() {
  return [...PROJECTS].sort((a, b) => b.year - a.year)[0];
}

export function openSourceProjects() {
  return PROJECTS.filter((p) => p.links.some((l) => l.label === "GitHub"));
}

/** Values for every `{placeholder}` a message template can use. */
export function resolveVars(ref: MessageRef, facts: ChatFacts): Record<string, string | number> {
  const entry = WORK_EXPERIENCE.find((w) => w.company === ref.params?.company);
  const project = recentProject();
  const post = facts.latestPost;

  return {
    email: PERSONAL_INFO.email,
    roleCount: WORK_EXPERIENCE.length,
    currentCompany: WORK_EXPERIENCE.find((w) => w.current)?.company ?? WORK_EXPERIENCE[0].company,
    company: entry?.company ?? "",
    role: entry?.role ?? "",
    period: entry?.period ?? "",
    projectCount: PROJECTS.length,
    projectTitle: project.title,
    projectDescription: project.description,
    openSourceCount: openSourceProjects().length,
    postCount: facts.postCount,
    postTitle: post?.title ?? "",
    postDate: post?.date
      ? new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "",
    postDescription: post?.description ?? "",
    commitCount: facts.commitCount,
    latestCommit: facts.latestCommit,
  };
}

/** True when the facts a template depends on are missing (no git history at build, no posts). */
export function needsFallback(id: MessageId, facts: ChatFacts): boolean {
  if (id === "changelog") return facts.commitCount === 0;
  if (id === "latestPost") return facts.latestPost === null;
  return false;
}
