import { useQuery } from '@tanstack/react-query';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';

export interface Skill {
    id: string;
    name: string;
    iconName: string;
    color: string;
}

const staticSkills: Skill[] = [
    { id: "1", name: "React", iconName: "SiReact", color: "from-cyan-400 to-blue-500" },
    { id: "2", name: "Redux", iconName: "SiRedux", color: "from-purple-500 to-violet-600" },
    { id: "3", name: "TypeScript", iconName: "SiTypescript", color: "from-blue-500 to-blue-700" },
    { id: "4", name: "JavaScript", iconName: "SiJavascript", color: "from-yellow-400 to-orange-500" },
    { id: "5", name: "Tailwind CSS", iconName: "SiTailwindcss", color: "from-cyan-400 to-teal-500" },
    { id: "6", name: "HTML5", iconName: "SiHtml5", color: "from-orange-400 to-red-500" },
    { id: "7", name: "CSS3", iconName: "SiCss3", color: "from-blue-400 to-indigo-500" },
    { id: "8", name: "On-page SEO", iconName: "SiGoogle", color: "from-blue-500 to-green-500" },
];

export const useSkills = () => {
    return useQuery({
        queryKey: ['skills'],
        queryFn: async () => {
            try {
                const docs = await firestoreRest.list("skills", { orderBy: "createdAt desc" });
                const skills = docs.map((doc: any) => ({
                    id: doc.name.split('/').pop(),
                    name: extractVal(doc.fields.name),
                    iconName: extractVal(doc.fields.iconName),
                    color: extractVal(doc.fields.color),
                })) as Skill[];

                return skills.length > 0 ? skills : staticSkills;
            } catch (error) {
                console.error("Error fetching skills:", error);
                return staticSkills;
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};
