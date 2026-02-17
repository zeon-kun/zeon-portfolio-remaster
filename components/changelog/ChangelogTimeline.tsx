import type { GitLogGroup } from "@/lib/git-log";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function ChangelogTimeline({ groups }: { groups: GitLogGroup[] }) {
  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section key={group.month}>
          {/* Month header */}
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted mb-6 border-b border-foreground/8 pb-3">
            {group.month}
          </h2>

          <div className="space-y-0">
            {group.commits.map((commit) => (
              <div
                key={commit.hash}
                className="group flex items-start gap-4 py-3 border-b border-foreground/4 last:border-b-0 hover:bg-foreground/[0.02] transition-colors duration-150"
              >
                {/* Hash */}
                <code className="shrink-0 text-[11px] font-mono text-accent-primary/70 tracking-wider pt-0.5">
                  {commit.shortHash}
                </code>

                {/* Subject */}
                <p className="flex-1 text-sm text-foreground/80 leading-relaxed">
                  {commit.subject}
                </p>

                {/* Date + time */}
                <span className="shrink-0 text-[10px] font-mono text-muted/60 tracking-wider pt-0.5 hidden sm:block">
                  {formatDate(commit.date)} {formatTime(commit.date)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
