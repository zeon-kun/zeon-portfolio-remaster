import Link from "next/link";
import { Query } from "@lucasmarkes/hairline/react";

export default function NotFound() {
  return (
    <div className="px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Query theme="light" play className="w-full max-w-[280px]" />
        <h1 className="mt-4 text-6xl font-black kanji-brutal text-foreground">404</h1>
        <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted">
          Page not found · ページが見つかりません
        </p>
        <Link
          href="/"
          className="mt-8 text-[10px] font-mono uppercase tracking-[0.25em] text-accent-primary underline underline-offset-4 decoration-accent-primary/30 hover:decoration-accent-primary transition-colors"
        >
          ← Back to the chat
        </Link>
      </div>
    </div>
  );
}
