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
import { Experience } from '@/hooks/useExperiences';

interface AdminExperiencesProps {
    experiences: Experience[];
    onRefresh: () => void;
    onDelete: (id: string) => void;
}

export const AdminExperiences = ({ experiences, onRefresh, onDelete }: AdminExperiencesProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'add' | 'edit'>('grid');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        role: "",
        company: "",
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
                await firestoreRest.patch("experiences", editingId, formData, token);
                toast({ title: "Success", description: "Experience updated successfully" });
            } else {
                await firestoreRest.create("experiences", {
                    ...formData,
                    createdAt: new Date().toISOString()
                }, token);
                toast({ title: "Success", description: "Experience added successfully" });
            }

            resetForm();
            setViewMode('grid');
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${viewMode === 'edit' ? 'update' : 'add'} experience`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (exp: Experience) => {
        setEditingId(exp.id);
        setFormData({
            role: exp.role,
            company: exp.company,
            period: exp.period,
            description: exp.description
        });
        setViewMode('edit');
    };

    const resetForm = () => {
        setFormData({ role: "", company: "", period: "", description: "" });
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
                        <h2 className="text-2xl font-bold">{viewMode === 'edit' ? 'Edit Experience' : 'Add New Experience'}</h2>
                        <p className="text-muted-foreground">{viewMode === 'edit' ? 'Update job details' : 'Add a new work experience'}</p>
                    </div>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role / Job Title</Label>
                                <Input
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="Frontend Developer" required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="Acme Corp" required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="period">Period</Label>
                            <Input
                                id="period"
                                value={formData.period}
                                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                placeholder="Jan 2023 - Present" required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of responsibilities..." rows={4} required
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button type="submit" disabled={loading} className="gradient-primary border-0 text-white min-w-[120px]">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (viewMode === 'edit' ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                                {viewMode === 'edit' ? "Save Changes" : "Add Experience"}
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
                    <h2 className="text-2xl font-bold">Experience</h2>
                    <p className="text-muted-foreground">Manage your work history</p>
                </div>
                <Button onClick={() => setViewMode('add')} className="gradient-primary border-0 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add More
                </Button>
            </div>

            <div className="space-y-4">
                {experiences.map((exp) => (
                    <Card key={exp.id} className="p-6 relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="icon" onClick={() => startEdit(exp)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(exp.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="mb-2">
                            <h3 className="text-lg font-bold">{exp.role}</h3>
                            <p className="text-primary font-medium">{exp.company}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 font-medium bg-muted w-fit px-2 py-1 rounded">{exp.period}</p>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{exp.description}</p>
                    </Card>
                ))}
                {experiences.length === 0 && (
                    <div className="bg-muted/20 border-2 border-dashed rounded-xl py-12 text-center text-muted-foreground">
                        No experience entries found.
                    </div>
                )}
            </div>
        </div>
    );
};
