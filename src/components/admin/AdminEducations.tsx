import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest } from '@/lib/firestore-rest';
import { Trash2, Plus, Loader2, ChevronLeft, Edit, Save } from "lucide-react";
import { Education } from '@/hooks/useEducations';

interface AdminEducationsProps {
    educations: Education[];
    onRefresh: () => void;
    onDelete: (id: string) => void;
}

export const AdminEducations = ({ educations, onRefresh, onDelete }: AdminEducationsProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'add' | 'edit'>('grid');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        degree: "",
        institution: "",
        period: "",
        description: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);
            const token = await user.getIdToken();

            if (viewMode === 'edit' && editingId) {
                await firestoreRest.patch("educations", editingId, formData, token);
                toast({ title: "Success", description: "Education updated successfully" });
            } else {
                await firestoreRest.create("educations", {
                    ...formData,
                    createdAt: new Date().toISOString()
                }, token);
                toast({ title: "Success", description: "Education added successfully" });
            }

            resetForm();
            setViewMode('grid');
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${viewMode === 'edit' ? 'update' : 'add'} education`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (edu: Education) => {
        setEditingId(edu.id);
        setFormData({
            degree: edu.degree,
            institution: edu.institution,
            period: edu.period,
            description: edu.description
        });
        setViewMode('edit');
    };

    const resetForm = () => {
        setFormData({ degree: "", institution: "", period: "", description: "" });
        setEditingId(null);
    };

    if (viewMode !== 'grid') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => { setViewMode('grid'); resetForm(); }}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold">{viewMode === 'edit' ? 'Edit Education' : 'Add New Education'}</h2>
                        <p className="text-muted-foreground">{viewMode === 'edit' ? 'Update details' : 'Add a new educational qualification'}</p>
                    </div>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="degree">Degree / Certificate</Label>
                                <Input
                                    id="degree"
                                    value={formData.degree}
                                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                    placeholder="Bachelor of Science" required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="institution">Institution / University</Label>
                                <Input
                                    id="institution"
                                    value={formData.institution}
                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                    placeholder="Tech University" required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="period">Period</Label>
                            <Input
                                id="period"
                                value={formData.period}
                                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                placeholder="2018 - 2022" required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Details about fields of study..." rows={4} required
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button type="submit" disabled={loading} className="gradient-primary border-0 text-white min-w-[120px]">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (viewMode === 'edit' ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                                {viewMode === 'edit' ? "Save Changes" : "Add Education"}
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
                    <h2 className="text-2xl font-bold">Education</h2>
                    <p className="text-muted-foreground">Manage your educational background</p>
                </div>
                <Button onClick={() => setViewMode('add')} className="gradient-primary border-0 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add More
                </Button>
            </div>

            <div className="space-y-4">
                {educations.map((edu) => (
                    <Card key={edu.id} className="p-6 relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="icon" onClick={() => startEdit(edu)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(edu.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="mb-2">
                            <h3 className="text-lg font-bold">{edu.degree}</h3>
                            <p className="text-primary font-medium">{edu.institution}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 font-medium bg-muted w-fit px-2 py-1 rounded">{edu.period}</p>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{edu.description}</p>
                    </Card>
                ))}
                {educations.length === 0 && (
                    <div className="bg-muted/20 border-2 border-dashed rounded-xl py-12 text-center text-muted-foreground">
                        No education entries found.
                    </div>
                )}
            </div>
        </div>
    );
};
