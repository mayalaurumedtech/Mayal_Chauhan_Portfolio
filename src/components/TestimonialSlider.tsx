import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { Testimonial } from '@/types/testimonial';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquare, ArrowRight, User, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export const TestimonialSlider = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchVisibleTestimonials();
    }, []);

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

    if (loading) return null;

    return (
        <section className="pt-16 md:pt-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-accent/5 blur-[100px] rounded-full -z-10" />

            <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        <span className="text-primary">Testimonials</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Real stories from people I've worked with. Your satisfaction is my greatest success.
                    </p>
                    <div className="pt-4">
                        <Button
                            onClick={() => navigate('/reviews')}
                            className="gradient-primary text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all"
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Write a Review
                        </Button>
                    </div>
                </div>

                <div className="relative group/slider max-w-6xl mx-auto">
                    {/* Custom Navigation */}
                    <button className="testimonial-prev absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/80 backdrop-blur-md shadow-xl border border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/slider:opacity-100 scale-90 group-hover/slider:scale-100">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button className="testimonial-next absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/80 backdrop-blur-md shadow-xl border border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/slider:opacity-100 scale-90 group-hover/slider:scale-100">
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation={{
                            prevEl: '.testimonial-prev',
                            nextEl: '.testimonial-next'
                        }}
                        pagination={{
                            clickable: true,
                            dynamicBullets: true
                        }}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        breakpoints={{
                            768: { slidesPerView: testimonials.length > 0 ? 2 : 1 },
                            1024: { slidesPerView: testimonials.length > 0 ? 3 : 1 },
                        }}
                        className="pb-16"
                    >
                        {testimonials.map((review) => (
                            <SwiperSlide key={review.id}>
                                <Card className="h-full p-8 relative flex flex-col bg-gradient-to-br from-card to-background border-primary/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 group">
                                    <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Quote className="w-12 h-12 text-primary" />
                                    </div>

                                    <div className="flex gap-1 mb-6">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={cn(
                                                    "w-4 h-4",
                                                    star <= review.rating ? "text-amber-400 fill-current" : "text-muted/20"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-foreground/80 italic leading-relaxed mb-8 flex-1">
                                        "{review.content}"
                                    </p>

                                    <div className="flex items-center gap-4 pt-6 border-t border-primary/5">
                                        <Avatar className="h-12 w-12 border-2 border-primary/10">
                                            <AvatarImage src={review.userPhotoURL} />
                                            <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-bold text-base truncate">{review.userDisplayName}</p>
                                            {review.userLocation && (
                                                <p className="text-xs text-primary/70 font-medium truncate flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {review.userLocation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </SwiperSlide>
                        ))}

                        {/* Call to Action Slide - Only show if no reviews yet */}
                        {testimonials.length === 0 && (
                            <SwiperSlide>
                                <Card className={cn(
                                    "h-full p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-primary/10 via-background to-accent/5 border-primary/20 hover:border-primary/40 transition-all group cursor-pointer shadow-lg",
                                    "min-h-[320px] max-w-lg mx-auto"
                                )}
                                    onClick={() => navigate('/reviews')}
                                >
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-primary/20">
                                        <MessageSquare className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                        Be the First to Review!
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-8 max-w-[250px] leading-relaxed">
                                        We'd love to hear about your experience. Your feedback matters to us!
                                    </p>
                                    <Button className="gradient-primary text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105 transition-all outline-none border-0">
                                        Write a Review <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Card>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>

                <div className="text-center mt-8">
                    <Link to="/reviews">
                        <Button variant="link" className="text-muted-foreground hover:text-primary transition-colors gap-2">
                            View All Testimonials <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};
