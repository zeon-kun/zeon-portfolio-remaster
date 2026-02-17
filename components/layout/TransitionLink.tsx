"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { transitionState } from "@/lib/transition";
import { prefersReducedMotion } from "@/lib/motion";

interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

const EXIT_DURATION = 600; // ms — wait for loader overlay to fully cover the screen

export function TransitionLink({ href, children, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;

      // Let browser handle modifier-key clicks (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // External links — let browser handle
      if (href.startsWith("http") || href.startsWith("mailto:")) return;

      e.preventDefault();

      // Same page — skip transition
      if (href === pathname) return;

      // Already transitioning — ignore
      if (transitionState.phase !== "idle") return;

      // Reduced motion — navigate immediately
      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }

      // Start exit transition
      transitionState.targetHref = href;
      transitionState.setPhase("exiting");

      // Navigate after the loader overlay covers the screen
      setTimeout(() => {
        router.push(href);
      }, EXIT_DURATION);
    },
    [href, pathname, router, onClick]
  );

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
