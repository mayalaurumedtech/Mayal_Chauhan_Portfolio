import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest } from '@/lib/firestore-rest';
import { Trash2, Plus, Loader2, ChevronLeft, Edit, Save, ExternalLink } from "lucide-react";
import { SocialMedia } from '@/types/social';
import * as SiIcons from "react-icons/si";
import * as LucideIcons from "lucide-react";

interface AdminSocialsProps {
    socials: SocialMedia[];
    onRefresh: () => void;
    onDelete: (id: string) => void;
}

export const AdminSocials = ({ socials, onRefresh, onDelete }: AdminSocialsProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'add' | 'edit'>('grid');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        platform: "",
        url: "",
        iconName: "",
        order: 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);
            const token = await user.getIdToken();

            if (viewMode === 'edit' && editingId) {
                await firestoreRest.patch("social_media", editingId, formData, token);
                toast({ title: "Success", description: "Social link updated successfully" });
            } else {
                await firestoreRest.create("social_media", {
                    ...formData,
                    createdAt: new Date().toISOString()
                }, token);
                toast({ title: "Success", description: "Social link added successfully" });
            }

            resetForm();
            setViewMode('grid');
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${viewMode === 'edit' ? 'update' : 'add'} social link`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (social: SocialMedia) => {
        setEditingId(social.id);
        setFormData({
            platform: social.platform,
            url: social.url,
            iconName: social.iconName,
            order: social.order
        });
        setViewMode('edit');
    };

    const resetForm = () => {
        setFormData({ platform: "", url: "", iconName: "", order: socials.length });
        setEditingId(null);
    };

    const renderIcon = (iconName: string) => {
        const SiIcon = (SiIcons as any)[iconName];
        if (SiIcon) return <SiIcon className="w-5 h-5" />;

        const LucideIcon = (LucideIcons as any)[iconName];
        if (LucideIcon) return <LucideIcon className="w-5 h-5" />;

        return <ExternalLink className="w-5 h-5" />;
    };

    if (viewMode !== 'grid') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => { setViewMode('grid'); resetForm(); }}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold">{viewMode === 'edit' ? 'Edit Social Link' : 'Add New Social Link'}</h2>
                        <p className="text-muted-foreground">{viewMode === 'edit' ? 'Update social media details' : 'Add a new social media profile'}</p>
                    </div>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="platform">Platform Name</Label>
                                <Input
                                    id="platform"
                                    value={formData.platform}
                                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                    placeholder="GitHub" required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iconName">Icon Name (SiIcons or Lucide)</Label>
                                <Input
                                    id="iconName"
                                    value={formData.iconName}
                                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                                    placeholder="SiGithub or Github" required
                                />
                                <p className="text-[10px] text-muted-foreground">Supported: react-icons/si (e.g. SiGithub) or Lucide (e.g. Github)</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url">Profile URL</Label>
                            <Input
                                id="url"
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://github.com/yourusername" required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="order">Display Order</Label>
                            <Input
                                id="order"
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button type="submit" disabled={loading} className="gradient-primary border-0 text-white min-w-[120px]">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (viewMode === 'edit' ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                                {viewMode === 'edit' ? "Save Changes" : "Add Link"}
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
                    <h2 className="text-2xl font-bold">Social Media</h2>
                    <p className="text-muted-foreground">Manage your social media links for Hero and Contact sections</p>
                </div>
                <Button onClick={() => { resetForm(); setViewMode('add'); }} className="gradient-primary border-0 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Link
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(socials || []).sort((a, b) => a.order - b.order).map((social) => (
                    <Card key={social.id} className="p-4 relative group flex items-center gap-4 hover:shadow-md transition-all">
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(social)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(social.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            {renderIcon(social.iconName)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate">{social.platform}</h4>
                            <p className="text-xs text-muted-foreground truncate">{social.url}</p>
                            <div className="mt-1">
                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase font-bold">Order: {social.order}</span>
                            </div>
                        </div>
                    </Card>
                ))}
                {(socials || []).length === 0 && (
                    <div className="col-span-full bg-muted/20 border-2 border-dashed rounded-xl py-12 text-center text-muted-foreground">
                        No social links found. Add your first link!
                    </div>
                )}
            </div>
        </div>
    );
};
