"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: Option[];
    placeholder: string;
    className?: string;
    buttonClassName?: string;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder,
    className = "",
    buttonClassName = "",
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between text-left focus:outline-none ${buttonClassName}`}
            >
                <span className={`block whitespace-normal leading-tight text-left ${selectedOption ? "text-foreground" : "text-foreground"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 slide-in-from-top-2">
                    <button
                        type="button"
                        onClick={() => {
                            onChange("");
                            setIsOpen(false);
                        }}
                        className={`relative flex w-full cursor-default select-none items-start rounded-sm py-2 pl-4 pr-4 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 ${!value ? "bg-slate-50 font-medium text-secondary" : "text-foreground"
                            }`}
                    >
                        <span className="block text-left leading-tight">{placeholder}</span>
                    </button>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`relative flex w-full cursor-default select-none items-start rounded-sm py-2 pl-4 pr-4 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 ${value === opt.value ? "bg-slate-50 font-medium text-secondary" : "text-foreground"
                                }`}
                        >
                            <span className="block whitespace-normal text-left leading-tight">{opt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
