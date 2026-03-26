"use client";

import Link from "next/link";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    ExternalLink, 
    Plus, 
    Eye, 
    CheckCircle2, 
    XCircle,
    Star,
    Zap
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

interface Listing {
    id: string;
    business_name: string;
    slug: string;
    status: string;
    created_at: string;
    is_active: boolean;
    is_premium: boolean;
    is_featured: boolean;
}

export default function UserListingsSection({ 
    listings, 
    ownerId, 
    ownerName 
}: { 
    listings: Listing[]; 
    ownerId: string;
    ownerName: string | null;
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Listings by {ownerName || "this user"}</h3>
                    <p className="text-sm text-gray-500">Manage all business directories owned by this account.</p>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Create Listing
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>Business Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {listings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                    This user has no listings yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            listings.map((listing) => (
                                <TableRow key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell>
                                        <div className="font-semibold text-gray-900">{listing.business_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">/{listing.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        {listing.status === 'approved' ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 font-medium">
                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                                            </Badge>
                                        ) : listing.status === 'pending' ? (
                                            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100 font-medium">
                                                <Clock className="h-3 w-3 mr-1" /> Pending
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-500 font-medium">
                                                <XCircle className="h-3 w-3 mr-1" /> {listing.status}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {listing.is_premium && (
                                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">
                                                    <Star className="h-3 w-3 mr-1 fill-purple-700" /> Premium
                                                </Badge>
                                            )}
                                            {listing.is_featured && (
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                    <Zap className="h-3 w-3 mr-1 fill-blue-700" /> Featured
                                                </Badge>
                                            )}
                                            {!listing.is_premium && !listing.is_featured && (
                                                <Badge variant="outline" className="text-gray-400">Free</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {listing.is_active ? (
                                            <span className="flex items-center text-sm text-emerald-600 font-medium">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                                Live
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-sm text-gray-400 font-medium">
                                                <div className="h-2 w-2 rounded-full bg-gray-300 mr-2" />
                                                Hidden
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {(() => {
                                            const date = new Date(listing.created_at);
                                            return isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy");
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/listings/${listing.id}`}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Manage
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={`/olongapo/search/${listing.slug}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function Clock({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
