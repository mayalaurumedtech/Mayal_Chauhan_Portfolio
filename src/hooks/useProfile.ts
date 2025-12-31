import { useQuery } from '@tanstack/react-query';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';

interface ProfileData {
    bio: string;
    location: string;
    phone: string;
    website: string;
    photoURL: string;
}

export const useProfile = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            try {
                const data = await firestoreRest.get('profiles', userId);
                if (data.fields) {
                    return {
                        bio: extractVal(data.fields.bio),
                        location: extractVal(data.fields.location),
                        phone: extractVal(data.fields.phone),
                        website: extractVal(data.fields.website),
                        photoURL: extractVal(data.fields.photoURL),
                        displayName: extractVal(data.fields.displayName),
                    } as any;
                }
                return null;
            } catch (error: any) {
                if (error.response?.status === 404) return null;
                throw error;
            }
        },
        enabled: !!userId,
        staleTime: 3 * 60 * 1000,
        retry: 1,
    });
};
