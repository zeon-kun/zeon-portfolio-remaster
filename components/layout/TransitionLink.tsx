import Link from "next/link";

interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

/** Internal links swap the panel via the router; external and mailto links are plain anchors. */
export function TransitionLink({ href, children, ...props }: TransitionLinkProps) {
  if (href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
