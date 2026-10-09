import { PERSONAL_INFO, SKILLS, WORK_EXPERIENCE } from "@/lib/content";
import { openSourceProjects, recentProject, type BlockId, type MessageRef } from "@/lib/chat/registry";

const linkClass =
  "text-accent-primary underline underline-offset-4 decoration-accent-primary/30 hover:decoration-accent-primary transition-colors";
const labelClass = "text-[9px] font-mono uppercase tracking-[0.2em] text-muted/60";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a href={href} className={linkClass} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

function Skills() {
  return (
    <dl className="space-y-2">
      {SKILLS.map((group) => (
        <div key={group.label} className="flex gap-4 border-b border-foreground/6 pb-2">
          <dt className={`${labelClass} w-24 shrink-0 pt-0.5`}>{group.label}</dt>
          <dd className="text-xs font-mono text-foreground/80 leading-relaxed">{group.items.join(" · ")}</dd>
        </div>
      ))}
    </dl>
  );
}

function RoleHighlights({ company }: { company?: string }) {
  const entry = WORK_EXPERIENCE.find((w) => w.company === company);
  if (!entry) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted leading-relaxed">{entry.description}</p>
      <ul className="space-y-1.5">
        {entry.highlights.map((h) => (
          <li key={h} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
            <span aria-hidden="true" className="text-accent-primary/60 shrink-0">
              —
            </span>
            {h}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentProject() {
  const project = recentProject();
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-muted">{project.tech.join(" · ")}</p>
      <p className="flex gap-4 text-xs font-mono">
        {project.links.map((l) => (
          <ExternalLink key={l.href} href={l.href}>
            {l.label} ↗
          </ExternalLink>
        ))}
      </p>
    </div>
  );
}

function OpenSource() {
  return (
    <ul className="space-y-2">
      {openSourceProjects().map((p) => (
        <li key={p.id} className="border-b border-foreground/6 pb-2">
          <ExternalLink href={p.links.find((l) => l.label === "GitHub")!.href}>{p.title} ↗</ExternalLink>
          <p className="text-xs text-muted leading-relaxed mt-0.5">{p.tagline}</p>
        </li>
      ))}
    </ul>
  );
}

function ContactLinks() {
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono">
      <ExternalLink href={`mailto:${PERSONAL_INFO.email}`}>Email</ExternalLink>
      <ExternalLink href={PERSONAL_INFO.github}>GitHub ↗</ExternalLink>
      <ExternalLink href={PERSONAL_INFO.linkedin}>LinkedIn ↗</ExternalLink>
    </p>
  );
}

/** Structured content rendered under an answer, straight from lib/content. */
export function MessageBlock({ block, messageRef }: { block: BlockId; messageRef: MessageRef }) {
  switch (block) {
    case "skills":
      return <Skills />;
    case "roleHighlights":
      return <RoleHighlights company={messageRef.params?.company} />;
    case "recentProject":
      return <RecentProject />;
    case "openSource":
      return <OpenSource />;
    case "contactLinks":
      return <ContactLinks />;
  }
}
