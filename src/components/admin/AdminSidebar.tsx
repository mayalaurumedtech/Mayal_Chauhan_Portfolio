import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  User,
  FolderKanban,
  FileText,
  MessageSquare,
  Star,
  Mail,
  ChevronDown,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Menu,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  Share2,
  Settings
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export type AdminSection = 'dashboard' | 'users' | 'projects' | 'blogs' | 'reviews' | 'starred-messages' | 'all-messages' | 'biography' | 'skills' | 'experience' | 'education' | 'socials' | 'settings';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  messageCounts: {
    total: number;
    starred: number;
    unread: number;
  };
}

const SidebarContent = ({
  activeSection,
  onSectionChange,
  messageCounts,
  user,
  logout,
  onClose
}: AdminSidebarProps & { user: any; logout: () => Promise<void>; onClose?: () => void }) => {
  const [messagesExpanded, setMessagesExpanded] = useState(
    activeSection === 'starred-messages' || activeSection === 'all-messages'
  );

  const menuItems = [
    { id: 'dashboard' as AdminSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as AdminSection, label: 'Login User', icon: User },
    { id: 'projects' as AdminSection, label: 'Projects', icon: FolderKanban },
    { id: 'blogs' as AdminSection, label: 'Blogs', icon: FileText },
    { id: 'reviews' as AdminSection, label: 'Reviews', icon: Star },
    { id: 'biography' as AdminSection, label: 'Biography', icon: BookOpen },
    { id: 'skills' as AdminSection, label: 'Skills', icon: Award },
    { id: 'experience' as AdminSection, label: 'Experience', icon: Briefcase },
    { id: 'education' as AdminSection, label: 'Education', icon: GraduationCap },
    { id: 'socials' as AdminSection, label: 'Social Links', icon: Share2 },
    { id: 'settings' as AdminSection, label: 'Global Settings', icon: Settings },
  ];

  const messageSubItems = [
    { id: 'starred-messages' as AdminSection, label: 'Starred Messages', icon: Star, count: messageCounts.starred },
    { id: 'all-messages' as AdminSection, label: 'All Messages', icon: Mail, count: messageCounts.total },
  ];

  const handleSectionClick = (section: AdminSection) => {
    onSectionChange(section);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onClose) onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* User Profile Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
            <AvatarFallback className="gradient-primary text-primary-foreground">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.displayName || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSectionClick(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeSection === item.id
                ? "gradient-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}

        {/* Messages with submenu */}
        <div>
          <button
            onClick={() => setMessagesExpanded(!messagesExpanded)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              (activeSection === 'starred-messages' || activeSection === 'all-messages')
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="flex-1 text-left">Messages</span>
            {messageCounts.unread > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {messageCounts.unread}
              </span>
            )}
            {messagesExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {messagesExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {messageSubItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    activeSection === item.id
                      ? "gradient-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export const AdminSidebar = ({ activeSection, onSectionChange, messageCounts }: AdminSidebarProps) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent
              activeSection={activeSection}
              onSectionChange={onSectionChange}
              messageCounts={messageCounts}
              user={user}
              logout={logout}
              onClose={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen flex-col border-r border-border shrink-0 sticky top-0 h-screen">
        <SidebarContent
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          messageCounts={messageCounts}
          user={user}
          logout={logout}
        />
      </aside>
    </>
  );
};
