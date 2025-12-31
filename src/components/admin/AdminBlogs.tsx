import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest } from '@/lib/firestore-rest';
import { uploadImage } from '@/lib/cloudinary';
import { Trash2, Plus, Edit, Eye, ChevronLeft, Calendar, Clock, Upload, Loader2, Save, Image as ImageIcon, MessageSquare, Heart, Share2, Search, Send, ThumbsUp, Reply } from "lucide-react";
import { z } from 'zod';
import { BlogPost, BlogComment } from '@/types/blog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { RichTextEditor } from './RichTextEditor';

const blogPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  excerpt: z.string().trim().min(1, "Excerpt is required").max(300),
  content: z.string().trim().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
  image: z.string().url("Must be a valid URL"),
  readTime: z.string().min(1, "Read time is required"),
  isPublic: z.boolean(),
  isFeatured: z.boolean().optional(),
  adminNote: z.string().optional(),
  showNotes: z.boolean().optional()
});

interface AdminBlogsProps {
  blogPosts: BlogPost[];
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

export const AdminBlogs = ({ blogPosts, onRefresh, onDelete }: AdminBlogsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'add' | 'edit'>('grid');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blogForm, setBlogForm] = useState({
    title: "", slug: "", excerpt: "", content: "",
    category: "", image: "", readTime: "", isPublic: true, isFeatured: false,
    adminNote: "", showNotes: false
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Comment Management State
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<BlogPost | null>(null);
  const [postComments, setPostComments] = useState<BlogComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const docs = await firestoreRest.list('settings');
      const blogSettings = docs.find((doc: any) => doc.name.endsWith('blog'));
      if (blogSettings) {
        setGlobalAnnouncement(extractVal(blogSettings.fields.globalAnnouncement) || "");
      }
    } catch (error) {
      console.error("Error fetching global settings:", error);
    }
  };

  const saveGlobalSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      const token = await user.getIdToken();
      await firestoreRest.patch('settings', 'blog', { globalAnnouncement }, token);
      toast({ title: "Success", description: "Global announcement updated" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchCommentsForPost = async (postId: string) => {
    setLoadingComments(true);
    try {
      const docs = await firestoreRest.list('blog_comments');
      const allComments = docs.map((doc: any) => ({
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

      const filtered = allComments
        .filter(c => c.blogId === postId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setPostComments(filtered);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({ title: "Error", description: "Failed to load comments", variant: "destructive" });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleReply = async (comment: BlogComment) => {
    if (!user || !replyText.trim()) return;
    setSubmittingReply(comment.id);
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
        isAdmin: true
      };

      const created = await firestoreRest.create('blog_comments', replyData, token);
      const newReply = { ...replyData, id: created.name.split('/').pop() } as BlogComment;

      setPostComments(prev => [newReply, ...prev]);
      setReplyText("");
      setReplyTo(null);
      toast({ title: "Reply posted" });
    } catch (error) {
      toast({ title: "Failed to post reply", variant: "destructive" });
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !confirm("Delete this comment?")) return;
    try {
      const token = await user.getIdToken();
      await firestoreRest.delete('blog_comments', commentId, token);
      setPostComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: "Comment deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const openComments = (post: BlogPost) => {
    setActiveCommentPost(post);
    setIsCommentsOpen(true);
    fetchCommentsForPost(post.id);
  };

  const extractVal = (field: any) => {
    if (!field) return null;
    if ('stringValue' in field) return field.stringValue;
    if ('booleanValue' in field) return field.booleanValue;
    if ('integerValue' in field) return parseInt(field.integerValue);
    if ('arrayValue' in field) return field.arrayValue.values?.map((v: any) => extractVal(v)) || [];
    return null;
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImage(file, 'featured-images');
      setBlogForm(prev => ({ ...prev, image: url }));
      toast({ title: "Success", description: "Featured image uploaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      const validatedData = blogPostSchema.parse(blogForm);
      const token = await user.getIdToken();

      if (viewMode === 'edit' && editingPostId) {
        await firestoreRest.patch('blog_posts', editingPostId, {
          ...validatedData,
          isFeatured: !!blogForm.isFeatured,
          updatedAt: new Date().toISOString()
        }, token);
        toast({ title: "Success", description: "Blog post updated successfully" });
      } else {
        await firestoreRest.create("blog_posts", {
          ...validatedData,
          date: new Date().toISOString().split('T')[0],
          isFeatured: !!blogForm.isFeatured,
          adminNote: blogForm.adminNote || "",
          showNotes: !!blogForm.showNotes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, token);
        toast({ title: "Success", description: "Blog post created successfully" });
      }

      resetForm();
      setViewMode('grid');
      onRefresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: `Failed to ${viewMode === 'edit' ? 'update' : 'create'} blog post`, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setBlogForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      image: post.image,
      readTime: post.readTime,
      isPublic: post.isPublic,
      isFeatured: post.isFeatured || false,
      adminNote: post.adminNote || "",
      showNotes: post.showNotes || false
    });
    setViewMode('edit');
  };

  const resetForm = () => {
    setBlogForm({
      title: "", slug: "", excerpt: "", content: "", category: "", image: "",
      readTime: "", isPublic: true, isFeatured: false,
      adminNote: "", showNotes: false
    });
    setEditingPostId(null);
  };

  if (viewMode !== 'grid') {
    return (
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setViewMode('grid'); resetForm(); }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{viewMode === 'edit' ? 'Edit Post' : 'Write New Post'}</h2>
            <p className="text-muted-foreground">{viewMode === 'edit' ? 'Update your article details' : 'Share your thoughts and tutorials with the world'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blogTitle">Title *</Label>
                  <Input
                    id="blogTitle"
                    value={blogForm.title}
                    className="text-lg font-semibold"
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value, slug: generateSlug(e.target.value) })}
                    placeholder="Enter blog title..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content (Visual Editor)</Label>
                  <RichTextEditor
                    content={blogForm.content}
                    onChange={(val) => setBlogForm({ ...blogForm, content: val })}
                    placeholder="Write your amazing content here..."
                  />
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blogExcerpt">Short Excerpt *</Label>
                  <Textarea
                    id="blogExcerpt"
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    placeholder="Brief summary for the blog card..."
                    rows={3}
                    required
                  />
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="adminNote" className="text-base font-bold text-primary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Admin Note / Announcement
                  </Label>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Show Note</span>
                    <Switch
                      id="showNotes"
                      checked={blogForm.showNotes}
                      onCheckedChange={(checked) => setBlogForm({ ...blogForm, showNotes: checked })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Textarea
                    id="adminNote"
                    value={blogForm.adminNote}
                    onChange={(e) => setBlogForm({ ...blogForm, adminNote: e.target.value })}
                    placeholder="Add a special note or status update for this blog post..."
                    rows={4}
                    className="bg-amber-50/30 border-amber-200/50 focus:border-amber-400 focus:ring-amber-400"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    This note will appear prominently at the top of the blog post.
                  </p>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Featured Image *</Label>
                  <div className="relative group rounded-lg overflow-hidden border-2 border-dashed aspect-video bg-muted/50 flex flex-col items-center justify-center text-center p-4">
                    {blogForm.image ? (
                      <>
                        <img src={blogForm.image} alt="Featured" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button" variant="secondary" size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                          >
                            <Upload className="w-4 h-4 mr-2" /> Change Image
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-background rounded-full inline-block shadow-sm">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <Button
                            type="button" variant="ghost" size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            Upload Cover
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Recommended 1200x630</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFeaturedImageUpload} />
                  </div>
                  <Input
                    type="url" value={blogForm.image}
                    onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })}
                    placeholder="Paste image URL instead"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="blogSlug">Slug *</Label>
                  <Input id="blogSlug" value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} required
                    className="bg-muted/30 font-mono text-xs" />
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blogCategory">Category *</Label>
                  <Input id="blogCategory" value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} placeholder="React, CSS, etc." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blogReadTime">Read Time *</Label>
                  <Input id="blogReadTime" value={blogForm.readTime}
                    onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })} placeholder="5 min read" required />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Publish Post</Label>
                      <p className="text-[10px] text-muted-foreground">Visible to everyone</p>
                    </div>
                    <Switch id="blogIsPublic" checked={blogForm.isPublic}
                      onCheckedChange={(checked) => setBlogForm({ ...blogForm, isPublic: checked })} />
                  </div>

                  <div className="flex items-center justify-between bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-amber-600">Featured</Label>
                      <p className="text-[10px] text-muted-foreground">Show on homepage</p>
                    </div>
                    <Switch id="blogIsFeatured" checked={blogForm.isFeatured}
                      onCheckedChange={(checked) => setBlogForm({ ...blogForm, isFeatured: checked })} />
                  </div>
                </div>
              </Card>

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full gradient-primary text-white h-12 text-lg shadow-lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {viewMode === 'edit' ? "Saving Changes..." : "Publishing..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {viewMode === 'edit' ? "Save Changes" : "Publish Post"}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => { setViewMode('grid'); resetForm(); }}>
                  Discard and Exit
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Blog Posts</h2>
          <p className="text-muted-foreground">Manage your articles and tutorials</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-primary/10 focus:border-primary/30 h-10"
            />
          </div>
          <Button onClick={() => setViewMode('add')} className="gradient-primary border-0 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Write New Post
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <Save className="w-24 h-24 rotate-12" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold flex items-center gap-2">
                <Save className="w-4 h-4 text-primary" /> Global Blog Announcement
              </h3>
              <p className="text-xs text-muted-foreground italic">This message will appear on ALL blog posts near the publish date.</p>
            </div>
            <Button
              size="sm"
              onClick={saveGlobalSettings}
              disabled={savingSettings}
              className="gradient-primary text-white h-8 text-xs font-bold uppercase tracking-wider px-4 border-0 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
              {savingSettings ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
              Save Announcement
            </Button>
          </div>
          <Input
            value={globalAnnouncement}
            onChange={(e) => setGlobalAnnouncement(e.target.value)}
            placeholder="e.g. 📢 Big update coming soon! | Happy New Year to all readers!"
            className="bg-white/50 border-primary/10 transition-all focus:bg-white"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
          <div className="col-span-full bg-muted/20 border-2 border-dashed rounded-xl py-12 text-center">
            <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No blog posts found matching your search.</p>
          </div>
        ) : (
          blogPosts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((post) => (
            <Card key={post.id} className="group overflow-hidden flex flex-col h-auto animate-slide-up bg-card hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg", post.isPublic ? "bg-green-500/90 text-white" : "bg-yellow-500/90 text-white")}>
                    {post.isPublic ? "Published" : "Draft"}
                  </div>
                  {post.isFeatured && (
                    <div className="bg-amber-500/90 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg">
                      Featured
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" className="h-10 w-10 bg-white/10 border-white/20 text-white hover:bg-white/20 scale-90 group-hover:scale-100 transition-all" onClick={() => startEdit(post)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/40 scale-90 group-hover:scale-100 transition-all" onClick={() => onDelete(post.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {post.category}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(post.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                  </div>
                </div>
                <h4 className="font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors underline-offset-4 decoration-primary">{post.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">{post.excerpt}</p>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pt-2 border-t">
                  <div className="flex items-center gap-1" title="Views">
                    <Eye className="w-3 h-3" />
                    <span>{post.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Likes">
                    <Heart className="w-3 h-3" />
                    <span>{post.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Comments">
                    <MessageSquare className="w-3 h-3" />
                    <span>{post.commentCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Shares">
                    <Share2 className="w-3 h-3" />
                    <span>{post.shares || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] border-t pt-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Last updated {new Date(post.updatedAt || post.date).toLocaleDateString()}
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors" onClick={() => startEdit(post)}>
                    Full Edit <ChevronLeft className="w-3 h-3 ml-1 rotate-180" />
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-[10px] font-bold uppercase tracking-widest gap-2 h-8 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                    onClick={() => openComments(post)}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Manage Comments
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-primary/20 shadow-2xl">
          <DialogHeader className="p-6 border-b bg-muted/30">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              Comments: {activeCommentPost?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
            {loadingComments ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Fetching reader feedback...</p>
              </div>
            ) : postComments.length === 0 ? (
              <div className="text-center py-12 space-y-3 opacity-50">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <p className="text-sm font-medium">No comments on this post yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {postComments.map((comment) => (
                  <Card key={comment.id} className={cn(
                    "group relative overflow-hidden transition-all hover:shadow-md border-l-4",
                    comment.isAdmin ? "border-l-primary bg-primary/5" : "border-l-border"
                  )}>
                    <div className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 border shadow-sm">
                          <AvatarImage src={comment.userPhotoURL} />
                          <AvatarFallback className="text-[10px]">{comment.userDisplayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate">{comment.userDisplayName}</span>
                              {comment.isAdmin && <Badge className="h-4 text-[8px] bg-primary text-white">Admin</Badge>}
                              <span className="text-[9px] text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteComment(comment.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <p className="text-sm text-foreground/90 leading-relaxed italic bg-background/50 p-2.5 rounded-lg border shadow-inner mb-3">
                            "{comment.content}"
                          </p>

                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-7 text-xs font-bold uppercase tracking-widest gap-2 hover:text-primary px-0",
                                replyTo === comment.id && "text-primary"
                              )}
                              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            >
                              <Reply className="w-3 h-3" />
                              {replyTo === comment.id ? 'Cancel' : 'Reply'}
                            </Button>
                            <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                              <ThumbsUp className="w-2.5 h-2.5" /> {comment.likes || 0}
                            </span>
                          </div>

                          {replyTo === comment.id && (
                            <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your response..."
                                className="min-h-[80px] text-sm bg-card"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button size="sm" className="gradient-primary text-white h-8 text-xs font-bold uppercase tracking-wider px-4 border-0" onClick={() => handleReply(comment)} disabled={submittingReply === comment.id || !replyText.trim()}>
                                  {submittingReply === comment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-2" />}
                                  Post Reply
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/30">
            <Button variant="outline" className="w-full h-10 font-bold uppercase tracking-widest text-xs" onClick={() => setIsCommentsOpen(false)}>
              Close Management
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
