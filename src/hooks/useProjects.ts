import { useQuery } from '@tanstack/react-query';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';

export interface Project {
    id: string;
    title: string;
    description: string;
    image: string;
    tags: string[];
    githubUrl?: string;
    liveUrl?: string;
    isPublic: boolean;
    category: string;
}

const staticProjects: Project[] = [
    // ... static projects stay same ...
    {
        id: "1",
        title: "E-Commerce Platform",
        description: "A full-featured e-commerce platform with payment integration, inventory management, and admin dashboard.",
        image: "https://images.unsplash.com/photo-1557821552-17105176677c?w=600&h=400&fit=crop",
        tags: ["React", "Node.js", "PostgreSQL", "Stripe"],
        githubUrl: "#",
        liveUrl: "#",
        isPublic: true,
        category: "web"
    },
    {
        id: "2",
        title: "Task Management App",
        description: "Collaborative task management tool with real-time updates, team workspaces, and progress tracking.",
        image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&h=400&fit=crop",
        tags: ["React", "TypeScript", "Supabase", "Tailwind"],
        githubUrl: "#",
        liveUrl: "#",
        isPublic: true,
        category: "web"
    },
    {
        id: "3",
        title: "Analytics Dashboard",
        description: "Advanced analytics dashboard with interactive charts, data visualization, and export features.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
        tags: ["React", "D3.js", "Redux", "Material-UI"],
        isPublic: false,
        category: "data"
    },
    {
        id: "4",
        title: "Social Media Platform",
        description: "Feature-rich social networking platform with posts, comments, likes, and real-time messaging.",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop",
        tags: ["Next.js", "Socket.io", "MongoDB", "AWS"],
        isPublic: false,
        category: "web"
    }
];

export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            try {
                // Use REST list for faster load and no channels
                const docs = await firestoreRest.list("projects", { orderBy: "createdAt desc" });

                const projectsData = docs.map((doc: any) => ({
                    id: doc.name.split('/').pop(),
                    title: extractVal(doc.fields.title),
                    description: extractVal(doc.fields.description),
                    image: extractVal(doc.fields.image),
                    tags: extractVal(doc.fields.tags) || [],
                    githubUrl: extractVal(doc.fields.githubUrl),
                    liveUrl: extractVal(doc.fields.liveUrl),
                    isPublic: extractVal(doc.fields.isPublic),
                    category: extractVal(doc.fields.category),
                })) as Project[];

                return projectsData.length > 0 ? projectsData : staticProjects;
            } catch (error) {
                console.error("Error fetching projects:", error);
                return staticProjects;
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};
