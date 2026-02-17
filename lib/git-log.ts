import { execSync } from "child_process";

export type GitCommit = {
  hash: string;
  shortHash: string;
  date: string;
  subject: string;
};

export type GitLogGroup = {
  month: string;
  commits: GitCommit[];
};

const SEP = "\x1f";

export function getGitLog(): GitCommit[] {
  try {
    // This avoids errors if the script runs during a stage where .git is missing
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });

    // Check if the current environment is a shallow clone (common in Dokploy/CI)
    const isShallow =
      execSync("git rev-parse --is-shallow-repository", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() === "true";

    if (isShallow) {
      console.log("Detected shallow clone. Fetching full history for changelog...");
      execSync("git fetch --unshallow --filter=blob:none --tags", { stdio: "ignore" });
    }

    // We limit to 200 to keep the build from bloating if the repo gets massive
    const raw = execSync(`git log --pretty=format:"%H${SEP}%h${SEP}%ai${SEP}%s" --max-count=200`, {
      encoding: "utf-8",
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "ignore"],
    });

    if (!raw) return [];

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
  } catch (error) {
    // FAIL-SAFE: If git is missing or fetch fails, return empty so the build continues
    console.warn("Changelog Error: Could not retrieve git history. Returning empty list.");
    return [];
  }
}

export function groupByMonth(commits: GitCommit[]): GitLogGroup[] {
  const groups = new Map<string, GitCommit[]>();

  for (const commit of commits) {
    const d = new Date(commit.date);
    // Consistent date formatting across different server timezones
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(commit);
  }

  return Array.from(groups.entries()).map(([month, commits]) => ({
    month,
    commits,
  }));
}
