import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest } from '@/lib/firestore-rest';
import { Trash2, Star, Eye, EyeOff, Loader2, User } from "lucide-react";
import { Testimonial } from '@/types/testimonial';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AdminReviewsProps {
    testimonials: Testimonial[];
    onRefresh: () => void;
    onDelete: (id: string) => void;
}

export const AdminReviews = ({ testimonials, onRefresh, onDelete }: AdminReviewsProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);

    const toggleVisibility = async (testimonial: Testimonial) => {
        if (!user) return;
        setLoading(testimonial.id);
        try {
            const token = await user.getIdToken();
            await firestoreRest.patch('testimonials', testimonial.id, {
                isVisible: !testimonial.isVisible
            }, token);

            toast({
                title: testimonial.isVisible ? "Review Hidden" : "Review Visible",
                description: `The review is now ${testimonial.isVisible ? 'hidden from' : 'visible on'} the homepage.`
            });
            onRefresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update review visibility",
                variant: "destructive"
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">User Reviews</h2>
                    <p className="text-muted-foreground">Manage and moderate user testimonials</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.length === 0 ? (
                    <div className="col-span-full bg-muted/20 border-2 border-dashed rounded-xl py-12 text-center text-muted-foreground">
                        No reviews submitted yet.
                    </div>
                ) : (
                    testimonials.map((review) => (
                        <Card key={review.id} className={cn(
                            "group relative overflow-hidden flex flex-col transition-all duration-300",
                            !review.isVisible && "opacity-75 bg-muted/30"
                        )}>
                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                                            <AvatarImage src={review.userPhotoURL} />
                                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{review.userDisplayName}</p>
                                            <div className="flex flex-col">
                                                {review.userLocation && (
                                                    <p className="text-[10px] text-primary/70 font-medium truncate">
                                                        {review.userLocation}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground">
                                                    {review.date ? format(new Date(review.date), 'PPP') : 'No date'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-primary/10 px-2 py-1 rounded text-primary font-bold text-xs">
                                        <Star className="w-3 h-3 fill-current mr-1" />
                                        {review.rating}
                                    </div>
                                </div>

                                <p className="text-sm italic text-foreground/80 leading-relaxed line-clamp-4 mb-4">
                                    "{review.content}"
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id={`visible-${review.id}`}
                                            checked={review.isVisible}
                                            onCheckedChange={() => toggleVisibility(review)}
                                            disabled={loading === review.id}
                                        />
                                        <Label htmlFor={`visible-${review.id}`} className="text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5">
                                            {review.isVisible ? (
                                                <>
                                                    <Eye className="w-3 h-3 text-green-500" /> Show
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOff className="w-3 h-3 text-muted-foreground" /> Hide
                                                </>
                                            )}
                                        </Label>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => onDelete(review.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {loading === review.id && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
