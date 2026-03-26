"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Calendar, 
    Mail, 
    Phone, 
    User as UserIcon, 
    Shield, 
    ShieldAlert,
    ExternalLink,
    Clock,
    CreditCard,
    LayoutGrid,
    MessageSquare,
    Trash2,
    Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import UserProfileCard from "@/components/admin/users/UserProfileCard";
import UserListingsSection from "@/components/admin/users/UserListingsSection";
import UserPaymentsSection from "@/components/admin/users/UserPaymentsSection";
import UserActivityLog from "@/components/admin/users/UserActivityLog";
import SendEmailModal from "@/components/admin/users/SendEmailModal";
import DeleteUserDialog from "@/components/admin/users/DeleteUserDialog";
import AdminUserNotes from "@/components/admin/users/AdminUserNotes";
import UserTopSearchSection from "@/components/admin/users/UserTopSearchSection";
import UserBannerAdsSection from "@/components/admin/users/UserBannerAdsSection";
import { Image as ImageIcon, Search as SearchIcon } from "lucide-react";

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json);
        } catch (err: any) {
            toast.error(err.message || "Failed to load user details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchUser();
    }, [id]);

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );

    if (!data?.profile) return (
        <div className="p-8 text-center text-gray-500">
            User not found.
        </div>
    );

    const { profile, listings, subscriptions, payments, activity, top_search, banners } = data;

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="gap-2 text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Business Owners
                </Button>
                
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => setIsEmailModalOpen(true)}
                    >
                        <Send className="h-4 w-4" />
                        Send Email
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => setIsDeleteOpen(true)}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile & Main Content (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    <UserProfileCard profile={profile} onUpdate={fetchUser} />

                    <Tabs defaultValue="listings" className="w-full">
                        <TabsList className="bg-gray-100/50 p-1 border border-gray-100 mb-6">
                            <TabsTrigger value="listings" className="gap-2">
                                <LayoutGrid className="h-4 w-4" />
                                Listings ({listings.length})
                            </TabsTrigger>
                            <TabsTrigger value="subscriptions" className="gap-2">
                                <CreditCard className="h-4 w-4" />
                                Subscriptions ({subscriptions.length})
                            </TabsTrigger>
                            <TabsTrigger value="payments" className="gap-2">
                                <Clock className="h-4 w-4" />
                                Payments ({payments.length})
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Activity
                            </TabsTrigger>
                            <TabsTrigger value="top-search" className="gap-2">
                                <SearchIcon className="h-4 w-4" />
                                Top Search ({top_search?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="banners" className="gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Banners ({banners?.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="listings">
                            <UserListingsSection listings={listings} ownerId={id} ownerName={profile.full_name} />
                        </TabsContent>
                        <TabsContent value="subscriptions">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Subscription History</CardTitle>
                                    <CardDescription>All active and past subscriptions for this user's listings.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <UserPaymentsSection type="subscriptions" data={subscriptions} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="payments">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment History</CardTitle>
                                    <CardDescription>Financial transactions associated with this user account.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <UserPaymentsSection type="payments" data={payments} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="activity">
                            <UserActivityLog activity={activity} />
                        </TabsContent>
                        <TabsContent value="top-search">
                            <UserTopSearchSection data={top_search || []} />
                        </TabsContent>
                        <TabsContent value="banners">
                            <UserBannerAdsSection data={banners || []} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Sidebar (1/3) */}
                <div className="space-y-8">
                    <Card className="border-blue-100 shadow-sm overflow-hidden">
                        <div className="h-1 bg-blue-600" />
                        <CardHeader>
                            <CardTitle className="text-lg">Account Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button 
                                className="w-full justify-start gap-3" 
                                variant="outline"
                                onClick={() => setIsEmailModalOpen(true)}
                            >
                                <Mail className="h-4 w-4 text-blue-600" />
                                Compose Message
                            </Button>
                            <Button className="w-full justify-start gap-3" variant="outline">
                                <Shield className="h-4 w-4 text-emerald-600" />
                                Reset Password
                            </Button>
                            <Button 
                                className="w-full justify-start gap-3" 
                                variant="outline"
                                onClick={() => setIsDeleteOpen(true)}
                            >
                                <Trash2 className="h-4 w-4 text-rose-600" />
                                Delete & Cleanup
                            </Button>
                        </CardContent>
                    </Card>

                    <AdminUserNotes userId={id} />
                </div>
            </div>

            {/* Modals */}
            <SendEmailModal 
                isOpen={isEmailModalOpen} 
                onClose={() => setIsEmailModalOpen(false)} 
                user={profile} 
            />
            <DeleteUserDialog 
                isOpen={isDeleteOpen} 
                onClose={() => setIsDeleteOpen(false)} 
                user={profile} 
            />
        </div>
    );
}
