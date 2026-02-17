import { execSync } from "child_process";

export type GitCommit = {
  hash: string;
  shortHash: string;
  date: string;
  subject: string;
};

export type GitLogGroup = {
  month: string; // e.g. "February 2026"
  commits: GitCommit[];
};

const SEP = "\x1f"; // ASCII Unit Separator — never appears in git output

export function getGitLog(): GitCommit[] {
  const raw = execSync(
    `git log --pretty=format:"%H${SEP}%h${SEP}%ai${SEP}%s" --max-count=200`,
    { encoding: "utf-8", cwd: process.cwd() }
  );

  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(SEP);
      if (parts.length < 4) return null;
      return {
        hash: parts[0],
        shortHash: parts[1],
        date: parts[2],
        subject: parts.slice(3).join(SEP),
      };
    })
    .filter((c): c is GitCommit => c !== null);
}

export function groupByMonth(commits: GitCommit[]): GitLogGroup[] {
  const groups = new Map<string, GitCommit[]>();

  for (const commit of commits) {
    const d = new Date(commit.date);
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(commit);
  }

  return Array.from(groups.entries()).map(([month, commits]) => ({ month, commits }));
}
