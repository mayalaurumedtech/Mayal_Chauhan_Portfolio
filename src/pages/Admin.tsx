import { useState, useEffect } from 'react';
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { AdminSidebar, AdminSection } from '@/components/admin/AdminSidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminProjects } from '@/components/admin/AdminProjects';
import { AdminBlogs } from '@/components/admin/AdminBlogs';
import { AdminMessages } from '@/components/admin/AdminMessages';
import { AdminBiography } from '@/components/admin/AdminBiography';
import { AdminSkills } from '@/components/admin/AdminSkills';
import { AdminExperiences } from '@/components/admin/AdminExperiences';
import { AdminEducations } from '@/components/admin/AdminEducations';
import { AdminReviews } from '@/components/admin/AdminReviews';
import { AdminSocials } from '@/components/admin/AdminSocials';
import { AdminProfileSettings } from '@/components/admin/AdminProfileSettings';
import { BlogPost } from '@/types/blog';
import { Testimonial } from '@/types/testimonial';
import { Skill } from '@/hooks/useSkills';
import { Experience } from '@/hooks/useExperiences';
import { Education } from '@/hooks/useEducations';
import { Biography } from '@/hooks/useBiography';
import { SocialMedia } from '@/types/social';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: string;
  isStarred?: boolean;
  isRead?: boolean;
}

const Admin = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [biography, setBiography] = useState<Biography[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [socials, setSocials] = useState<SocialMedia[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'project' | 'message' | 'blog' | 'biography' | 'skill' | 'experience' | 'education' | 'testimonial' | 'social' } | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchMessages();
    fetchBlogPosts();
    fetchBiography();
    fetchSkills();
    fetchExperiences();
    fetchEducations();
    fetchTestimonials();
    fetchSocials();
  }, []);

  const fetchProjects = async () => {
    try {
      const docs = await firestoreRest.list("projects");
      const projectsData = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        title: extractVal(doc.fields.title),
        description: extractVal(doc.fields.description),
        image: extractVal(doc.fields.image),
        tags: extractVal(doc.fields.tags) || [],
        category: extractVal(doc.fields.category),
        githubUrl: extractVal(doc.fields.githubUrl),
        liveUrl: extractVal(doc.fields.liveUrl),
        isPublic: extractVal(doc.fields.isPublic),
        isFeatured: extractVal(doc.fields.isFeatured),
      })) as Project[];
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const docs = await firestoreRest.list("contacts");
      const messagesData = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        name: extractVal(doc.fields.name),
        email: extractVal(doc.fields.email),
        subject: extractVal(doc.fields.subject),
        message: extractVal(doc.fields.message),
        status: extractVal(doc.fields.status),
        isStarred: extractVal(doc.fields.isStarred) || false,
        isRead: extractVal(doc.fields.isRead) || false,
      })) as ContactMessage[];
      setMessages(messagesData);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const docs = await firestoreRest.query("blog_posts", {
        orderBy: [{ field: "date", direction: "DESCENDING" }]
      });
      const postsData = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        title: extractVal(doc.fields.title),
        slug: extractVal(doc.fields.slug),
        excerpt: extractVal(doc.fields.excerpt),
        content: extractVal(doc.fields.content),
        category: extractVal(doc.fields.category),
        image: extractVal(doc.fields.image),
        readTime: extractVal(doc.fields.readTime),
        isPublic: extractVal(doc.fields.isPublic),
        isFeatured: extractVal(doc.fields.isFeatured),
        date: extractVal(doc.fields.date),
        views: extractVal(doc.fields.views) || 0,
        likes: extractVal(doc.fields.likes) || 0,
        shares: extractVal(doc.fields.shares) || 0,
        commentCount: extractVal(doc.fields.commentCount) || 0,
      })) as BlogPost[];
      setBlogPosts(postsData);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    }
  };

  const fetchBiography = async () => {
    try {
      const docs = await firestoreRest.list("biography", { orderBy: "order asc" });
      const data = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        content: extractVal(doc.fields.content),
        order: extractVal(doc.fields.order) || 0,
      })) as Biography[];
      setBiography(data);
    } catch (error) {
      console.error("Error fetching biography:", error);
    }
  };

  const fetchSkills = async () => {
    try {
      const docs = await firestoreRest.list("skills", { orderBy: "createdAt desc" });
      const data = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        name: extractVal(doc.fields.name),
        iconName: extractVal(doc.fields.iconName),
        color: extractVal(doc.fields.color),
      })) as Skill[];
      setSkills(data);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const fetchExperiences = async () => {
    try {
      const docs = await firestoreRest.list("experiences", { orderBy: "period desc" });
      const data = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        role: extractVal(doc.fields.role),
        company: extractVal(doc.fields.company),
        period: extractVal(doc.fields.period),
        description: extractVal(doc.fields.description),
        type: 'experience',
      })) as Experience[];
      setExperiences(data);
    } catch (error) {
      console.error("Error fetching experiences:", error);
    }
  };

  const fetchEducations = async () => {
    try {
      const docs = await firestoreRest.list("educations", { orderBy: "period desc" });
      const data = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        degree: extractVal(doc.fields.degree),
        institution: extractVal(doc.fields.institution),
        period: extractVal(doc.fields.period),
        description: extractVal(doc.fields.description),
        type: 'education',
      })) as Education[];
      setEducations(data);
    } catch (error) {
      console.error("Error fetching educations:", error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const docs = await firestoreRest.list("testimonials", { orderBy: "createdAt desc" });
      const data = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        userId: extractVal(doc.fields.userId),
        userDisplayName: extractVal(doc.fields.userDisplayName),
        userPhotoURL: extractVal(doc.fields.userPhotoURL),
        content: extractVal(doc.fields.content),
        rating: extractVal(doc.fields.rating) || 0,
        date: extractVal(doc.fields.date),
        isVisible: extractVal(doc.fields.isVisible) || false,
        createdAt: extractVal(doc.fields.createdAt),
      })) as Testimonial[];
      setTestimonials(data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    }
  };

  const fetchSocials = async () => {
    try {
      const docs = await firestoreRest.list("social_media", { orderBy: "order asc" });
      const data = docs.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        platform: extractVal(doc.fields.platform),
        url: extractVal(doc.fields.url),
        iconName: extractVal(doc.fields.iconName),
        order: extractVal(doc.fields.order) || 0,
      })) as SocialMedia[];
      setSocials(data);
    } catch (error) {
      console.error("Error fetching socials:", error);
    }
  };

  const confirmDelete = (id: string, type: 'project' | 'message' | 'blog' | 'biography' | 'skill' | 'experience' | 'education' | 'testimonial' | 'social') => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !user) return;

    try {
      const token = await user.getIdToken();

      switch (itemToDelete.type) {
        case 'project':
          await firestoreRest.delete('projects', itemToDelete.id, token);
          setProjects(projects.filter(p => p.id !== itemToDelete.id));
          break;
        case 'message':
          await firestoreRest.delete('contacts', itemToDelete.id, token);
          setMessages(messages.filter(m => m.id !== itemToDelete.id));
          break;
        case 'blog':
          await firestoreRest.delete('blog_posts', itemToDelete.id, token);
          setBlogPosts(blogPosts.filter(p => p.id !== itemToDelete.id));
          break;
        case 'biography':
          await firestoreRest.delete('biography', itemToDelete.id, token);
          setBiography(biography.filter(b => b.id !== itemToDelete.id));
          break;
        case 'skill':
          await firestoreRest.delete('skills', itemToDelete.id, token);
          setSkills(skills.filter(s => s.id !== itemToDelete.id));
          break;
        case 'experience':
          await firestoreRest.delete('experiences', itemToDelete.id, token);
          setExperiences(experiences.filter(e => e.id !== itemToDelete.id));
          break;
        case 'testimonial':
          await firestoreRest.delete('testimonials', itemToDelete.id, token);
          setTestimonials(testimonials.filter(t => t.id !== itemToDelete.id));
          break;
        case 'education':
          await firestoreRest.delete('educations', itemToDelete.id, token);
          setEducations(educations.filter(e => e.id !== itemToDelete.id));
          break;
        case 'social':
          await firestoreRest.delete('social_media', itemToDelete.id, token);
          setSocials(socials.filter(s => s.id !== itemToDelete.id));
          break;
      }

      toast({ title: "Success", description: `${itemToDelete.type} deleted successfully` });
    } catch (error) {
      toast({ title: "Error", description: `Failed to delete ${itemToDelete.type}`, variant: "destructive" });
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleToggleStar = async (id: string, isStarred: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await firestoreRest.patch('contacts', id, { isStarred }, token);
      setMessages(messages.map(m => m.id === id ? { ...m, isStarred } : m));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update message", variant: "destructive" });
    }
  };

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await firestoreRest.patch('contacts', id, { isRead }, token);
      setMessages(messages.map(m => m.id === id ? { ...m, isRead } : m));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update message", variant: "destructive" });
    }
  };

  const messageCounts = {
    total: messages.length,
    starred: messages.filter(m => m.isStarred).length,
    unread: messages.filter(m => !m.isRead).length,
  };

  const stats = {
    totalProjects: projects.length,
    totalBlogs: blogPosts.length,
    publicBlogs: blogPosts.filter(p => p.isPublic).length,
    totalMessages: messages.length,
    starredMessages: messageCounts.starred,
    unreadMessages: messageCounts.unread,
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard stats={stats} onSectionChange={setActiveSection} />;
      case 'users':
        return <AdminUsers />;
      case 'projects':
        return (
          <AdminProjects
            projects={projects}
            onRefresh={fetchProjects}
            onDelete={(id) => confirmDelete(id, 'project')}
          />
        );
      case 'blogs':
        return (
          <AdminBlogs
            blogPosts={blogPosts}
            onRefresh={fetchBlogPosts}
            onDelete={(id) => confirmDelete(id, 'blog')}
          />
        );
      case 'reviews':
        return (
          <AdminReviews
            testimonials={testimonials}
            onRefresh={fetchTestimonials}
            onDelete={(id) => confirmDelete(id, 'testimonial')}
          />
        );
      case 'biography':
        return (
          <AdminBiography
            biography={biography}
            onRefresh={fetchBiography}
            onDelete={(id) => confirmDelete(id, 'biography')}
          />
        );
      case 'skills':
        return (
          <AdminSkills
            skills={skills}
            onRefresh={fetchSkills}
            onDelete={(id) => confirmDelete(id, 'skill')}
          />
        );
      case 'experience':
        return (
          <AdminExperiences
            experiences={experiences}
            onRefresh={fetchExperiences}
            onDelete={(id) => confirmDelete(id, 'experience')}
          />
        );
      case 'education':
        return (
          <AdminEducations
            educations={educations}
            onRefresh={fetchEducations}
            onDelete={(id) => confirmDelete(id, 'education')}
          />
        );
      case 'socials':
        return (
          <AdminSocials
            socials={socials}
            onRefresh={fetchSocials}
            onDelete={(id) => confirmDelete(id, 'social')}
          />
        );
      case 'settings':
        return <AdminProfileSettings />;
      case 'starred-messages':
        return (
          <AdminMessages
            messages={messages}
            showStarredOnly
            onDelete={(id) => confirmDelete(id, 'message')}
            onToggleStar={handleToggleStar}
            onMarkRead={handleMarkRead}
          />
        );
      case 'all-messages':
        return (
          <AdminMessages
            messages={messages}
            onDelete={(id) => confirmDelete(id, 'message')}
            onToggleStar={handleToggleStar}
            onMarkRead={handleMarkRead}
          />
        );
      default:
        return <AdminDashboard stats={stats} />;
    }
  };

  return (
    <>
      <SEO
        title="Admin Dashboard"
        description="Manage your portfolio projects, blogs, and messages"
        keywords="admin, dashboard, management"
      />
      <div className="min-h-screen flex flex-col lg:flex-row bg-background">
        {/* Sidebar */}
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          messageCounts={messageCounts}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-16 lg:pt-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this {itemToDelete?.type}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default Admin;
