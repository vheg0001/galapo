"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
    ShieldCheck, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    ChevronLeft,
    Building2,
    MapPin,
    Calendar,
    ArrowRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { format } from "date-fns";

export default function ListingVerificationPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const listingId = params.id as string;
    const checkId = searchParams.get("check_id");

    const [listing, setListing] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                // We use the general business listing detail API if available
                const res = await fetch(`/api/business/listings`);
                const data = await res.json();
                const found = data.data.find((l: any) => l.id === listingId);
                if (!found) throw new Error("Listing not found");
                setListing(found);
            } catch (err: any) {
                toast.error(err.message || "Failed to load listing");
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [listingId]);

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const res = await fetch("/api/business/annual-check/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    check_id: checkId,
                    listing_id: listingId,
                    notes: notes || "Confirmed by owner."
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setSuccess(true);
            toast.success("Listing verified successfully!");
            
            setTimeout(() => {
                router.push("/business/dashboard");
            }, 3000);
        } catch (err: any) {
            toast.error(err.message || "Confirmation failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6B35]" />
            </div>
        );
    }

    if (!listing) return null;

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-12 text-center space-y-6 shadow-xl shadow-emerald-50">
                    <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-md border-4 border-emerald-500">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-emerald-900">Verification Complete!</h2>
                        <p className="text-emerald-700 text-lg">
                            Thank you for keeping your listing accurate. Your business will remain live on GalaPo for another year.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8">
                            <Link href="/business/dashboard">Return to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
            <Link 
                href="/business/dashboard" 
                className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#FF6B35] transition-colors"
            >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Dashboard
            </Link>

            <div className="space-y-2">
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-[#FF6B35]" />
                    Annual Listing Verification
                </h1>
                <p className="text-gray-500">
                    Please confirm that your business information is still accurate to keep your listing active.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_300px]">
                <div className="space-y-6">
                    <Card className="border-gray-200 shadow-sm overflow-hidden border-t-4 border-t-[#FF6B35]">
                        <CardHeader className="bg-gray-50/50">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-[#FF6B35]" />
                                Listing Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start gap-4">
                                {listing.primary_image ? (
                                    <img 
                                        src={listing.primary_image} 
                                        alt={listing.business_name}
                                        className="h-20 w-20 rounded-xl object-cover border"
                                    />
                                ) : (
                                    <div className="h-20 w-20 bg-gray-100 rounded-xl flex items-center justify-center border">
                                        <Building2 className="h-8 w-8 text-gray-300" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900">{listing.business_name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {listing.address}
                                    </p>
                                    <Badge variant="outline" className="capitalize">
                                        {listing.category_name}
                                    </Badge>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                                <span className="text-gray-500">Last Verified:</span>
                                <span className="font-bold text-gray-900">
                                    {listing.last_verified_at ? format(new Date(listing.last_verified_at), "MMMM d, yyyy") : "Never"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Additional Notes (Optional)</CardTitle>
                            <CardDescription>
                                Have there been any minor changes we should know about? (Operation hours, contact info, etc.)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                placeholder="Example: Updated our closing time to 8:00 PM on weekdays."
                                className="min-h-[120px] resize-none border-gray-200 focus:ring-[#FF6B35]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </CardContent>
                        <CardFooter className="bg-gray-50/50 border-t pt-6">
                            <Button 
                                className="w-full bg-[#FF6B35] hover:bg-[#e85a2a] text-white font-bold h-12 shadow-lg shadow-orange-100"
                                onClick={handleConfirm}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                                ) : (
                                    "I Confirm This Business is Still Active"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-blue-800 font-bold">
                            <AlertCircle className="h-5 w-5" />
                            Why verify?
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            GalaPo maintains a high-quality directory for Olongapo City. We ask business owners to confirm their status annually to ensure that users only find active businesses.
                        </p>
                        <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4 font-medium">
                            <li>Keep your search ranking</li>
                            <li>Avoid listing deactivation</li>
                            <li>Ensure users can contact you</li>
                        </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-2 text-center">
                        <Calendar className="h-8 w-8 text-amber-600 mx-auto opacity-40" />
                        <h4 className="text-sm font-bold text-amber-900">Next Check</h4>
                        <p className="text-xs text-amber-700">
                            {format(new Date(Date.now() + 31536000000), "MMMM yyyy")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
