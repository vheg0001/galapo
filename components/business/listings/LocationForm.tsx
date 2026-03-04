"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — LocationForm Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useListingFormStore } from "@/store/listingFormStore";
import MapPinSelector from "./MapPinSelector";
import type { Barangay } from "@/lib/types";

export default function LocationForm() {
    const { formData, updateFormData, errors } = useListingFormStore();
    const [barangays, setBarangays] = useState<Barangay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBarangays() {
            try {
                const res = await fetch("/api/barangays");
                const json = await res.json();

                // Extract array from standard response format { success, data }
                if (json && json.data && Array.isArray(json.data)) {
                    setBarangays(json.data);
                } else if (Array.isArray(json)) {
                    setBarangays(json);
                } else {
                    setBarangays([]);
                }
            } catch (err) {
                console.error("Failed to fetch barangays", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBarangays();
    }, []);

    return (
        <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Location Details</h2>
                <p className="text-sm text-gray-500">Pin your business on the map and provide your full address.</p>
            </div>

            <div className="space-y-8">
                {/* Map Selector */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Map Location</label>
                    <MapPinSelector
                        lat={formData.lat}
                        lng={formData.lng}
                        onChange={(lat, lng) => updateFormData({ lat, lng })}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Barangay */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            Barangay <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.barangay_id || ""}
                            onChange={(e) => updateFormData({ barangay_id: e.target.value })}
                            className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white ${errors.barangay_id ? "border-red-300 bg-red-50 focus:border-red-500" : "border-gray-200 focus:border-[#FF6B35]"
                                }`}
                        >
                            <option value="">Select Barangay</option>
                            {barangays.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        {errors.barangay_id && <p className="text-xs font-medium text-red-500">{errors.barangay_id}</p>}
                    </div>

                    {/* Street Address */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="House No., Building Name, Street"
                            value={formData.address || ""}
                            onChange={(e) => updateFormData({ address: e.target.value })}
                            className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 ${errors.address ? "border-red-300 bg-red-50 focus:border-red-500" : "border-gray-200 focus:border-[#FF6B35]"
                                }`}
                        />
                        {errors.address && <p className="text-xs font-medium text-red-500">{errors.address}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
