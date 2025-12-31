import { useQuery } from '@tanstack/react-query';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';

export interface Education {
    id: string;
    degree: string;
    institution: string;
    period: string;
    description: string;
    type: 'education';
}

const staticEducations: Education[] = [
    {
        id: "1",
        degree: "Web Designer",
        institution: "Agile Group Of Company - Ahmedabad",
        period: "Dec 2020 - Apr 2021",
        description: "Completed web design certification and training.",
        type: 'education'
    },
    {
        id: "2",
        degree: "Master of Accounting",
        institution: "Saurashtra University - Rajkot",
        period: "2018 - 2020",
        description: "Specialized in financial accounting and auditing.",
        type: 'education'
    },
    {
        id: "3",
        degree: "Bachelor of Accounting",
        institution: "M K Bhavnagar University - Bhavnagar",
        period: "2016 - 2018",
        description: "Auditing and Accounting.",
        type: 'education'
    }
];

export const useEducations = () => {
    return useQuery({
        queryKey: ['educations'],
        queryFn: async () => {
            try {
                const docs = await firestoreRest.list("educations", { orderBy: "period desc" });
                const educations = docs.map((doc: any) => ({
                    id: doc.name.split('/').pop(),
                    degree: extractVal(doc.fields.degree),
                    institution: extractVal(doc.fields.institution),
                    period: extractVal(doc.fields.period),
                    description: extractVal(doc.fields.description),
                    type: 'education',
                })) as Education[];

                return educations.length > 0 ? educations : staticEducations;
            } catch (error) {
                console.error("Error fetching educations:", error);
                return staticEducations;
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};
