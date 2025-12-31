import { Helmet } from 'react-helmet-async';
import { BlogPost } from '@/types/blog';

interface BlogJsonLdProps {
  post: BlogPost;
  url: string;
}

export const BlogJsonLd = ({ post, url }: BlogJsonLdProps) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image,
    "datePublished": post.date,
    "dateModified": post.updatedAt ? new Date(post.updatedAt.seconds * 1000).toISOString() : post.date,
    "author": {
      "@type": "Person",
      "name": post.author || "Mayal"
    },
    "publisher": {
      "@type": "Person",
      "name": "Mayal"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "articleSection": post.category,
    "wordCount": post.content.split(/\s+/).length,
    "keywords": post.tags?.join(", ") || post.category
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};
