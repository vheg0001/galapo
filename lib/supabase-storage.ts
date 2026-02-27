// ──────────────────────────────────────────────────────────
// GalaPo — Supabase Storage Helpers
// ──────────────────────────────────────────────────────────

import { createBrowserSupabaseClient } from "@/lib/supabase";

/**
 * Uploads a file to a specific Supabase storage bucket.
 * 
 * @param bucket The name of the storage bucket
 * @param path The path/filename inside the bucket
 * @param file The file object (File | Blob)
 * @returns An object containing the publicUrl, or an error.
 */
export async function uploadFile(bucket: string, path: string, file: File | Blob) {
    const supabase = createBrowserSupabaseClient();

    // Clean up the path (remove leading slashes)
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Upload the file
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(cleanPath, file, {
            cacheControl: "3600",
            upsert: true, // Overwrite if it exists
        });

    if (error) {
        console.error(`Error uploading to ${bucket}/${cleanPath}:`, error.message);
        throw error;
    }

    // Get public URL (works for public buckets, returns URL format for private too)
    const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(cleanPath);

    return {
        path: data.path,
        publicUrl: publicData.publicUrl
    };
}

/**
 * Deletes a file from a specified bucket.
 */
export async function deleteFile(bucket: string, path: string) {
    const supabase = createBrowserSupabaseClient();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    const { error } = await supabase.storage
        .from(bucket)
        .remove([cleanPath]);

    if (error) {
        console.error(`Error deleting ${bucket}/${cleanPath}:`, error.message);
        throw error;
    }
    return true;
}

/**
 * Retrieves the public URL for a given bucket and path.
 */
export function getPublicUrl(bucket: string, path: string) {
    const supabase = createBrowserSupabaseClient();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
    return data.publicUrl;
}

// ──────────────────────────────────────────────────────────
// ── Specialized Upload Helpers ────────────────────────────
// ──────────────────────────────────────────────────────────

export async function uploadPaymentProof(file: File, userId: string, paymentId: string) {
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/${paymentId}-${Date.now()}.${ext}`;
    return uploadFile("payments", fileName, file);
}

export async function uploadClaimProof(file: File, userId: string, listingId: string) {
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/${listingId}-${Date.now()}.${ext}`;
    return uploadFile("claims", fileName, file);
}

export async function uploadListingImage(file: File, listingId: string, sortOrder: number = 0) {
    const ext = file.name.split('.').pop();
    const fileName = `${listingId}/gallery-${sortOrder}-${Date.now()}.${ext}`;
    return uploadFile("listings", fileName, file);
}

export async function uploadLogo(file: File, listingId: string) {
    const ext = file.name.split('.').pop();
    const fileName = `${listingId}/logo-${Date.now()}.${ext}`;
    return uploadFile("logos", fileName, file);
}

export async function uploadAdBanner(file: File, adId: string) {
    const ext = file.name.split('.').pop();
    const fileName = `${adId}/banner-${Date.now()}.${ext}`;
    return uploadFile("ads", fileName, file);
}

export async function uploadBlogImage(file: File, postId: string) {
    const ext = file.name.split('.').pop();
    const fileName = `${postId}/featured-${Date.now()}.${ext}`;
    return uploadFile("blog", fileName, file);
}
