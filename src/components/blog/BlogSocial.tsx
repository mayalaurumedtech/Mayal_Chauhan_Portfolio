import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Heart, Share2 } from "lucide-react";
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface BlogSocialProps {
    blogId: string;
    initialLikes?: number;
    initialViews?: number;
    initialShares?: number;
    slug: string;
}

export const BlogSocial = ({ blogId, initialLikes = 0, initialViews = 0, initialShares = 0, slug }: BlogSocialProps) => {
    const [likes, setLikes] = useState(initialLikes);
    const [shares, setShares] = useState(initialShares);
    const [hasLiked, setHasLiked] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        // Check local storage for guest likes or user ID for logged in users
        if (user) {
            // Ideally check DB, but for now specific local logic or rely on DB sync
            // For this implementation, we will use a simple local storage check combined with user auth if possible,
            // but strictly following the prompt: both guest and logged in can like.
            const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
            if (likedPosts.includes(blogId)) setHasLiked(true);
        } else {
            const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
            if (likedPosts.includes(blogId)) setHasLiked(true);
        }
    }, [blogId, user]);

    const handleLike = async () => {
        if (hasLiked) return;

        try {
            // Optimistic update
            setLikes(prev => prev + 1);
            setHasLiked(true);

            // Persist to local storage to prevent immediate re-like
            const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
            localStorage.setItem('liked_posts', JSON.stringify([...likedPosts, blogId]));

            // Update Firestore
            const currentDoc = await firestoreRest.get('blog_posts', blogId);
            const currentLikes = parseInt(extractVal(currentDoc.fields?.likes) || '0');

            const token = user ? await user.getIdToken() : undefined;
            await firestoreRest.patch('blog_posts', blogId, {
                likes: currentLikes + 1
            }, token);

        } catch (error) {
            console.error("Failed to like:", error);
            toast({ title: "Error", description: "Failed to like post", variant: "destructive" });
            setLikes(prev => prev - 1); // Rollback
            setHasLiked(false);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/blog/${slug}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Check out this blog post',
                    url: url
                });
            } else {
                await navigator.clipboard.writeText(url);
                toast({ title: "Copied!", description: "Link copied to clipboard" });
            }

            // Track share count
            setShares(prev => prev + 1);
            const currentDoc = await firestoreRest.get('blog_posts', blogId);
            const currentShares = parseInt(extractVal(currentDoc.fields?.shares) || '0');

            const token = user ? await user.getIdToken() : undefined;
            await firestoreRest.patch('blog_posts', blogId, {
                shares: currentShares + 1
            }, token);

        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    return (
        <div className="flex items-center gap-4 py-4 border-y border-border my-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-full text-muted-foreground" title="Total Views">
                <Eye className="w-4 h-4" />
                <span className="font-semibold text-sm">{initialViews.toLocaleString()}</span>
            </div>

            <div className="flex-1" />

            <Button
                variant={hasLiked ? "secondary" : "outline"}
                size="sm"
                className={`gap-2 rounded-full transition-all duration-300 ${hasLiked
                        ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-900/60 border-rose-200 dark:border-rose-900'
                        : 'hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:border-rose-900  `'
                    }`}
                onClick={handleLike}
                disabled={hasLiked}
            >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likes.toLocaleString()}</span>
            </Button>

            <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:border-blue-900 transition-all duration-300"
                onClick={handleShare}
            >
                <Share2 className="w-4 h-4" />
                <span className="font-medium">{shares.toLocaleString()}</span>
            </Button>
        </div>
    );
};
