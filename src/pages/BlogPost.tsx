import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, List, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SEO } from "@/components/SEO";
import { BlogJsonLd } from "@/components/BlogJsonLd";
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { BlogPost as BlogPostType, defaultBlogPosts } from '@/types/blog';
import { cn } from "@/lib/utils";
import { BlogSocial } from "@/components/blog/BlogSocial";
import { BlogComments } from "@/components/blog/BlogComments";


import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import parse, { Element, DOMNode, domToReact } from 'html-react-parser';
import { CodeBlock } from "@/components/blog/CodeBlock";
import { BlogChart } from "@/components/blog/BlogChart";
import { BlogAudioPlayer } from "@/components/blog/BlogAudioPlayer";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalAnnouncement, setGlobalAnnouncement] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Fetch global settings first
        const settingsDocs = await firestoreRest.list('settings');
        const blogSettings = settingsDocs.find((doc: any) => doc.name.endsWith('blog'));
        if (blogSettings) {
          setGlobalAnnouncement(extractVal(blogSettings.fields.globalAnnouncement) || "");
        }

        // First try to find by slug
        const docs = await firestoreRest.query('blog_posts', {
          where: [{ field: 'slug', op: 'EQUAL', value: id }]
        });

        if (docs.length === 0) {
          // Try to find by ID in Firestore
          const allDocs = await firestoreRest.list('blog_posts', { orderBy: 'date desc' });
          const foundDoc = allDocs.find((d: any) => d.name.split('/').pop() === id);

          if (foundDoc) {
            const data = foundDoc.fields;
            setPost({
              id: foundDoc.name.split('/').pop(),
              title: extractVal(data.title),
              excerpt: extractVal(data.excerpt),
              content: extractVal(data.content),
              date: extractVal(data.date),
              category: extractVal(data.category),
              author: extractVal(data.author),
              readTime: extractVal(data.readTime),
              image: extractVal(data.image),
              slug: extractVal(data.slug),
              isPublic: extractVal(data.isPublic),
              tags: extractVal(data.tags) || [],
              adminNote: extractVal(data.adminNote) || "",
              showNotes: extractVal(data.showNotes) || false,
              showComments: extractVal(data.showComments) ?? true,
            } as BlogPostType);
          } else {
            // Fallback to default posts
            const defaultPost = defaultBlogPosts.find(p => p.slug === id || p.id === id);
            setPost(defaultPost || null);
          }
        } else {
          const docData = docs[0];
          const data = docData.fields;
          const postId = docData.name.split('/').pop();

          // Increment view count
          // In a real app we would use a more robust tracking method (session based)
          // For now we just check simple local storage to avoid spamming refreshes
          const viewedPosts = JSON.parse(localStorage.getItem('viewed_posts') || '[]');
          if (!viewedPosts.includes(postId)) {
            try {
              const currentViews = extractVal(data.views) || 0;
              await firestoreRest.patch('blog_posts', postId, { views: currentViews + 1 });
              // Update local storage
              localStorage.setItem('viewed_posts', JSON.stringify([...viewedPosts, postId]));
            } catch (e) { console.error("Error updating views", e); }
          }

          setPost({
            id: postId,
            title: extractVal(data.title),
            excerpt: extractVal(data.excerpt),

            content: extractVal(data.content),
            date: extractVal(data.date),
            category: extractVal(data.category),
            author: extractVal(data.author),
            readTime: extractVal(data.readTime),
            image: extractVal(data.image),
            slug: extractVal(data.slug),
            isPublic: extractVal(data.isPublic),
            tags: extractVal(data.tags) || [],
            views: extractVal(data.views) || 0,
            likes: extractVal(data.likes) || 0,
            shares: extractVal(data.shares) || 0,
            commentCount: extractVal(data.commentCount) || 0,
            adminNote: extractVal(data.adminNote) || "",
            showNotes: extractVal(data.showNotes) || false,
            showComments: extractVal(data.showComments) ?? true,
          } as BlogPostType);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        // Fallback to default posts
        const defaultPost = defaultBlogPosts.find(p => p.slug === id || p.id === id);
        setPost(defaultPost || null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    // Only redirect if AUTH is done loading and user is still null
    if (!authLoading && post && !post.isPublic && !user) {
      navigate('/auth');
    }
  }, [post, user, authLoading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-32" />
            <div className="h-64 md:h-96 bg-muted rounded-lg" />
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const currentUrl = `${window.location.origin}${location.pathname}`;

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        keywords={`${post.category}, blog, article, ${post.tags?.join(', ') || ''}`}
      />
      <BlogJsonLd post={post} url={currentUrl} />

      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-8 notranslate"
            onClick={() => navigate('/blog')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>

          {/* Hero Image */}
          <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8 animate-fade-in">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className="gradient-primary text-white border-0">
                {post.category}
              </Badge>
            </div>
          </div>

          {/* Article Header */}
          <article className="animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative">
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex-1 leading-tight">
                {post.title}
              </h1>

              {/* Controls (Audio + Translate) - Static Position */}
              <div className="flex-shrink-0 mt-4 md:mt-0 md:ml-6">
                <BlogAudioPlayer content={post.content} title={post.title} className="bg-background/80 backdrop-blur-sm" />
              </div>
            </div>

            {/* Article Content Area */}

            {/* Meta Info & Announcements */}
            <div className="mb-8 pb-8 border-b">
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground notranslate mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-medium">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-medium">{post.readTime}</span>
                </div>
                {post.author && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-muted text-xs font-bold uppercase tracking-wider">By {post.author}</span>
                  </div>
                )}
              </div>

              {/* Global Announcement */}
              {globalAnnouncement && (
                <div className="mb-4 p-4 bg-primary/5 border-l-4 border-primary rounded-r-xl animate-in fade-in slide-in-from-left duration-500">
                  <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Global Announcement</span>
                  </div>
                  <p className="text-foreground/90 italic text-sm font-medium">
                    {globalAnnouncement}
                  </p>
                </div>
              )}

              {/* Per-Post Admin Note */}
              {post.showNotes && post.adminNote && (
                <div className="p-4 bg-amber-500/5 border-l-4 border-amber-500 rounded-r-xl animate-in fade-in slide-in-from-left duration-700 delay-150">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest mb-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Special Note</span>
                  </div>
                  <p className="text-foreground/90 italic text-sm font-medium">
                    {post.adminNote}
                  </p>
                </div>
              )}
            </div>

            {/* Article Content */}
            <div id="blog-content-main" className={`prose prose-lg dark:prose-invert max-w-none
                prose-headings:text-foreground prose-headings:scroll-mt-24
                prose-p:text-foreground/90 prose-p:leading-relaxed
                prose-strong:text-foreground prose-strong:font-black
                prose-em:text-foreground/80 prose-em:italic
                prose-a:text-primary prose-a:font-bold hover:prose-a:underline
                prose-img:rounded-2xl prose-img:shadow-lg
                prose-table:border prose-table:border-border/50
                prose-th:bg-muted/50 prose-th:px-4 prose-th:py-3 prose-th:text-foreground
                prose-td:border-t prose-td:border-border/30 prose-td:px-4 prose-td:py-3 prose-td:text-muted-foreground`}>

              {/* Check if content is HTML (from new editor) or Markdown (legacy) */}
              {post.content.trim().startsWith('<') ? (
                <div>
                  {parse(post.content, {
                    replace: (domNode) => {
                      if (domNode instanceof Element && domNode.name === 'pre') {
                        const codeElement = domNode.children[0] as Element;
                        if (codeElement && codeElement.name === 'code') {
                          const className = codeElement.attribs.class || '';
                          const language = className.replace('language-', '');
                          // Extract text content safely
                          const codeContent = (codeElement.children[0] as any)?.data || '';

                          if (language === 'chart') {
                            try {
                              const config = JSON.parse(codeContent);
                              return <BlogChart config={config} />;
                            } catch (e) {
                              return <CodeBlock code={codeContent} language="json (invalid chart)" />;
                            }
                          }
                          return <CodeBlock code={codeContent} language={language} />;
                        }
                      }
                    }
                  })}
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        <CodeBlock code={String(children).replace(/\n$/, '')} language={match[1]} />
                      ) : (
                        <code {...rest} className={className}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4 text-xs uppercase tracking-widest text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 rounded-lg">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}



            {/* Social & Comments */}
            <div className="notranslate">
              <BlogSocial
                blogId={post.id}
                initialLikes={post.likes}
                initialViews={post.views}
                initialShares={post.shares}
                slug={post.slug}
              />
            </div>

            <BlogComments blogId={post.id} />

            {/* Footer */}
            <div className="mt-12 pt-8 border-t notranslate">
              <Button
                onClick={() => navigate('/blog')}
                className="gradient-primary border-0 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Posts
              </Button>
            </div>
          </article>
        </div >
      </div >
    </>
  );
};

export default BlogPost;
