"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PublishSettingsProps {
    isPublished: boolean;
    isFeatured: boolean;
    publishedAt: string;
    authorName: string;
    onChange: (field: string, value: string | boolean) => void;
}

export default function PublishSettings({ isPublished, isFeatured, publishedAt, authorName, onChange }: PublishSettingsProps) {
    return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Publish Settings</h3>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        value={isPublished ? "published" : "draft"}
                        onChange={(event) => onChange("is_published", event.target.value === "published")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="publishedAt">Published Date</Label>
                    <Input
                        id="publishedAt"
                        type="datetime-local"
                        value={publishedAt}
                        onChange={(event) => onChange("published_at", event.target.value)}
                    />
                </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm font-medium text-foreground">
                <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(event) => onChange("is_featured", event.target.checked)}
                    className="h-4 w-4"
                />
                <span>Feature this post (only one featured post at a time)</span>
            </label>

            <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Author: <span className="font-medium text-foreground">{authorName}</span>
            </div>
        </div>
    );
}