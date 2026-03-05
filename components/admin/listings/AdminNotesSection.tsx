"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Send, Clock, User } from "lucide-react";

interface AdminNotesSectionProps {
    listingId: string;
    initialNotes: any[];
}

export default function AdminNotesSection({ listingId, initialNotes }: AdminNotesSectionProps) {
    const [notes, setNotes] = useState(initialNotes);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    async function addNote() {
        if (!note.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/listings/${listingId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: note.trim() }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to save note");
            setNotes((prev) => [json.note, ...prev]);
            setNote("");
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Internal Notes</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Private admin discussion</p>
                </div>
            </div>

            <div className="relative group">
                <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a private note about this listing..."
                    className="w-full rounded-2xl border border-border/50 bg-background/50 p-4 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-inner"
                />
                <button
                    type="button"
                    onClick={addNote}
                    disabled={saving || !note.trim()}
                    className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-6 space-y-4">
                {notes.length === 0 && (
                    <div className="py-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">No notes recorded yet</p>
                    </div>
                )}
                {notes.map((n: any) => (
                    <div key={n.id} className="relative rounded-2xl bg-muted/30 p-4 ring-1 ring-border/50 transition-colors hover:bg-muted/40">
                        <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">{n.note}</p>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 text-primary">
                                <User className="h-3 w-3" />
                                <span>{n.profiles?.full_name ?? "System"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground/60">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
