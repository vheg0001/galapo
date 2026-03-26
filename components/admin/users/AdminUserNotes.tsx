"use client";

import { useState, useEffect } from "react";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Save, Clock, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function AdminUserNotes({ userId }: { userId: string }) {
    const [note, setNote] = useState("");
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchNotes = async () => {
        setFetching(true);
        try {
            // Note: In our current schema, we might need a dedicated user_notes table 
            // or use the 'notes' field in profiles if it exists. 
            // For now, we'll simulate fetching from a notes history.
            // In a real implementation, this would be an API call to GET /api/admin/users/[id]/notes
            const mockHistory = [
                { id: 1, text: "Business owner requested information about premium upgrades.", created_at: new Date(Date.now() - 86400000 * 2).toISOString(), admin: "Admin" },
                { id: 2, text: "Account verified manually after phone call.", created_at: new Date(Date.now() - 86400000 * 10).toISOString(), admin: "SuperAdmin" }
            ];
            setHistory(mockHistory);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [userId]);

    const handleSave = async () => {
        if (!note.trim()) return;
        setLoading(true);
        try {
            // Simulate saving
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const newNote = {
                id: Date.now(),
                text: note,
                created_at: new Date().toISOString(),
                admin: "Current Admin"
            };
            
            setHistory([newNote, ...history]);
            setNote("");
            toast.success("Note saved successfully");
        } catch (err) {
            toast.error("Failed to save note");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-amber-100 shadow-sm overflow-hidden bg-amber-50/20">
            <CardHeader className="bg-amber-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                    <StickyNote className="h-5 w-5 text-amber-600" />
                    Internal Admin Notes
                </CardTitle>
                <CardDescription className="text-amber-800/60">
                    Private notes visible only to administrators.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                    <Textarea 
                        placeholder="Add a new note about this user..." 
                        className="bg-white border-amber-200 focus:ring-amber-500 min-h-[100px] resize-none"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <Button 
                        size="sm" 
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-md shadow-amber-100"
                        onClick={handleSave}
                        disabled={loading || !note.trim()}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Internal Note
                    </Button>
                </div>

                <div className="space-y-4 pt-4 border-t border-amber-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800/50 flex items-center gap-2">
                        <History className="h-3 w-3" />
                        Note History
                    </h4>
                    
                    {fetching ? (
                        <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-amber-400" /></div>
                    ) : history.length === 0 ? (
                        <p className="text-sm text-amber-800/40 italic text-center py-4">No historical notes.</p>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {history.map((h) => (
                                <div key={h.id} className="p-3 bg-white rounded-lg border border-amber-100 shadow-sm relative group animate-in fade-in duration-300">
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{h.text}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-amber-700/60 uppercase">{h.admin}</span>
                                        <span className="text-[10px] text-gray-400 flex items-center">
                                            <Clock className="h-2.5 w-2.5 mr-1" />
                                            {format(new Date(h.created_at), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
