import { useQuery } from '@tanstack/react-query';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { BlogPost, defaultBlogPosts } from '@/types/blog';

interface UseBlogPostsOptions {
  limitCount?: number;
  publicOnly?: boolean;
}

export const useBlogPosts = (options: UseBlogPostsOptions = {}) => {
  const { limitCount, publicOnly = false } = options;

  const { data, isLoading, error } = useQuery({
    queryKey: ['blogPosts', { limitCount, publicOnly }],
    queryFn: async () => {
      try {
        const where: any[] = [];
        if (publicOnly) {
          where.push({ field: 'isPublic', op: 'EQUAL', value: true });
        }

        const docs = await firestoreRest.query('blog_posts', {
          where,
          orderBy: [{ field: 'date', direction: 'DESCENDING' }],
          limit: limitCount
        });

        const postsData = docs.map((doc: any) => ({
          id: doc.name.split('/').pop(),
          title: extractVal(doc.fields.title),
          excerpt: extractVal(doc.fields.excerpt),
          content: extractVal(doc.fields.content),
          date: extractVal(doc.fields.date),
          category: extractVal(doc.fields.category),
          author: extractVal(doc.fields.author),
          readTime: extractVal(doc.fields.readTime),
          image: extractVal(doc.fields.image),
          slug: extractVal(doc.fields.slug),
          isPublic: extractVal(doc.fields.isPublic),
          tags: extractVal(doc.fields.tags) || [],
        })) as BlogPost[];

        return {
          posts: postsData.length > 0 ? postsData : defaultBlogPosts.slice(0, limitCount || defaultBlogPosts.length),
          firestoreAvailable: true
        };
      } catch (error: any) {
        console.error('Error fetching blog posts:', error);

        // Fallback to default posts
        const filteredPosts = publicOnly
          ? defaultBlogPosts.filter(p => p.isPublic)
          : defaultBlogPosts;

        return {
          posts: limitCount ? filteredPosts.slice(0, limitCount) : filteredPosts,
          firestoreAvailable: false
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    posts: data?.posts || [],
    loading: isLoading,
    firestoreAvailable: data?.firestoreAvailable ?? null
  };
};
