"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — StepProgress Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { Check } from "lucide-react";

const STEPS = [
    { label: "Category" },
    { label: "Info" },
    { label: "Location" },
    { label: "Details" },
    { label: "Photos" },
    { label: "Review" },
];

interface StepProgressProps {
    currentStep: number;
    totalSteps?: number;
    onStepClick?: (step: number) => void;
}

export default function StepProgress({ currentStep, onStepClick }: StepProgressProps) {
    return (
        <div className="w-full" data-testid="step-progress">
            {/* Mobile: simple "Step X of Y" */}
            <p className="mb-4 text-center text-sm text-gray-500 sm:hidden">
                Step {currentStep} of {STEPS.length} — <span className="font-medium text-gray-800">{STEPS[currentStep - 1]?.label}</span>
            </p>

            {/* Desktop: full step bar */}
            <div className="hidden sm:flex items-center justify-between">
                {STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;

                    return (
                        <div key={stepNum} className="flex items-center flex-1">
                            {/* Step circle */}
                            <button
                                type="button"
                                onClick={() => isCompleted && onStepClick?.(stepNum)}
                                disabled={!isCompleted}
                                className={`flex-shrink-0 flex flex-col items-center gap-1.5 group ${isCompleted ? "cursor-pointer" : "cursor-default"}`}
                            >
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${isCompleted
                                        ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                                        : isCurrent
                                            ? "border-[#FF6B35] bg-white text-[#FF6B35]"
                                            : "border-gray-200 bg-white text-gray-400"
                                        }`}
                                >
                                    {isCompleted ? <Check size={16} /> : stepNum}
                                </div>
                                <span
                                    className={`text-xs font-medium whitespace-nowrap ${isCurrent ? "text-[#FF6B35]" : isCompleted ? "text-gray-700" : "text-gray-400"
                                        }`}
                                >
                                    {step.label}
                                </span>
                            </button>

                            {/* Connector line */}
                            {idx < STEPS.length - 1 && (
                                <div
                                    className={`mx-2 h-0.5 flex-1 rounded transition-all ${isCompleted ? "bg-[#FF6B35]" : "bg-gray-200"
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile progress bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 sm:hidden">
                <div
                    className="h-1.5 rounded-full bg-[#FF6B35] transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
            </div>
        </div>
    );
}
