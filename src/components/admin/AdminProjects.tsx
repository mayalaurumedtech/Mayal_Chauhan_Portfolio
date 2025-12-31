import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest } from '@/lib/firestore-rest';
import { Trash2, Plus, Edit, Save, X, Eye, EyeOff, ChevronLeft, Github } from "lucide-react";
import { z } from 'zod';
import { cn } from '@/lib/utils';

const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  description: z.string().trim().min(1, "Description is required").max(500),
  image: z.string().url("Must be a valid URL"),
  tags: z.string().min(1, "At least one tag is required"),
  category: z.string().min(1, "Category is required"),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  liveUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isPublic: z.boolean(),
  isFeatured: z.boolean().optional()
});

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  category: string;
  githubUrl?: string;
  liveUrl?: string;
  isPublic: boolean;
  isFeatured?: boolean;
}

interface AdminProjectsProps {
  projects: Project[];
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

export const AdminProjects = ({ projects, onRefresh, onDelete }: AdminProjectsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'add' | 'edit'>('grid');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    image: "",
    tags: "",
    category: "",
    githubUrl: "",
    liveUrl: "",
    isPublic: true,
    isFeatured: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      const validatedData = projectSchema.parse(projectForm);
      const token = await user.getIdToken();

      if (viewMode === 'edit' && editingProjectId) {
        // Update Project
        const finalData = {
          ...validatedData,
          tags: validatedData.tags.split(",").map(tag => tag.trim()),
          isFeatured: !!projectForm.isFeatured
        };
        await firestoreRest.patch("projects", editingProjectId, finalData, token);
        toast({ title: "Success", description: "Project updated successfully" });
      } else {
        // Create Project
        await firestoreRest.create("projects", {
          ...validatedData,
          tags: validatedData.tags.split(",").map(tag => tag.trim()),
          githubUrl: validatedData.githubUrl || "",
          liveUrl: validatedData.liveUrl || "",
          isFeatured: !!projectForm.isFeatured,
          createdAt: new Date().toISOString()
        }, token);
        toast({ title: "Success", description: "Project added successfully" });
      }

      resetForm();
      setViewMode('grid');
      onRefresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: `Failed to ${viewMode === 'edit' ? 'update' : 'add'} project`, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      description: project.description,
      image: project.image,
      tags: project.tags.join(", "),
      category: project.category,
      githubUrl: project.githubUrl || "",
      liveUrl: project.liveUrl || "",
      isPublic: project.isPublic,
      isFeatured: !!project.isFeatured
    });
    setViewMode('edit');
  };

  const resetForm = () => {
    setProjectForm({
      title: "", description: "", image: "", tags: "",
      category: "", githubUrl: "", liveUrl: "", isPublic: true, isFeatured: false
    });
    setEditingProjectId(null);
  };

  if (viewMode !== 'grid') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setViewMode('grid'); resetForm(); }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{viewMode === 'edit' ? 'Edit Project' : 'Add New Project'}</h2>
            <p className="text-muted-foreground">{viewMode === 'edit' ? 'Update your project details' : 'Fill in the details to showcase your work'}</p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input id="category" value={projectForm.category}
                  onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                  placeholder="web, mobile, data" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL *</Label>
              <Input id="image" type="url" value={projectForm.image}
                onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated) *</Label>
              <Input id="tags" value={projectForm.tags}
                onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                placeholder="React, TypeScript, Node.js" required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input id="githubUrl" type="url" value={projectForm.githubUrl}
                  onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="liveUrl">Live URL</Label>
                <Input id="liveUrl" type="url" value={projectForm.liveUrl}
                  onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg w-fit">
                <Switch id="isPublic" checked={projectForm.isPublic}
                  onCheckedChange={(checked) => setProjectForm({ ...projectForm, isPublic: checked })} />
                <Label htmlFor="isPublic" className="cursor-pointer font-medium">Enable Public Visibility</Label>
              </div>
              <div className="flex items-center space-x-2 bg-amber-500/10 p-3 rounded-lg w-fit border border-amber-500/20">
                <Switch id="isFeatured" checked={projectForm.isFeatured}
                  onCheckedChange={(checked) => setProjectForm({ ...projectForm, isFeatured: checked })} />
                <Label htmlFor="isFeatured" className="cursor-pointer font-medium text-amber-600">Show on Homepage</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" className="gradient-primary border-0 text-white min-w-[120px]" disabled={loading}>
                {loading ? (viewMode === 'edit' ? "Saving..." : "Creating...") : (viewMode === 'edit' ? "Save Changes" : "Create Project")}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setViewMode('grid'); resetForm(); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Manage and showcase your best work</p>
        </div>
        <Button onClick={() => setViewMode('add')} className="gradient-primary border-0 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add More
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full bg-muted/20 border-2 border-dashed rounded-xl py-12 text-center">
            <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No projects found. Add your first one!</p>
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="group overflow-hidden flex flex-col h-auto animate-slide-up bg-card">
              <div className="relative h-48 overflow-hidden">
                <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider", project.isPublic ? "bg-green-500/90 text-white" : "bg-yellow-500/90 text-white")}>
                    {project.isPublic ? "Public" : "Private"}
                  </div>
                  {project.isFeatured && (
                    <div className="bg-amber-500/90 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      Featured
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" className="h-9 w-9 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => startEdit(project)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/40" onClick={() => onDelete(project.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">{project.category}</span>
                  <div className="flex gap-2">
                    {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer"><Github className="w-4 h-4 text-muted-foreground hover:text-foreground" /></a>}
                    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer"><Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" /></a>}
                  </div>
                </div>
                <h4 className="font-bold text-lg mb-2 line-clamp-1">{project.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{project.description}</p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {project.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded text-secondary-foreground">{tag}</span>
                  ))}
                  {project.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{project.tags.length - 3}</span>}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
