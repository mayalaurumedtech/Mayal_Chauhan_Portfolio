import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { BlogComment, BlogPost } from '@/types/blog';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ThumbsUp, Reply, Loader2, Send, Trash2, CheckCircle, ExternalLink, Filter } from "lucide-react";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const AdminComments = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<BlogComment[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [filterBlogId, setFilterBlogId] = useState<string>("all");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch All Comments
            const commentDocs = await firestoreRest.list('blog_comments');
            const allComments = commentDocs.map((doc: any) => ({
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

            // Sort by date desc
            allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setComments(allComments);

            // Fetch Blog Posts for titles/filtering
            const blogDocs = await firestoreRest.list('blog_posts');
            const posts = blogDocs.map((doc: any) => ({
                id: doc.name.split('/').pop(),
                title: extractVal(doc.fields.title)
            })) as BlogPost[];
            setBlogPosts(posts);

        } catch (error) {
            console.error("Error fetching admin comments:", error);
            toast({ title: "Error", description: "Failed to load comments", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (comment: BlogComment) => {
        if (!user || !replyText.trim()) return;

        setSubmitting(comment.id);
        try {
            const token = await user.getIdToken();
            const replyData: Partial<BlogComment> = {
                blogId: comment.blogId,
                userId: user.uid,
                userDisplayName: user.displayName || 'Admin',
                userPhotoURL: user.photoURL || '',
                content: replyText.trim(),
                createdAt: new Date().toISOString(),
                parentId: comment.id,
                likes: 0,
                likedBy: [],
                isAdmin: true // Mark as admin reply
            };

            const created = await firestoreRest.create('blog_comments', replyData, token);
            const newReply = { ...replyData, id: created.name.split('/').pop() } as BlogComment;

            setComments(prev => [newReply, ...prev]);
            setReplyText("");
            setReplyTo(null);
            toast({ title: "Reply posted successfully" });
        } catch (error) {
            console.error(error);
            toast({ title: "Failed to post reply", variant: "destructive" });
        } finally {
            setSubmitting(null);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!user || !confirm("Are you sure you want to delete this comment?")) return;

        try {
            const token = await user.getIdToken();
            await firestoreRest.delete('blog_comments', commentId, token);
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast({ title: "Comment deleted" });
        } catch (error) {
            toast({ title: "Failed to delete comment", variant: "destructive" });
        }
    };

    const filteredComments = filterBlogId === "all"
        ? comments
        : comments.filter(c => c.blogId === filterBlogId);

    // Root comments ONLY (replies shown inline or we can show all)
    // For admin management, seeing all comments linearly is often easier to find new ones.
    // But grouping by parent helps context.

    const getBlogTitle = (id: string) => blogPosts.find(p => p.id === id)?.title || "Unknown Post";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading comments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Comment Management</h2>
                    <p className="text-muted-foreground text-sm">Review and reply to your blog readers</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={filterBlogId} onValueChange={setFilterBlogId}>
                            <SelectTrigger className="w-[200px] border-0 bg-transparent shadow-none focus:ring-0 h-7 text-xs font-medium">
                                <SelectValue placeholder="Filter by blog" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Blog Posts</SelectItem>
                                {blogPosts.map(post => (
                                    <SelectItem key={post.id} value={post.id}>{post.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredComments.length === 0 ? (
                    <Card className="p-12 text-center border-dashed bg-muted/20">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-semibold mb-1">No comments found</h3>
                        <p className="text-muted-foreground text-sm">Try changing your filter or check back later.</p>
                    </Card>
                ) : (
                    filteredComments.map((comment) => (
                        <Card key={comment.id} className={cn(
                            "group overflow-hidden border-l-4 transition-all hover:shadow-md",
                            comment.isAdmin ? "border-l-primary bg-primary/5" : "border-l-border"
                        )}>
                            <div className="p-5">
                                <div className="flex gap-4">
                                    <Avatar className="w-10 h-10 border shadow-sm">
                                        <AvatarImage src={comment.userPhotoURL} />
                                        <AvatarFallback className="bg-muted text-xs">{comment.userDisplayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm truncate">{comment.userDisplayName}</span>
                                                {comment.isAdmin && <Badge className="h-4 text-[9px] uppercase tracking-tighter bg-primary text-white">Admin</Badge>}
                                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(comment.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <ExternalLink className="w-2.5 h-2.5" />
                                                {getBlogTitle(comment.blogId)}
                                            </span>
                                            {comment.parentId && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Reply className="w-2.5 h-2.5 rotate-180" /> In reply to another comment
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-foreground/90 leading-relaxed bg-background/50 p-3 rounded-lg border border-border/30 shadow-inner italic">
                                            "{comment.content}"
                                        </p>

                                        <div className="mt-4 flex items-center gap-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "h-8 text-xs gap-2 rounded-full px-4 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all",
                                                    replyTo === comment.id && "bg-primary text-white hover:bg-primary/90 hover:text-white"
                                                )}
                                                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                            >
                                                <Reply className="w-3.5 h-3.5" />
                                                {replyTo === comment.id ? 'Cancel Reply' : 'Reply to Answer'}
                                            </Button>

                                            <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                                                <ThumbsUp className="w-3 h-3" />
                                                {comment.likes || 0} Likes
                                            </div>
                                        </div>

                                        {replyTo === comment.id && (
                                            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <Textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Type your official response here..."
                                                    className="min-h-[100px] text-sm bg-card border-primary/30"
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Cancel</Button>
                                                    <Button
                                                        size="sm"
                                                        className="gradient-primary text-white gap-2 px-6 shadow-md shadow-primary/20"
                                                        onClick={() => handleReply(comment)}
                                                        disabled={submitting === comment.id || !replyText.trim()}
                                                    >
                                                        {submitting === comment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        Post Response
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
