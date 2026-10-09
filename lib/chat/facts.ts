import { getAllPosts } from "@/lib/blog";
import { getGitLog } from "@/lib/git-log";
import type { ChatFacts } from "@/lib/chat/registry";

/** Server-only: reads the filesystem and git. Called from the root layout at build time. */
export function getChatFacts(): ChatFacts {
  const posts = getAllPosts();
  const commits = getGitLog();
  const latest = posts[0];

  return {
    postCount: posts.length,
    latestPost: latest
      ? { slug: latest.slug, title: latest.title, date: latest.date, description: latest.description }
      : null,
    commitCount: commits.length,
    latestCommit: commits[0]?.subject ?? "",
  };
}
