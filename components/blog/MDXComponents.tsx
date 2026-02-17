import type { MDXComponents } from "mdx/types";
import { isValidHex, getContrastText, expandHex } from "@/lib/colors";

export const mdxComponents: MDXComponents = {
  h2: (props) => <h2 {...props} className="text-xl heading-serif mt-10 mb-4 border-b border-foreground/8 pb-2" />,
  h3: (props) => <h3 {...props} className="text-base heading-serif mt-8 mb-3" />,
  p: (props) => <p {...props} className="text-sm text-foreground/75 leading-relaxed mb-4" />,
  ul: (props) => (
    <ul {...props} className="list-disc list-inside text-sm text-foreground/75 leading-relaxed mb-4 space-y-1 pl-2" />
  ),
  ol: (props) => (
    <ol
      {...props}
      className="list-decimal list-inside text-sm text-foreground/75 leading-relaxed mb-4 space-y-1 pl-2"
    />
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
      return <code {...props} className={`${props.className ?? ""} text-[13px]`} />;
    }

    const content = typeof props.children === "string" ? props.children.trim() : "";

    if (isValidHex(content)) {
      const expandedHex = expandHex(content);
      const textColor = getContrastText(expandedHex);

      return (
        <code
          {...props}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono rounded-sm"
          style={{
            color: textColor,
          }}
        >
          <span
            className="w-2 h-2 rounded-full border border-foreground/20"
            style={{ backgroundColor: expandedHex, filter: "brightness(0.9)" }}
          />
          {content}
        </code>
      );
    }

    return <code {...props} className="px-1.5 py-0.5 text-[12px] font-mono bg-foreground/5 text-accent-primary" />;
  },
  pre: (props) => (
    <pre
      {...props}
      className="overflow-x-auto p-4 mb-4 text-[13px] font-mono bg-foreground/[0.03] border border-foreground/8 leading-relaxed"
    />
  ),
  blockquote: (props) => (
    <blockquote {...props} className="border-l-2 border-accent-primary/40 pl-4 my-4 text-sm text-muted italic" />
  ),
  hr: () => <hr className="my-8 border-foreground/8" />,
  strong: (props) => <strong {...props} className="font-semibold text-foreground" />,

  // Table components - fixed for GFM syntax
  table: (props) => (
    <div className="overflow-x-auto mb-6">
      <table {...props} className="w-full text-sm border border-foreground/8 border-collapse" />
    </div>
  ),
  thead: (props) => <thead {...props} className="bg-foreground/[0.02]" />,
  tbody: (props) => <tbody {...props} className="" />,
  tr: (props) => <tr {...props} className="border-b border-foreground/8 last:border-b-0" />,
  th: (props) => {
    // Handle alignment from GFM syntax (:--, --:, :---:)
    const align = props.align || (props.style?.textAlign as string);
    const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

    return (
      <th
        {...props}
        className={`${alignClass} py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider border-b border-foreground/10`}
      />
    );
  },
  td: (props) => {
    const align = props.align || (props.style?.textAlign as string);
    const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

    return <td {...props} className={`${alignClass} py-3 px-4 text-foreground/75 align-top`} />;
  },
};
