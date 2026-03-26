"use client";

import { useState } from "react";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Mail, 
    Phone, 
    Calendar, 
    Shield, 
    ShieldAlert, 
    User as UserIcon,
    ToggleLeft,
    ToggleRight,
    Clock
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    avatar_url: string | null;
    role: string;
}

export default function UserProfileCard({ profile, onUpdate }: { profile: UserProfile; onUpdate: () => void }) {
    const [loading, setLoading] = useState(false);

    const toggleStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${profile.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !profile.is_active }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success(`User ${!profile.is_active ? 'activated' : 'deactivated'} successfully`);
            onUpdate();
        } catch (err: any) {
            toast.error(err.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "??";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    return (
        <Card className="border-gray-200 shadow-sm overflow-hidden bg-gradient-to-br from-white to-gray-50/50">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center gap-8 p-8">
                    {/* Avatar Side */}
                    <div className="relative group">
                        <Avatar className="h-40 w-40 border-4 border-white shadow-xl ring-1 ring-gray-100 ring-offset-4 ring-offset-white">
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback className="bg-blue-600 text-white text-4xl font-bold">
                                {getInitials(profile.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 translate-x-12">
                            {profile.is_active ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-500 border-2 border-white px-3 py-1 shadow-md">
                                    Active
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="border-2 border-white px-3 py-1 shadow-md">
                                    Inactive
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Info Side */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                                <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 rounded-full px-3">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {profile.role === 'business_owner' ? 'Business Owner' : 'Super Admin'}
                                </Badge>
                                <span className="text-sm text-gray-400 font-mono">ID: {profile.id}</span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">{profile.full_name || "Unnamed User"}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 py-4 border-y border-gray-100/80">
                            <div className="flex items-center justify-center md:justify-start gap-3 group">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Email Address</p>
                                    <a href={`mailto:${profile.email}`} className="text-gray-900 font-medium hover:text-blue-600 transition-colors">
                                        {profile.email}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-3 group">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Phone Number</p>
                                    <a href={`tel:${profile.phone}`} className="text-gray-900 font-medium hover:text-emerald-600 transition-colors">
                                        {profile.phone || "Not provided"}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-3 group">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Registered Date</p>
                                    <p className="text-gray-900 font-medium">
                                        {(() => {
                                            const date = new Date(profile.created_at);
                                            return isNaN(date.getTime()) ? "—" : format(date, "MMMM d, yyyy");
                                        })()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-3 group">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Last Active</p>
                                    <p className="text-gray-900 font-medium">
                                        Recent Activity (Logged)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                            {profile.is_active ? (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="gap-2 text-rose-600 hover:bg-rose-50 border-rose-100"
                                    onClick={toggleStatus}
                                    disabled={loading}
                                >
                                    <ShieldAlert className="h-4 w-4" />
                                    Deactivate Account
                                </Button>
                            ) : (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="gap-2 text-emerald-600 hover:bg-emerald-50 border-emerald-100"
                                    onClick={toggleStatus}
                                    disabled={loading}
                                >
                                    <Shield className="h-4 w-4" />
                                    Reactivate Account
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="gap-2 text-gray-500">
                                <UserIcon className="h-4 w-4" />
                                Edit Basic Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
