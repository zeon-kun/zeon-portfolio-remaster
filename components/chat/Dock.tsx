"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import type { Dictionary } from "@/lib/i18n";
import { PERSONAL_INFO } from "@/lib/content";
import { GROUP_ORDER, MESSAGES, TOOLBOX, getMessage, type MessageDef, type MessageRef } from "@/lib/chat/registry";

type DockProps = {
  dict: Dictionary;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSend: (ref: MessageRef) => void;
  /** Narrow column next to an open panel — drop the shortcut legend. */
  compact: boolean;
  /** Current route, to mark the toolbox item whose panel is open. */
  pathname: string;
};

const PICKABLE = MESSAGES.filter((m) => !m.hidden);

/** Composer (a filterable picker of predefined messages) plus the quick-nav toolbox. */
export function Dock({ dict, inputRef, onSend, compact, pathname }: DockProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  // A placeholder cannot be swapped with CSS, and the long one is cut off on a phone.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const placeholder = narrow || compact ? dict.ui.composer.placeholderShort : dict.ui.composer.placeholder;

  // Flat list in display order, so arrow keys walk straight through the groups.
  const options = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\//, "");
    const matches = (def: MessageDef) => {
      if (!q) return true;
      const copy = dict.messages[def.id];
      return [copy.prompt, copy.label, def.slash, dict.groups[def.group]].some((s) => s.toLowerCase().includes(q));
    };
    return GROUP_ORDER.flatMap((group) => PICKABLE.filter((m) => m.group === group && matches(m)));
  }, [query, dict]);

  const activeOption = options[Math.min(active, options.length - 1)];
  const optionId = (def: MessageDef) => `${listId}-${def.id}`;

  useEffect(() => {
    if (open && activeOption) document.getElementById(optionId(activeOption))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeOption]);

  function choose(def: MessageDef) {
    onSend({ id: def.id });
    setQuery("");
    setActive(0);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Ctrl+arrows belong to the shell (jump between messages).
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (options.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (Math.min(i, options.length - 1) + step + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeOption) choose(activeOption);
      else setOpen(true);
    } else if (e.key === "Escape" && open) {
      // Handled here so the shell doesn't also close the panel.
      e.preventDefault();
      setOpen(false);
    }
  }

  function onToolboxKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const buttons = Array.from(e.currentTarget.querySelectorAll("button"));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    e.preventDefault();
    buttons[(index + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length].focus();
  }

  const shortcuts = dict.ui.shortcuts;
  const legend: [string, string][] = [
    ["/", shortcuts.focusComposer],
    ["Alt+1–9", shortcuts.runTool],
    ["← →", shortcuts.walkToolbox],
    ["Ctrl+↑ ↓", shortcuts.jumpMessages],
    ["Esc", shortcuts.closePanel],
  ];

  return (
    <div className="relative space-y-2">
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={dict.ui.composer.placeholderShort}
          className="absolute bottom-full left-0 right-0 mb-2 max-h-[min(50dvh,420px)] overflow-y-auto border border-foreground/15 bg-background shadow-[0_-8px_32px_-12px_rgba(26,26,26,0.18)]"
        >
          {options.length === 0 ? (
            <div className="px-4 py-5 space-y-1.5">
              <p className="text-xs font-mono text-muted">{dict.ui.composer.noMatch}</p>
              <a
                href={`mailto:${PERSONAL_INFO.email}`}
                onMouseDown={(e) => e.preventDefault()}
                className="text-xs font-mono text-accent-primary underline underline-offset-4"
              >
                {dict.ui.composer.noMatchAction}
              </a>
            </div>
          ) : (
            GROUP_ORDER.map((group) => {
              const inGroup = options.filter((o) => o.group === group);
              if (inGroup.length === 0) return null;
              return (
                <div key={group} role="group" aria-label={dict.groups[group]}>
                  <p className="sticky top-0 bg-background px-4 pt-3 pb-1.5 text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50">
                    {dict.groups[group]}
                  </p>
                  {inGroup.map((def) => {
                    const selected = def === activeOption;
                    return (
                      <button
                        key={def.id}
                        id={optionId(def)}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        tabIndex={-1}
                        // Keep focus in the input so the picker doesn't close before the click lands.
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActive(options.indexOf(def))}
                        onClick={() => choose(def)}
                        className={`flex w-full items-baseline justify-between gap-4 px-4 py-2 text-left transition-colors duration-100 ${
                          selected ? "bg-accent-primary/8 text-foreground" : "text-foreground/80"
                        }`}
                      >
                        <span className="text-sm">{dict.messages[def.id].prompt}</span>
                        <span className={`shrink-0 text-[10px] font-mono ${selected ? "text-accent-primary" : "text-muted/40"}`}>
                          {def.slash}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}

      <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-accent-primary/90">
        <span className="sm:hidden">{dict.ui.composer.noticeShort}</span>
        <span className="hidden sm:inline">{dict.ui.composer.notice}</span>
      </p>

      <div data-companion="composer" className="flex items-center gap-3 border border-foreground/25 bg-background px-3.5 py-2.5 transition-colors duration-150 ease-out focus-within:border-foreground/60 focus-within:bg-background">
        <ThinkingOrb size={20} state={open ? "listening" : "breathing"} theme="light" aria-hidden="true" className="shrink-0" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeOption ? optionId(activeOption) : undefined}
          aria-label={dict.ui.composer.placeholder}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          // The global :focus-visible ring is unlayered and beats utilities; the wrapper border shows focus instead.
          style={{ outline: "none" }}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/50"
        />
        <button
          type="button"
          aria-label={dict.ui.composer.send}
          disabled={!open || !activeOption}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => activeOption && choose(activeOption)}
          className="shrink-0 text-[10px] font-mono uppercase tracking-[0.2em] text-muted transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-[0.95] disabled:text-muted/30 disabled:active:scale-100"
        >
          ↵ <span className="hidden sm:inline">{dict.ui.composer.send}</span>
        </button>
      </div>

      <div
        role="toolbar"
        aria-label={dict.ui.toolbox.label}
        onKeyDown={onToolboxKeyDown}
        className="flex flex-wrap gap-1 sm:gap-1.5"
      >
        {TOOLBOX.map((id, i) => {
          const current = getMessage(id).href === pathname;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSend({ id })}
              data-companion="ask"
              aria-current={current ? "page" : undefined}
              className={`flex items-center gap-2 border px-1.5 py-1.5 text-[9px] font-mono uppercase tracking-[0.06em] sm:px-2.5 sm:text-[10px] sm:tracking-[0.15em] transition-[color,border-color,background-color,transform] duration-150 ease-out hover:border-accent-primary/60 hover:bg-accent-primary/5 hover:text-accent-primary active:scale-[0.97] ${
                current
                  ? "border-accent-primary/60 bg-accent-primary/8 text-accent-primary"
                  : "border-foreground/15 bg-background text-foreground/80"
              }`}
            >
              <kbd className="hidden font-mono text-[9px] opacity-50 lg:inline">{i + 1}</kbd>
              {dict.messages[id].label}
            </button>
          );
        })}
      </div>

      {!compact && (
        <p aria-label={shortcuts.title} className="hidden flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono uppercase tracking-[0.14em] text-muted/50 lg:flex">
          {legend.map(([keys, label]) => (
            <span key={keys}>
              <kbd className="font-mono text-muted/80">{keys}</kbd> {label}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
