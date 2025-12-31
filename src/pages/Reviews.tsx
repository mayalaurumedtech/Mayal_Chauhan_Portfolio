import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { Testimonial } from '@/types/testimonial';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { Star, MessageSquare, Send, Loader2, User, ArrowLeft, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Reviews = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        content: '',
        location: '', // New field
        rating: 5
    });

    useEffect(() => {
        fetchVisibleTestimonials();
    }, []);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user && !formData.location) {
                try {
                    const token = await user.getIdToken();
                    const profile = await firestoreRest.get('profiles', user.uid, token);
                    if (profile && profile.fields) {
                        const location = extractVal(profile.fields.location);
                        if (location) {
                            setFormData(prev => ({ ...prev, location }));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching profile for location:", error);
                }
            }
        };
        fetchUserProfile();
    }, [user]);

    const fetchVisibleTestimonials = async () => {
        try {
            const docs = await firestoreRest.list("testimonials");
            const data = docs
                .map((doc: any) => ({
                    id: doc.name.split('/').pop(),
                    userId: extractVal(doc.fields.userId),
                    userDisplayName: extractVal(doc.fields.userDisplayName),
                    userPhotoURL: extractVal(doc.fields.userPhotoURL),
                    userLocation: extractVal(doc.fields.userLocation) || '',
                    content: extractVal(doc.fields.content),
                    rating: extractVal(doc.fields.rating) || 0,
                    date: extractVal(doc.fields.date),
                    isVisible: extractVal(doc.fields.isVisible) || false,
                    createdAt: extractVal(doc.fields.createdAt),
                })) as Testimonial[];

            setTestimonials(data.filter(t => t.isVisible).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Error fetching testimonials:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Login Required", description: "Please login to submit a review.", variant: "destructive" });
            navigate('/auth');
            return;
        }

        if (!formData.content.trim()) {
            toast({ title: "Empty Review", description: "Please write something about your experience.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            const newReview: Partial<Testimonial> = {
                userId: user.uid,
                userDisplayName: user.displayName || 'Anonymous User',
                userPhotoURL: user.photoURL || '',
                userLocation: formData.location || '',
                content: formData.content,
                rating: formData.rating,
                date: new Date().toISOString().split('T')[0],
                isVisible: true, // Visible by default, admin can hide later
                createdAt: new Date().toISOString(),
            };

            const response = await firestoreRest.create('testimonials', newReview, token);
            const createdReview = {
                ...newReview,
                id: response.name.split('/').pop()
            } as Testimonial;

            setTestimonials(prev => [createdReview, ...prev]);

            toast({
                title: "Review Published!",
                description: "Thank you for your feedback! Your review is now visible to everyone.",
            });
            setFormData({ content: '', location: '', rating: 5 });
        } catch (error) {
            toast({ title: "Error", description: "Failed to submit review. Please try again.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <SEO
                title="User Reviews"
                description="Read what our users have to say and share your own experience."
            />
            <div className="min-h-screen py-20 bg-background">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
                        <div className="space-y-4 max-w-2xl">
                            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">User <span className="text-primary italic">Reviews</span></h1>
                            <p className="text-lg text-muted-foreground">
                                Your feedback helps us improve and provides valuable insights for other users.
                                Share your journey with us!
                            </p>
                        </div>

                        {/* Submission Form Card */}
                        <Card className="w-full md:w-[400px] p-6 shadow-xl border-primary/10 relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                                <MessageSquare className="w-24 h-24" />
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-primary" /> Write a Review
                                </h3>

                                {!user && (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs italic text-amber-600 mb-2">
                                        You must be logged in to submit a review.
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Rating</Label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rating: star })}
                                                className={cn(
                                                    "transition-transform hover:scale-110",
                                                    star <= formData.rating ? "text-amber-400" : "text-muted/30"
                                                )}
                                            >
                                                <Star className={cn("w-6 h-6", star <= formData.rating && "fill-current")} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* <div className="space-y-2">
                                    <Label htmlFor="location">Location (Optional)</Label>
                                    <div className="relative group">
                                        <Input
                                            id="location"
                                            placeholder="e.g. Ahmedabad, India"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="bg-background/50 pl-10"
                                        />
                                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    </div>
                                </div> */}

                                <div className="space-y-2">
                                    <Label htmlFor="review-content">Your Experience</Label>
                                    <Textarea
                                        id="review-content"
                                        placeholder="Tell us what you liked (or what we can improve)..."
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="min-h-[120px] bg-background/50"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full gradient-primary text-white font-bold h-11"
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
                                </Button>
                            </form>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold border-b pb-4">What Others Are Saying</h2>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <Card key={i} className="h-48 animate-pulse bg-muted/20" />
                                ))}
                            </div>
                        ) : testimonials.length === 0 ? (
                            <div className="text-center py-20 opacity-50 space-y-4">
                                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30" />
                                <p className="text-lg font-medium">No public reviews yet. Be the first!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {testimonials.map((review) => (
                                    <Card key={review.id} className="p-6 hover:shadow-lg transition-all border-primary/5 bg-gradient-to-br from-card to-background">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border shadow-sm">
                                                    <AvatarImage src={review.userPhotoURL} />
                                                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-sm">{review.userDisplayName}</p>
                                                    <p className="text-[10px] text-primary/70 font-medium">
                                                        {review.userLocation || format(new Date(review.date), 'PPP')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={cn(
                                                            "w-3 h-3",
                                                            star <= review.rating ? "text-amber-400 fill-current" : "text-muted/30"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-foreground/90 leading-relaxed italic text-sm">
                                            "{review.content}"
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Reviews;
