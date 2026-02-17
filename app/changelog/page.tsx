import type { Metadata } from "next";
import { getGitLog, groupByMonth } from "@/lib/git-log";
import { ChangelogTimeline } from "@/components/changelog/ChangelogTimeline";

export const metadata: Metadata = {
  title: "変更履歴 — Changelog | Zeon",
  description: "Build history and commit log for this portfolio.",
};

export const dynamic = "force-static";

export default function ChangelogPage() {
  const commits = getGitLog();
  const groups = groupByMonth(commits);

  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">
            変更履歴
          </h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
            Changelog — {commits.length} commits
          </p>
        </header>

        <ChangelogTimeline groups={groups} />
      </div>
    </main>
  );
}
