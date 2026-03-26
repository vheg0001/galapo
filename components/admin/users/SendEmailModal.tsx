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
import { Mail, Send, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        full_name: string | null;
        email: string;
    };
}

const TEMPLATES = [
    { id: "none", label: "Blank Message", subject: "", body: "" },
    { 
        id: "verification", 
        label: "Verification Required", 
        subject: "Action Required: Annual Verification for your Listing", 
        body: "Hello,\n\nWe noticed that your business listing requires annual verification to remain active on Galapo. Please log in to your dashboard to confirm your business details.\n\nBest regards,\nGalapo Admin Team" 
    },
    { 
        id: "payment", 
        label: "Payment Received", 
        subject: "Confirmation: Payment Received", 
        body: "Hello,\n\nThis is to confirm that we have received your payment for your recent subscription. Your listing is now updated.\n\nThank you for choosing Galapo." 
    },
    { 
        id: "listing_approved", 
        label: "Listing Approved", 
        subject: "Good News: Your Listing is Now Live!", 
        body: "Hello,\n\nCongratulations! Your business listing has been reviewed and approved. It is now visible to all users on the Galapo platform.\n\nView it here: [Link]\n\nBest regards,\nGalapo Team" 
    }
];

export default function SendEmailModal({ isOpen, onClose, user }: SendEmailModalProps) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);

    const handleTemplateChange = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setBody(template.body);
        }
    };

    const handleSend = async () => {
        if (!subject || !body) {
            toast.error("Please fill in both subject and message body.");
            return;
        }

        setLoading(true);
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success(`Email sent successfully to ${user.email}`);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader className="space-y-3 pb-4 border-b">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl">Send Email Message</DialogTitle>
                        <DialogDescription>
                            Direct communication to <span className="font-bold text-gray-900">{user.full_name || user.email}</span>
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                        <Label htmlFor="template" className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Templates</Label>
                        <Select onValueChange={handleTemplateChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPLATES.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-gray-500">Subject Line</Label>
                        <Input 
                            id="subject" 
                            placeholder="e.g., Verification update for your business" 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body" className="text-xs font-bold uppercase tracking-wider text-gray-500">Message Body</Label>
                        <Textarea 
                            id="body" 
                            placeholder="Type your message here..." 
                            className="min-h-[200px] resize-none border-gray-200 focus:ring-blue-500" 
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t gap-2 bg-gray-50/50 -mx-6 px-6 -mb-6 pb-6">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSend} 
                        className="bg-blue-600 hover:bg-blue-700 min-w-[120px] shadow-md shadow-blue-100"
                        disabled={loading}
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                        ) : (
                            <><Send className="mr-2 h-4 w-4" /> Send Message</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
