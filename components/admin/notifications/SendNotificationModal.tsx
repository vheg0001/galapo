"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Megaphone, 
    Send, 
    User, 
    AlertTriangle, 
    Loader2,
    Info
} from "lucide-react";
import { toast } from "react-hot-toast";

interface SendNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SendNotificationModal({ isOpen, onClose, onSuccess }: SendNotificationModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("system");
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [userId, setUserId] = useState("");

    const handleSend = async () => {
        if (!title || !message) {
            toast.error("Please fill in all required fields.");
            return;
        }

        if (!isBroadcast && !userId) {
            toast.error("Please provide a User ID for targeted notifications.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    message,
                    type,
                    broadcast: isBroadcast,
                    user_id: isBroadcast ? null : userId,
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success(data.message);
            onSuccess();
            onClose();
            // Reset form
            setTitle("");
            setMessage("");
            setType("system");
            setIsBroadcast(false);
            setUserId("");
        } catch (err: any) {
            toast.error(err.message || "Failed to send notification.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-indigo-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                            <Megaphone className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">New Notification</DialogTitle>
                            <DialogDescription className="text-indigo-100/80">
                                Send a message to one or all business owners.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Notification Title
                            </Label>
                            <Input 
                                id="title"
                                placeholder="e.g. Platform Update: New Features"
                                className="h-11 border-gray-200 focus:ring-indigo-500"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Content Message
                            </Label>
                            <Textarea 
                                id="message"
                                placeholder="Describe the notification details..."
                                className="min-h-[120px] resize-none border-gray-200 focus:ring-indigo-500"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Notification Category
                                </Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="system">General System</SelectItem>
                                        <SelectItem value="annual_check">Annual Check</SelectItem>
                                        <SelectItem value="payment_confirmed">Payment Confirmation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col justify-end pb-3">
                                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <Checkbox 
                                        id="broadcast" 
                                        checked={isBroadcast} 
                                        onCheckedChange={(checked) => setIsBroadcast(!!checked)}
                                    />
                                    <Label 
                                        htmlFor="broadcast" 
                                        className="text-sm font-bold text-indigo-700 cursor-pointer flex items-center gap-2"
                                    >
                                        Broadcast to all
                                        <Info className="h-3.5 w-3.5 text-indigo-400" />
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {!isBroadcast && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="userId" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Recipient User ID
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="userId"
                                        placeholder="Paste the user's UUID here..."
                                        className="h-11 pl-10 border-gray-200 focus:ring-indigo-500"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium">
                                    * Found in the Business Owners list or detail page.
                                </p>
                            </div>
                        )}

                        {isBroadcast && (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-orange-900">Important Warning</p>
                                    <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                        Broadcasting will send this notification to EVERY registered business owner on the platform. Use this only for critical updates or city-wide directory announcements.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 bg-gray-50/50 border-t items-center justify-between">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="h-11">
                        Cancel
                    </Button>
                    <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 shadow-lg shadow-indigo-100 group gap-2"
                        onClick={handleSend}
                        disabled={loading}
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                        ) : (
                            <>
                                Send Notification
                                <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
