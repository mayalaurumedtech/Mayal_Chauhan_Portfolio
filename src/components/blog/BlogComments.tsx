import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { BlogComment } from '@/types/blog';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ThumbsUp, Reply, Loader2, Send } from "lucide-react";

interface BlogCommentsProps {
    blogId: string;
}

import { ChevronDown, ChevronUp } from "lucide-react";

const CommentItem = ({
    comment,
    allComments,
    user,
    replyTo,
    setReplyTo,
    newComment,
    setNewComment,
    handleSubmit,
    submitting,
    handleLike,
    isReply = false
}: {
    comment: BlogComment,
    allComments: BlogComment[],
    user: any,
    replyTo: string | null,
    setReplyTo: (id: string | null) => void,
    newComment: string,
    setNewComment: (val: string) => void,
    handleSubmit: (e: React.FormEvent) => void,
    submitting: boolean,
    handleLike: (id: string) => void,
    isReply?: boolean
}) => {
    const replies = allComments.filter(c => c.parentId === comment.id);
    const [showReplies, setShowReplies] = useState(false);

    return (
        <div className={cn(
            "flex gap-4 p-4 rounded-xl transition-all",
            isReply ? "mt-4" : "py-6 border-b border-border last:border-0",
            comment.isAdmin && "bg-primary/5 border border-primary/10 shadow-sm"
        )}>
            <Avatar className={cn("w-10 h-10 border shrink-0", comment.isAdmin && "border-primary/50 shadow-md shadow-primary/10")}>
                <AvatarImage src={comment.userPhotoURL} />
                <AvatarFallback className={cn(comment.isAdmin && "bg-primary text-white")}>
                    {comment.userDisplayName?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-sm", comment.isAdmin && "text-primary flex items-center gap-1.5")}>
                            {comment.userDisplayName}
                            {comment.isAdmin && <Badge className="h-4 text-[9px] px-1 uppercase tracking-tighter bg-primary text-white">Admin</Badge>}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                </div>
                <p className={cn("text-sm leading-relaxed", comment.isAdmin ? "text-foreground font-medium italic" : "text-foreground/90")}>
                    {comment.content}
                </p>

                <div className="flex items-center gap-6 pt-1">
                    <Button
                        variant="ghost" size="sm"
                        className={`h-auto p-0 text-xs gap-1.5 hover:bg-transparent hover:text-primary ${comment.likedBy?.includes(user?.uid || '') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        onClick={() => handleLike(comment.id)}
                    >
                        <ThumbsUp className={`w-4 h-4 ${comment.likedBy?.includes(user?.uid || '') ? 'fill-current' : ''}`} />
                        {comment.likes || 0}
                    </Button>

                    {!isReply && user && (
                        <Button
                            variant="ghost" size="sm"
                            className="h-auto p-0 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-transparent hover:font-bold transition-all"
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        >
                            <span className="cursor-pointer">Reply</span>
                        </Button>
                    )}
                </div>

                {replyTo === comment.id && (
                    <div className="pt-4 animate-in fade-in slide-in-from-top-2">
                        <form onSubmit={handleSubmit} className="flex gap-3">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[80px] text-sm resize-none"
                                autoFocus
                            />
                            <Button type="submit" size="icon" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>
                )}

                {replies.length > 0 && (
                    <div className="mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowReplies(!showReplies)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 p-0 h-auto text-xs font-semibold gap-2 flex items-center"
                        >
                            {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {showReplies ? 'Hide replies' : `${replies.length} replies`}
                        </Button>

                        {showReplies && (
                            <div className="replies-container pl-4 border-l-2 border-border/40 mt-3 space-y-4">
                                {replies.map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        isReply={true}
                                        allComments={allComments}
                                        user={user}
                                        replyTo={replyTo}
                                        setReplyTo={setReplyTo}
                                        newComment={newComment}
                                        setNewComment={setNewComment}
                                        handleSubmit={handleSubmit}
                                        submitting={submitting}
                                        handleLike={handleLike}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const BlogComments = ({ blogId }: BlogCommentsProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<BlogComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);

    // Fetch comments
    useEffect(() => {
        const fetchComments = async () => {
            try {
                // In a real app we'd query by blogId using filters
                // firestoreRest limitation: generic getAll returns all. 
                // We'll trust the plan and assume we fetch all then filter client side for now 
                // OR assuming we implemented filtering in firestore-rest previously.
                // Checking previous implementation... assuming getOne/getAll basic.
                // We will fetch all from 'blog_comments' and filter.
                // firestoreRest limitation: list returns all documents in collection
                const allDocs = await firestoreRest.list('blog_comments');
                const allComments = allDocs.map((doc: any) => ({
                    id: doc.name.split('/').pop(),
                    blogId: extractVal(doc.fields.blogId),
                    userId: extractVal(doc.fields.userId),
                    userDisplayName: extractVal(doc.fields.userDisplayName),
                    userPhotoURL: extractVal(doc.fields.userPhotoURL),
                    content: extractVal(doc.fields.content),
                    createdAt: extractVal(doc.fields.createdAt),
                    parentId: extractVal(doc.fields.parentId) || null,
                    likes: extractVal(doc.fields.likes) || 0,
                    likedBy: extractVal(doc.fields.likedBy) || [],
                    isAdmin: extractVal(doc.fields.isAdmin) || false
                })) as BlogComment[];
                const blogComments = allComments.filter((c: any) => c.blogId === blogId);

                // Sort by date desc
                blogComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setComments(blogComments);
            } catch (error) {
                console.error("Error fetching comments:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchComments();
    }, [blogId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            const commentData: Partial<BlogComment> = {
                blogId,
                userId: user.uid,
                userDisplayName: user.displayName || 'Anonymous User',
                userPhotoURL: user.photoURL || '',
                content: newComment.trim(),
                createdAt: new Date().toISOString(),
                parentId: replyTo,
                likes: 0,
                likedBy: []
            };

            const created = await firestoreRest.create('blog_comments', commentData, token);

            // Optimistic update
            const newCommentObj = { ...commentData, id: created.name.split('/').pop() } as BlogComment;
            setComments(prev => [newCommentObj, ...prev]);
            setNewComment("");
            setReplyTo(null);

            // Update parent blog comment count
            // Note: Update post might require auth or be allowed for public if rules permit. 
            // Better to pass token since we have it.
            const currentBlog = await firestoreRest.get('blog_posts', blogId);
            const currentCount = parseInt(extractVal(currentBlog.fields?.commentCount) || '0');
            await firestoreRest.patch('blog_posts', blogId, {
                commentCount: currentCount + 1
            }, token);

            toast({ title: "Comment added!" });

        } catch (error) {
            console.error(error);
            toast({ title: "Failed to post comment", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId: string) => {
        if (!user) {
            toast({ title: "Please login to like comments" });
            return;
        }

        const comment = comments.find(c => c.id === commentId);
        if (!comment) return;
        if (comment.likedBy?.includes(user.uid)) return;

        // Optimistic update
        const updatedLikedBy = [...(comment.likedBy || []), user.uid];
        const updatedLikes = (comment.likes || 0) + 1;

        setComments(prev => prev.map(c =>
            c.id === commentId
                ? { ...c, likes: updatedLikes, likedBy: updatedLikedBy }
                : c
        ));

        try {
            const token = await user.getIdToken();
            await firestoreRest.patch('blog_comments', commentId, {
                likes: updatedLikes,
                likedBy: updatedLikedBy
            }, token);
        } catch (error) {
            // Revert
            toast({ title: "Failed to like", variant: "destructive" });
        }
    };

    const rootComments = comments.filter(c => !c.parentId);

    return (
        <div className="space-y-8" id="comments">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({comments.length})
            </h3>

            {!user ? (
                <div className="bg-muted/30 rounded-lg p-6 text-center border-2 border-dashed">
                    <p className="text-muted-foreground mb-4">You need to log in to post a comment.</p>
                </div>
            ) : (
                !replyTo && (
                    <form onSubmit={handleSubmit} className="space-y-4 bg-card border rounded-xl p-4 shadow-sm">
                        <div className="flex gap-4">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={user.photoURL || ''} />
                                <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-4">
                                <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    className="min-h-[100px]"
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={submitting || !newComment.trim()}>
                                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Post Comment
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                )
            )}

            <div className="space-y-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                    rootComments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            allComments={comments}
                            user={user}
                            replyTo={replyTo}
                            setReplyTo={setReplyTo}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            handleSubmit={handleSubmit}
                            submitting={submitting}
                            handleLike={handleLike}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
