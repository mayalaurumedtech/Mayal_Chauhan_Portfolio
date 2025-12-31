export interface Testimonial {
    id: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL: string;
    userLocation?: string; // New field for location
    content: string;
    rating: number; // 1-5
    date: string;
    isVisible: boolean; // Managed by admin
    createdAt: string;
}

export const defaultTestimonials: Testimonial[] = [
    {
        id: "1",
        userId: "system",
        userDisplayName: "John Doe",
        userPhotoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
        content: "Amazing work! The attention to detail and professional approach is outstanding.",
        rating: 5,
        date: "2024-12-01",
        isVisible: true,
        createdAt: new Date("2024-12-01").toISOString()
    },
    {
        id: "2",
        userId: "system",
        userDisplayName: "Sarah Smith",
        userPhotoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        content: "Highly recommend for any web development project. Very skilled and communicative.",
        rating: 5,
        date: "2024-12-15",
        isVisible: true,
        createdAt: new Date("2024-12-15").toISOString()
    }
];
