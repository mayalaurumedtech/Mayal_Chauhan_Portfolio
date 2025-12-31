import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest } from '@/lib/firestore-rest';
import { Trash2, Plus, Loader2, ChevronLeft, Edit, Save } from "lucide-react";
import { Skill } from '@/hooks/useSkills';

interface AdminSkillsProps {
    skills: Skill[];
    onRefresh: () => void;
    onDelete: (id: string) => void;
}

export const AdminSkills = ({ skills, onRefresh, onDelete }: AdminSkillsProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'add' | 'edit'>('grid');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        iconName: "",
        color: "from-blue-500 to-cyan-500"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);
            const token = await user.getIdToken();

            if (viewMode === 'edit' && editingId) {
                await firestoreRest.patch("skills", editingId, formData, token);
                toast({ title: "Success", description: "Skill updated successfully" });
            } else {
                await firestoreRest.create("skills", {
                    ...formData,
                    createdAt: new Date().toISOString()
                }, token);
                toast({ title: "Success", description: "Skill added successfully" });
            }

            resetForm();
            setViewMode('grid');
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${viewMode === 'edit' ? 'update' : 'add'} skill`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (skill: Skill) => {
        setEditingId(skill.id);
        setFormData({
            name: skill.name,
            iconName: skill.iconName,
            color: skill.color
        });
        setViewMode('edit');
    };

    const resetForm = () => {
        setFormData({ name: "", iconName: "", color: "from-blue-500 to-cyan-500" });
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
                        <h2 className="text-2xl font-bold">{viewMode === 'edit' ? 'Edit Skill' : 'Add New Skill'}</h2>
                        <p className="text-muted-foreground">{viewMode === 'edit' ? 'Update skill details' : 'Add a new technical skill'}</p>
                    </div>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Skill Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="React" required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iconName">Icon Name (SiIcons)</Label>
                                <Input
                                    id="iconName"
                                    value={formData.iconName}
                                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                                    placeholder="SiReact" required
                                />
                                <p className="text-[10px] text-muted-foreground">Name from react-icons/si (e.g., SiReact, SiPython)</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Gradient Color Classes</Label>
                            <Input
                                id="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                placeholder="from-blue-500 to-cyan-500" required
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button type="submit" disabled={loading} className="gradient-primary border-0 text-white min-w-[120px]">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (viewMode === 'edit' ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                                {viewMode === 'edit' ? "Save Changes" : "Add Skill"}
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
                    <h2 className="text-2xl font-bold">Skills</h2>
                    <p className="text-muted-foreground">Manage your technical skills</p>
                </div>
                <Button onClick={() => setViewMode('add')} className="gradient-primary border-0 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add More
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {skills.map((skill) => {
                    return (
                        <Card key={skill.id} className="p-4 relative group flex flex-col items-center text-center gap-2 hover:shadow-md transition-all">
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded p-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" onClick={() => startEdit(skill)}>
                                    <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onDelete(skill.id)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${skill.color} flex items-center justify-center`}>
                                <span className="text-white text-xs font-mono">{skill.iconName.replace('Si', '').substring(0, 2)}</span>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{skill.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-full">{skill.iconName}</p>
                            </div>
                        </Card>
                    )
                })}
                {skills.length === 0 && (
                    <div className="col-span-full bg-muted/20 border-2 border-dashed rounded-xl py-12 text-center text-muted-foreground">
                        No skills found. Add your first skill!
                    </div>
                )}
            </div>
        </div>
    );
};
