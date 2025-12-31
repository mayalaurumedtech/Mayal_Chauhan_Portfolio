import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest } from '@/lib/firestore-rest';
import { Trash2, Plus, Edit, Loader2, ChevronLeft, Save } from "lucide-react";
import { Biography } from '@/hooks/useBiography';

interface AdminBiographyProps {
    biography: Biography[];
    onRefresh: () => void;
    onDelete: (id: string) => void;
}

export const AdminBiography = ({ biography, onRefresh, onDelete }: AdminBiographyProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'add' | 'edit'>('grid');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [order, setOrder] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !content.trim()) return;

        try {
            setLoading(true);
            const token = await user.getIdToken();

            if (viewMode === 'edit' && editingId) {
                await firestoreRest.patch("biography", editingId, { content, order }, token);
                toast({ title: "Success", description: "Biography updated successfully" });
            } else {
                // Auto-increment order if adding
                const nextOrder = biography.length;
                await firestoreRest.create("biography", {
                    content,
                    order: nextOrder,
                    createdAt: new Date().toISOString()
                }, token);
                toast({ title: "Success", description: "Biography section added" });
            }

            resetForm();
            setViewMode('grid');
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${viewMode === 'edit' ? 'update' : 'add'} biography`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (bio: Biography) => {
        setEditingId(bio.id);
        setContent(bio.content);
        setOrder(bio.order);
        setViewMode('edit');
    };

    const resetForm = () => {
        setContent("");
        setEditingId(null);
        setOrder(0);
    };

    if (viewMode !== 'grid') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => { setViewMode('grid'); resetForm(); }}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold">{viewMode === 'edit' ? 'Edit Biography Section' : 'Add New Section'}</h2>
                        <p className="text-muted-foreground">{viewMode === 'edit' ? 'Update content' : 'Add a new paragraph to your biography'}</p>
                    </div>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter biography content..."
                                rows={6}
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-4 border-t">
                            <Button type="submit" disabled={loading} className="gradient-primary border-0 text-white min-w-[120px]">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (viewMode === 'edit' ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                                {viewMode === 'edit' ? "Save Changes" : "Add Section"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setViewMode('grid'); resetForm(); }}>Cancel</Button>
                        </div>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Biography</h2>
                    <p className="text-muted-foreground">Manage your biography sections</p>
                </div>
                <Button onClick={() => setViewMode('add')} className="gradient-primary border-0 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add More
                </Button>
            </div>

            <div className="space-y-4">
                {biography.length === 0 ? (
                    <div className="bg-muted/20 border-2 border-dashed rounded-xl py-12 text-center">
                        <p className="text-muted-foreground font-medium">No biography sections found.</p>
                    </div>
                ) : (
                    biography.map((item) => (
                        <Card key={item.id} className="p-6 relative group hover:shadow-md transition-all">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="outline" size="icon" onClick={() => startEdit(item)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-muted-foreground leading-relaxed pr-12 whitespace-pre-wrap">{item.content}</p>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
