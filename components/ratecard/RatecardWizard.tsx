"use client";

import { useState, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";
import { useLang } from "@/lib/language";
import {
  DIMENSIONS,
  DEFAULT_SELECTIONS,
  prefillFromText,
  computeScore,
  estimateRates,
} from "@/lib/ratecard";
import type { Selections, TierPoints } from "@/lib/ratecard";
import { PasteStep } from "./PasteStep";
import { DimensionStep } from "./DimensionStep";
import { ProgressRail } from "./ProgressRail";
import { ResultCard } from "./ResultCard";

gsap.registerPlugin(useGSAP);

type WizardState =
  | { kind: "paste" }
  | { kind: "interview"; index: number }
  | { kind: "result" };

export function RatecardWizard() {
  const lang = useLang();
  const [text, setText] = useState("");
  const [selections, setSelections] = useState<Selections>({ ...DEFAULT_SELECTIONS });
  const [wizardState, setWizardState] = useState<WizardState>({ kind: "paste" });

  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);

  const { score, estimate } = useMemo(() => {
    const s = computeScore(selections);
    return { score: s, estimate: estimateRates(s) };
  }, [selections]);

  // Animate step transitions
  const stepKey =
    wizardState.kind === "interview" ? `interview-${wizardState.index}` : wizardState.kind;

  useGSAP(
    () => {
      const el = stepRef.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1, x: 0 });
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }
      );
    },
    { dependencies: [stepKey], scope: containerRef }
  );

  function handlePasteContinue(pastedText: string) {
    const newText = pastedText;
    setText(newText);
    const prefilled = prefillFromText(newText);
    setSelections(prefilled);
    setWizardState({ kind: "interview", index: 0 });
  }

  function handleTierChange(index: number, value: TierPoints) {
    const dim = DIMENSIONS[index];
    setSelections((prev) => ({ ...prev, [dim.id]: value }));
  }

  function handleNext(index: number) {
    if (index < DIMENSIONS.length - 1) {
      setWizardState({ kind: "interview", index: index + 1 });
    } else {
      setWizardState({ kind: "result" });
    }
  }

  function handleBack(index: number) {
    if (index > 0) {
      setWizardState({ kind: "interview", index: index - 1 });
    } else {
      setWizardState({ kind: "paste" });
    }
  }

  function handleRestart() {
    setWizardState({ kind: "paste" });
  }

  const progressCurrent =
    wizardState.kind === "paste"
      ? -1
      : wizardState.kind === "interview"
        ? wizardState.index
        : DIMENSIONS.length;

  return (
    <div ref={containerRef} className="flex gap-6 md:gap-10">
      {/* Progress rail — hidden on paste and result for cleanliness */}
      {wizardState.kind === "interview" && (
        <div className="flex-shrink-0 pt-1">
          <ProgressRail
            total={DIMENSIONS.length}
            current={progressCurrent}
            lang={lang}
          />
        </div>
      )}

      {/* Step content */}
      <div ref={stepRef} className="flex-1 min-w-0">
        {wizardState.kind === "paste" && (
          <PasteStep initialText={text} onContinue={handlePasteContinue} lang={lang} />
        )}

        {wizardState.kind === "interview" && (
          <DimensionStep
            dimension={DIMENSIONS[wizardState.index]}
            value={selections[DIMENSIONS[wizardState.index].id]}
            onChange={(v) => handleTierChange(wizardState.index, v)}
            onNext={() => handleNext(wizardState.index)}
            onBack={() => handleBack(wizardState.index)}
            index={wizardState.index}
            total={DIMENSIONS.length}
            lang={lang}
          />
        )}

        {wizardState.kind === "result" && (
          <ResultCard score={score} estimate={estimate} onRestart={handleRestart} lang={lang} />
        )}
      </div>
    </div>
  );
}
