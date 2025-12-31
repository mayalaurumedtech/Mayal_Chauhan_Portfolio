import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, increment, getDoc } from 'firebase/firestore';

export const VisitorTracker = () => {
    const { user } = useAuth();

    useEffect(() => {
        const trackVisit = async () => {
            // Only track once per session
            const sessionTracked = sessionStorage.getItem('v2_visit_tracked');
            if (sessionTracked) return;

            try {
                const statsRef = doc(db, 'stats', 'visitors');
                const statsSnap = await getDoc(statsRef);

                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                const updateData: any = {
                    totalVisits: increment(1),
                    lastUpdated: new Date().toISOString(),
                    [`dailyVisits.${today}`]: increment(1)
                };

                if (user) {
                    updateData.userVisits = increment(1);
                    updateData[`dailyUserVisits.${today}`] = increment(1);
                } else {
                    updateData.guestVisits = increment(1);
                    updateData[`dailyGuestVisits.${today}`] = increment(1);
                }

                if (!statsSnap.exists()) {
                    await setDoc(statsRef, {
                        totalVisits: 1,
                        guestVisits: user ? 0 : 1,
                        userVisits: user ? 1 : 0,
                        dailyVisits: { [today]: 1 },
                        dailyGuestVisits: user ? {} : { [today]: 1 },
                        dailyUserVisits: user ? { [today]: 1 } : {},
                        lastUpdated: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    });
                } else {
                    await setDoc(statsRef, updateData, { merge: true });
                }

                sessionStorage.setItem('v2_visit_tracked', 'true');
            } catch (error) {
                console.error("Error tracking visit:", error);
            }
        };

        trackVisit();
    }, [user]);

    return null;
};
