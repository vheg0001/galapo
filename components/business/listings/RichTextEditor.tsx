"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — RichTextEditor Component (Module 9.1)
// Simple bold/italic/bullet/link toolbar using execCommand
// ──────────────────────────────────────────────────────────

import { useRef, useCallback, useEffect } from "react";
import { Bold, Italic, List, Link as LinkIcon } from "lucide-react";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = "Describe your business...",
    className = "",
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalUpdate = useRef(false);

    // Sync value → editor when value changes externally
    useEffect(() => {
        if (!editorRef.current) return;
        if (editorRef.current.innerHTML !== value) {
            isInternalUpdate.current = true;
            editorRef.current.innerHTML = value || "";
            isInternalUpdate.current = false;
        }
    }, [value]);

    const exec = useCallback((command: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, val);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    }, [onChange]);

    const handleInput = useCallback(() => {
        if (!isInternalUpdate.current && editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const handleLink = useCallback(() => {
        const url = window.prompt("Enter URL:", "https://");
        if (url) exec("createLink", url);
    }, [exec]);

    const ToolbarButton = ({
        onClick,
        title,
        children,
    }: {
        onClick: () => void;
        title: string;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition"
        >
            {children}
        </button>
    );

    return (
        <div className={`overflow-hidden rounded-lg border border-gray-200 focus-within:border-[#FF6B35] focus-within:ring-1 focus-within:ring-[#FF6B35]/20 transition ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 border-b border-gray-100 bg-gray-50 px-2 py-1.5">
                <ToolbarButton onClick={() => exec("bold")} title="Bold">
                    <Bold size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec("italic")} title="Italic">
                    <Italic size={15} />
                </ToolbarButton>
                <div className="mx-1.5 h-4 w-px bg-gray-200" />
                <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet List">
                    <List size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={handleLink} title="Insert Link">
                    <LinkIcon size={15} />
                </ToolbarButton>
            </div>

            {/* Editor area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                data-placeholder={placeholder}
                className={`min-h-[140px] p-3 text-sm text-gray-800 outline-none leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_a]:text-[#FF6B35] [&_a]:underline prose-sm before:empty:text-gray-400 before:empty:content-[attr(data-placeholder)]`}
            />
        </div>
    );
}
