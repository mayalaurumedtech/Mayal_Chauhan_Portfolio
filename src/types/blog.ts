export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  isPublic: boolean;
  author?: string;
  tags?: string[];
  isFeatured?: boolean;
  createdAt?: any;
  updatedAt?: any;
  views?: number;
  likes?: number;
  shares?: number;
  commentCount?: number;
  adminNote?: string;
  showNotes?: boolean;
  showComments?: boolean;
}

export interface BlogComment {
  id: string;
  blogId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  likes?: number;
  likedBy?: string[];
  isAdmin?: boolean;
}

export const defaultBlogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Getting Started with React TypeScript",
    slug: "getting-started-with-react-typescript",
    excerpt: "Learn the fundamentals of combining React with TypeScript for type-safe applications.",
    content: "React and TypeScript together provide a powerful combination for building robust web applications.\n\n## Why TypeScript with React?\n\nTypeScript adds static typing to JavaScript, which helps catch errors during development rather than at runtime.\n\n## Getting Started\n\nTo create a new React TypeScript project, you can use Vite:\n\n```bash\nnpm create vite@latest my-app -- --template react-ts\n```\n\n## Best Practices\n\n1. Always type your props and state\n2. Use interfaces for complex types\n3. Leverage TypeScript's utility types\n4. Enable strict mode in tsconfig.json",
    date: "2024-01-15",
    readTime: "8 min read",
    category: "React",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop",
    isPublic: true
  },
  {
    id: "2",
    title: "Advanced Tailwind CSS Techniques",
    slug: "advanced-tailwind-css-techniques",
    excerpt: "Discover advanced Tailwind CSS patterns and techniques to level up your styling game.",
    content: "Tailwind CSS has revolutionized how we write CSS in modern web applications.\n\n## Custom Utilities\n\nExtending Tailwind with custom utilities allows you to maintain consistency.\n\n## Component Patterns\n\nLearn how to create reusable component patterns using Tailwind's utility classes effectively.\n\n## Performance Optimization\n\nDiscover how to optimize your Tailwind build for production and reduce bundle sizes.",
    date: "2024-01-20",
    readTime: "12 min read",
    category: "CSS",
    image: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600&h=400&fit=crop",
    isPublic: true
  },
  {
    id: "3",
    title: "Building Scalable APIs with Node.js",
    slug: "building-scalable-apis-nodejs",
    excerpt: "A deep dive into creating production-ready REST APIs with Node.js.",
    content: "Building scalable APIs is crucial for modern web applications.\n\n## Architecture Patterns\n\nWe'll cover MVC, layered architecture, and microservices patterns.\n\n## Authentication & Authorization\n\nLearn how to implement JWT-based authentication and role-based access control.\n\n## Performance Optimization\n\nDiscover caching strategies, database optimization, and load balancing techniques.",
    date: "2024-01-25",
    readTime: "15 min read",
    category: "Backend",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop",
    isPublic: false
  }
];
