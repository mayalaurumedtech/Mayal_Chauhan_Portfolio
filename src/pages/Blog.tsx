import { useState } from 'react';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import { BlogCardSkeleton } from "@/components/LoadingSkeleton";
import { Calendar, Clock, Lock, ArrowRight, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { BlogPost } from '@/types/blog';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Filter } from 'lucide-react';

const Blog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { posts: blogPosts, loading } = useBlogPosts();

  const categories = ['all', ...Array.from(new Set(blogPosts.map(post => post.category)))];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handlePostClick = (post: BlogPost) => {
    if (!post.isPublic && !user) {
      navigate('/auth');
    } else {
      navigate(`/blog/${post.slug || post.id}`);
    }
  };

  return (
    <>
      <SEO
        title="Blog"
        description="Read our latest articles on web development, design, and technology"
        keywords="blog, articles, web development, design, technology, tutorials"
      />
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Blog
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Articles about web development, programming, and technology. Login to read full articles.
            </p>
          </div>

          {/* Search and Categories */}
          <div className="max-w-4xl mx-auto mb-12 animate-slide-up space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
              <div className="relative w-full max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary transition-all duration-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 h-12 rounded-xl bg-background/50 backdrop-blur-sm border-primary/20">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "capitalize px-6 py-2 rounded-full h-auto transition-all duration-300",
                    selectedCategory === category
                      ? "gradient-primary border-0 text-white shadow-lg shadow-primary/25 scale-105"
                      : "hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Blog Posts Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No articles found matching your search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-smooth animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Post Image */}
                  <div className="relative h-48 md:h-56 overflow-hidden group">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="gradient-primary text-white border-0">
                        {post.category}
                      </Badge>
                    </div>
                    {!post.isPublic && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-background/90 backdrop-blur-sm rounded-full p-2">
                          <Lock className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="p-6">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-3 line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className={`text-muted-foreground mb-4 ${post.isPublic ? 'line-clamp-3' : 'line-clamp-2'}`}>
                      {post.excerpt}
                    </p>

                    {/* Action Button */}
                    {post.isPublic || user ? (
                      <Button
                        className="w-full gradient-primary border-0 text-white group"
                        onClick={() => handlePostClick(post)}
                      >
                        Read Full Article
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-smooth" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handlePostClick(post)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Login to Read Full Article
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Blog;
