import { useQuery } from '@tanstack/react-query';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';

export interface Biography {
    id: string;
    content: string;
    order: number;
}

const staticBiography: Biography[] = [
    {
        id: "1",
        content: "I am a dedicated Frontend Developer with over 3 years of experience in crafting high-performance, visually stunning web applications. My journey began in Web Design, giving me a unique perspective on the intersection of aesthetics and functionality.",
        order: 0
    },
    {
        id: "2",
        content: "Currently specializing in the React ecosystem (Redux, TypeScript, Tailwind CSS), I bridge the gap between complex backend requirements and intuitive user experiences. With a background in accounting and a professional focus on On-page SEO, I bring a data-driven and analytical approach to every project I build.",
        order: 1
    }
];

export const useBiography = () => {
    return useQuery({
        queryKey: ['biography'],
        queryFn: async () => {
            try {
                const docs = await firestoreRest.list("biography", { orderBy: "order asc" });
                const bio = docs.map((doc: any) => ({
                    id: doc.name.split('/').pop(),
                    content: extractVal(doc.fields.content),
                    order: extractVal(doc.fields.order) || 0,
                })) as Biography[];

                return bio.length > 0 ? bio : staticBiography;
            } catch (error) {
                console.error("Error fetching biography:", error);
                return staticBiography;
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};
