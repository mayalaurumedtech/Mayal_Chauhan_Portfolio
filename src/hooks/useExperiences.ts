import { useQuery } from '@tanstack/react-query';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';

export interface Experience {
    id: string;
    role: string;
    company: string;
    period: string;
    description: string;
    type: 'experience';
}

const staticExperiences: Experience[] = [
    {
        id: "1",
        role: "Frontend Developer",
        company: "Edzyme Tech Private Limited",
        period: "2024 - Present",
        description: "Leading development of enterprise applications with modern tech stack.",
        type: 'experience'
    },
    {
        id: "2",
        role: "Web Designer",
        company: "Clients Now Technologies",
        period: "2022 - 2024",
        description: "Built and maintained multiple client projects using React and Node.js.",
        type: 'experience'
    }
];

export const useExperiences = () => {
    return useQuery({
        queryKey: ['experiences'],
        queryFn: async () => {
            try {
                const docs = await firestoreRest.list("experiences", { orderBy: "period desc" });
                const experiences = docs.map((doc: any) => ({
                    id: doc.name.split('/').pop(),
                    role: extractVal(doc.fields.role),
                    company: extractVal(doc.fields.company),
                    period: extractVal(doc.fields.period),
                    description: extractVal(doc.fields.description),
                    type: 'experience',
                })) as Experience[];

                return experiences.length > 0 ? experiences : staticExperiences;
            } catch (error) {
                console.error("Error fetching experiences:", error);
                return staticExperiences;
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};
