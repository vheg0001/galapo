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
import { 
    RadioGroup, 
    RadioGroupItem 
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface DeleteUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        full_name: string | null;
        email: string;
    };
}

export default function DeleteUserDialog({ isOpen, onClose, user }: DeleteUserDialogProps) {
    const [strategy, setStrategy] = useState("keep_listings");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}?strategy=${strategy}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Account deleted successfully");
            onClose();
            router.push("/admin/users");
        } catch (err: any) {
            toast.error(err.message || "Deletion failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-rose-100">
                <DialogHeader className="space-y-3">
                    <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-xl text-rose-900">Confirm Account Deletion</DialogTitle>
                        <DialogDescription className="text-rose-700/70">
                            You are about to delete <span className="font-bold text-rose-900">{user.full_name || user.email}</span>'s account. This action cannot be undone.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <Label className="text-sm font-semibold text-gray-900">How should we handle their business listings?</Label>
                    <RadioGroup value={strategy} onValueChange={setStrategy} className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50/50 transition-colors cursor-pointer">
                            <RadioGroupItem value="keep_listings" id="keep" className="mt-1" />
                            <Label htmlFor="keep" className="font-normal cursor-pointer">
                                <span className="block font-semibold text-gray-900">Keep Listings (Unassigned)</span>
                                <span className="text-xs text-gray-500">Listings will stay live but won't have an owner.</span>
                            </Label>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50/50 transition-colors cursor-pointer border-rose-100">
                            <RadioGroupItem value="delete_all" id="delete" className="mt-1" />
                            <Label htmlFor="delete" className="font-normal cursor-pointer">
                                <span className="block font-semibold text-rose-700">Delete Everything</span>
                                <span className="text-xs text-rose-500/70">Delete the account AND all associated business listings permanently.</span>
                            </Label>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50/50 transition-colors cursor-pointer">
                            <RadioGroupItem value="transfer" id="transfer" className="mt-1" disabled />
                            <Label htmlFor="transfer" className="font-normal cursor-pointer opacity-50">
                                <span className="block font-semibold text-gray-900">Transfer to Admin (Coming Soon)</span>
                                <span className="text-xs text-gray-500">Reassign all listings to a general admin account.</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter className="bg-gray-50/50 -mx-6 px-6 -mb-6 pb-6 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive"
                        onClick={handleDelete} 
                        className="bg-rose-600 hover:bg-rose-700 min-w-[140px] shadow-md shadow-rose-100"
                        disabled={loading}
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                        ) : (
                            "Permanently Delete"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
