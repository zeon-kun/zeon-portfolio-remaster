"use client";

import { useEffect, useState } from "react";
import { Branches, Dish, Exploded, Format, Sieve, type HairlineProps } from "@lucasmarkes/hairline/react";
import Link from "next/link";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { format, type Dictionary } from "@/lib/i18n";
import {
  SUGGESTIONS,
  getMessage,
  needsFallback,
  resolveHref,
  resolveVars,
  type ChatFacts,
  type MessageRef,
} from "@/lib/chat/registry";
import { KineticOrb } from "@/components/orb/KineticOrb";
import { MessageBlock } from "@/components/chat/MessageBlocks";

/** `fresh` marks an exchange sent this visit — restored history appears without entrance motion. */
export type ThreadItem = { key: number; ref: MessageRef; status: "thinking" | "done"; fresh?: boolean };

type ThreadProps = {
  dict: Dictionary;
  facts: ChatFacts;
  items: ThreadItem[];
  pathname: string;
  onSend: (ref: MessageRef) => void;
};

const chipClass =
  "border border-foreground/15 px-2.5 py-1.5 text-left text-[11px] text-foreground/80 transition-[color,border-color,background-color,transform] duration-150 ease-out hover:border-accent-primary/60 hover:bg-accent-primary/5 hover:text-accent-primary active:scale-[0.97]";

const AVATAR_SRC = "/avatar.png";

/**
 * Who is answering. The orb plays its state while the reply is "thinking"; once the reply lands it
 * hands over to the portrait. If the portrait file is missing, the resting orb stays instead.
 */
function ReplyAvatar({ orb, done, fresh, name }: { orb: OrbState; done: boolean; fresh?: boolean; name: string }) {
  const [missing, setMissing] = useState(false);

  if (!done || missing) {
    return <ThinkingOrb size={32} state={orb} theme="light" paused={done} aria-hidden="true" className="mt-0.5 shrink-0" />;
  }

  return (
    <span className={`mt-0.5 block size-8 shrink-0 overflow-hidden rounded-full ${fresh ? "scale-in" : ""}`}>
      {/* The drawing sits small on a white canvas: zoom into the face, and multiply the white away. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AVATAR_SRC}
        alt={name}
        width={32}
        height={32}
        onError={() => setMissing(true)}
        className="size-full scale-[1.55] object-cover mix-blend-multiply"
      />
    </span>
  );
}

/** Stagger slot for the `rise-in` entrance (60ms per step). */
function step(i: number): React.CSSProperties {
  return { "--i": i } as React.CSSProperties;
}

// One isometric figure per starter card. Riffle is left out on purpose: it is a focusable,
// arrow-key widget of its own and cannot sit inside a button.
const SUGGESTION_FIGURES: Record<(typeof SUGGESTIONS)[number], React.ComponentType<HairlineProps>> = {
  work: Exploded,
  ratecard: Sieve,
  booking: Dish,
  writing: Format,
  changelog: Branches,
};

/** Touch screens have no pointer for the figures to follow, so there they loop on their own. */
function useTouchOnly(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(window.matchMedia("(hover: none)").matches), []);
  return touch;
}

function Greeting({ dict, onSend }: Pick<ThreadProps, "dict" | "onSend">) {
  const touch = useTouchOnly();

  return (
    <div className="flex flex-col items-center pt-4 text-center lg:pt-10">
      <div className="scale-in">
        <KineticOrb className="w-40 lg:w-56" />
      </div>
      <h1 className="rise-in heading-serif mt-6 text-3xl text-foreground lg:text-4xl" style={step(1)}>
        {dict.ui.greeting.headline}
      </h1>
      <p className="rise-in mt-2 text-xs font-mono text-muted" style={step(2)}>
        {dict.ui.greeting.subline}
      </p>

      {/* Stacked rows (figure beside text) on phones and in the narrow side column; five cards
          across once the column is wide enough. Nothing scrolls sideways. */}
      <ul className="mt-10 grid w-full gap-2.5 text-left @3xl:grid-cols-5 @3xl:gap-3">
        {SUGGESTIONS.map((id, i) => {
          const Figure = SUGGESTION_FIGURES[id];
          return (
            <li key={id} className="rise-in" style={step(3 + i)}>
              <button
                type="button"
                onClick={() => onSend({ id })}
                data-companion="ask"
                className="group flex h-full w-full items-center border border-foreground/10 bg-background text-left transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-primary/50 hover:bg-accent-primary/[0.03] active:scale-[0.98] @3xl:flex-col @3xl:items-stretch"
              >
                {/* Decorative: the button already names the action. */}
                <Figure
                  theme="light"
                  play={touch}
                  aria-hidden="true"
                  className="w-24 shrink-0 p-1.5 @3xl:w-full @3xl:px-2 @3xl:pb-0 @3xl:pt-2"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5 self-stretch border-l border-foreground/8 px-3 py-3 @3xl:border-l-0 @3xl:border-t">
                  <span className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-muted/70 transition-colors duration-150 group-hover:text-accent-primary">
                    {dict.messages[id].label}
                    <span aria-hidden="true" className="transition-transform duration-150 ease-out group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                  <span className="text-[13px] leading-snug text-foreground">{dict.messages[id].prompt}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Placeholder lines shown while the orb is "thinking", so the answer has somewhere to land. */
function ThinkingScene({ label }: { label: string }) {
  return (
    <div className="space-y-2.5" role="status">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">
        {label}
        <span className="thinking-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
      <div aria-hidden="true" className="space-y-2">
        <div className="skeleton h-3 w-11/12 bg-foreground/8" />
        <div className="skeleton h-3 w-7/12 bg-foreground/8" style={{ animationDelay: "160ms" }} />
      </div>
    </div>
  );
}

function Exchange({ item, dict, facts, pathname, onSend }: Omit<ThreadProps, "items"> & { item: ThreadItem }) {
  const def = getMessage(item.ref.id);
  const copy = dict.messages[item.ref.id];
  const vars = resolveVars(item.ref, facts);
  const done = item.status === "done";
  const href = resolveHref(def, facts);
  const template = needsFallback(def.id, facts) && "answerFallback" in copy ? copy.answerFallback : copy.answer;
  // The answer's parts arrive one after another; history restored from storage is simply there.
  const reveal = item.fresh ? "rise-in" : "";

  return (
    <article data-msg className="scroll-mt-4 space-y-4">
      <div className={`flex justify-end ${reveal}`}>
        <p className="max-w-[85%] bg-foreground/5 px-3 py-2 text-sm text-foreground">
          <span className="sr-only">{dict.ui.thread.you}: </span>
          {format(copy.prompt, vars)}
        </p>
      </div>

      <div className={`flex gap-3 ${reveal}`} style={step(1)}>
        <ReplyAvatar orb={def.orb} done={done} fresh={item.fresh} name={dict.ui.thread.assistant} />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="pt-2 text-[9px] font-mono uppercase tracking-[0.2em] text-muted/60">{dict.ui.thread.assistant}</p>

          {!done && <ThinkingScene label={dict.ui.thinking[def.orb]} />}

          {done && (
            <>
              <p className={`max-w-[68ch] text-[15px] leading-relaxed text-foreground ${reveal}`}>{format(template, vars)}</p>

              {def.block && (
                <div className={`max-w-[68ch] ${reveal}`} style={step(1)}>
                  <MessageBlock block={def.block} messageRef={item.ref} />
                </div>
              )}

              {href && href !== pathname && (
                <div className={reveal} style={step(2)}>
                  <Link
                    href={href}
                    className="group inline-block border border-accent-primary/40 bg-accent-primary/5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-accent-primary transition-[background-color,transform] duration-150 ease-out hover:bg-accent-primary/12 active:scale-[0.97]"
                  >
                    {dict.ui.panel.open} {format(copy.label, vars)}{" "}
                    <span aria-hidden="true" className="inline-block transition-transform duration-150 ease-out group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                </div>
              )}

              <div role="group" aria-label={dict.ui.thread.followUps} className="flex flex-wrap gap-1.5 pt-1">
                {def.followUps.map((ref, i) => (
                  <button
                    key={ref.id + (ref.params?.company ?? "")}
                    type="button"
                    onClick={() => onSend(ref)}
                    data-companion="ask"
                    className={`${chipClass} ${reveal}`}
                    style={step(3 + i)}
                  >
                    {format(dict.messages[ref.id].prompt, resolveVars(ref, facts))}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function Thread({ dict, facts, items, pathname, onSend }: ThreadProps) {
  if (items.length === 0) return <Greeting dict={dict} onSend={onSend} />;

  return (
    <div aria-live="polite" className="space-y-8">
      {items.map((item) => (
        <Exchange key={item.key} item={item} dict={dict} facts={facts} pathname={pathname} onSend={onSend} />
      ))}
    </div>
  );
}
