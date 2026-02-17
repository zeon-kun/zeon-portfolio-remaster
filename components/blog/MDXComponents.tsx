import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h2: (props) => (
    <h2
      {...props}
      className="text-lg font-black kanji-brutal text-foreground mt-10 mb-4 pb-2 border-b border-foreground/8"
    />
  ),
  h3: (props) => (
    <h3
      {...props}
      className="text-base font-bold text-foreground mt-8 mb-3"
    />
  ),
  p: (props) => (
    <p {...props} className="text-sm text-foreground/75 leading-relaxed mb-4" />
  ),
  ul: (props) => (
    <ul {...props} className="list-disc list-inside text-sm text-foreground/75 leading-relaxed mb-4 space-y-1 pl-2" />
  ),
  ol: (props) => (
    <ol {...props} className="list-decimal list-inside text-sm text-foreground/75 leading-relaxed mb-4 space-y-1 pl-2" />
  ),
  li: (props) => <li {...props} className="text-sm text-foreground/75" />,
  a: (props) => (
    <a
      {...props}
      className="text-accent-primary underline underline-offset-2 decoration-accent-primary/30 hover:decoration-accent-primary transition-colors"
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
    />
  ),
  code: (props) => {
    const isBlock = typeof props.className === "string" && props.className.includes("language-");
    if (isBlock) {
      return (
        <code {...props} className={`${props.className ?? ""} text-[13px]`} />
      );
    }
    return (
      <code
        {...props}
        className="px-1.5 py-0.5 text-[12px] font-mono bg-foreground/5 text-accent-primary border border-foreground/8"
      />
    );
  },
  pre: (props) => (
    <pre
      {...props}
      className="overflow-x-auto p-4 mb-4 text-[13px] font-mono bg-foreground/[0.03] border border-foreground/8 leading-relaxed"
    />
  ),
  blockquote: (props) => (
    <blockquote
      {...props}
      className="border-l-2 border-accent-primary/40 pl-4 my-4 text-sm text-muted italic"
    />
  ),
  hr: () => <hr className="my-8 border-foreground/8" />,
  strong: (props) => <strong {...props} className="font-bold text-foreground" />,
};
