"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/subscription-helpers";

export function AssignPlacementModal({
    isOpen,
    onClose,
    onSuccess,
    categoryId,
    categoryName,
    position
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categoryId: string;
    categoryName: string;
    position: number;
}) {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    
    // Form state
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [durationDays, setDurationDays] = useState("30");

    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const delay = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/admin/listings/search?q=${encodeURIComponent(searchQuery)}`);
                const json = await res.json();
                setSearchResults(json.data || []);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(delay);
    }, [searchQuery]);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setSearchResults([]);
            setSelectedListing(null);
            setDurationDays("30");
        }
    }, [isOpen]);

    async function handleAssign(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedListing) return alert("Please select a listing first.");

        setLoading(true);

        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + Number(durationDays));

        try {
            const res = await fetch("/api/admin/top-search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category_id: categoryId,
                    listing_id: selectedListing.id,
                    position,
                    start_date: start.toISOString(),
                    end_date: end.toISOString(),
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to assign placement.");
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to assign placement.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Top Search Slot</DialogTitle>
                    <DialogDescription>
                        Assigning a listing to <span className="font-bold text-foreground">{categoryName}</span> at Position {position}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAssign} className="space-y-6 mt-4">
                    <div className="space-y-3">
                        <Label>Select Listing</Label>
                        {!selectedListing ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by business name..." 
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                                
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-auto">
                                        {searchResults.map((result) => (
                                            <button
                                                key={result.id}
                                                type="button"
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted font-medium"
                                                onClick={() => setSelectedListing(result)}
                                            >
                                                {result.business_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
                                <span className="font-bold text-emerald-800">{selectedListing.business_name}</span>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedListing(null)}
                                    className="text-xs text-emerald-600 hover:underline font-bold"
                                >
                                    Change
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label>Duration</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {["7", "14", "30"].map(days => (
                                <label key={days} className={cn(
                                    "flex items-center justify-center p-3 border rounded-xl cursor-pointer transition text-sm font-bold",
                                    durationDays === days ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20" : "hover:bg-muted text-muted-foreground"
                                )}>
                                    <input 
                                        type="radio" 
                                        className="sr-only" 
                                        name="duration" 
                                        value={days} 
                                        checked={durationDays === days} 
                                        onChange={() => setDurationDays(days)} 
                                    />
                                    {days} Days
                                </label>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-muted transition"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition"
                            disabled={loading || !selectedListing}
                        >
                            {loading ? "Assigning..." : "Assign Placement"}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
