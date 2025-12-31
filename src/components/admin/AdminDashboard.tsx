import { Card } from "@/components/ui/card";
import { FolderKanban, FileText, MessageSquare, Star, Mail, Database, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreRest, extractVal } from "@/lib/firestore-rest";
import { useState, useEffect, useMemo } from "react";
import { AdminSection } from "./AdminSidebar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  Clock,
  ChevronDown,
  MousePointer2,
  Activity
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  stats: {
    totalProjects: number;
    totalBlogs: number;
    publicBlogs: number;
    totalMessages: number;
    starredMessages: number;
    unreadMessages: number;
  };
  onSectionChange?: (section: AdminSection) => void;
}

export const AdminDashboard = ({ stats, onSectionChange }: AdminDashboardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [visitorStats, setVisitorStats] = useState({
    totalVisits: 0,
    guestVisits: 0,
    userVisits: 0,
    totalUsers: 0,
    dailyVisits: {} as Record<string, number>,
    dailyGuestVisits: {} as Record<string, number>,
    dailyUserVisits: {} as Record<string, number>
  });
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const fetchExtraStats = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        // Fetch visitor stats
        try {
          const stats = await firestoreRest.get('stats', 'visitors', token);
          if (stats && stats.fields) {
            setVisitorStats(prev => ({
              ...prev,
              totalVisits: Number(extractVal(stats.fields.totalVisits)) || 0,
              guestVisits: Number(extractVal(stats.fields.guestVisits)) || 0,
              userVisits: Number(extractVal(stats.fields.userVisits)) || 0,
              dailyVisits: extractVal(stats.fields.dailyVisits) || {},
              dailyGuestVisits: extractVal(stats.fields.dailyGuestVisits) || {},
              dailyUserVisits: extractVal(stats.fields.dailyUserVisits) || {},
            }));
          }
        } catch (e) { }

        // Fetch total users count
        try {
          const users = await firestoreRest.list('users', {}, token);
          setVisitorStats(prev => ({ ...prev, totalUsers: users.length }));
        } catch (e) { }
      } catch (error) {
        console.error("Error fetching dashboard extra stats:", error);
      }
    };
    fetchExtraStats();
  }, [user]);

  const seedData = async () => {
    if (!user) return;
    if (!confirm("This will add default skills, biography, experience, and education data to your database. Continue?")) return;

    setSeeding(true);
    try {
      const token = await user.getIdToken();

      // 1. Skills
      const skills = [
        { name: "React", iconName: "SiReact", color: "from-cyan-400 to-blue-500" },
        { name: "Redux", iconName: "SiRedux", color: "from-purple-500 to-violet-600" },
        { name: "TypeScript", iconName: "SiTypescript", color: "from-blue-500 to-blue-700" },
        { name: "JavaScript", iconName: "SiJavascript", color: "from-yellow-400 to-orange-500" },
        { name: "Tailwind CSS", iconName: "SiTailwindcss", color: "from-cyan-400 to-teal-500" },
        { name: "HTML5", iconName: "SiHtml5", color: "from-orange-400 to-red-500" },
        { name: "CSS3", iconName: "SiCss3", color: "from-blue-400 to-indigo-500" },
        { name: "On-page SEO", iconName: "SiGoogle", color: "from-blue-500 to-green-500" },
      ];

      for (const skill of skills) {
        await firestoreRest.create("skills", { ...skill, createdAt: new Date().toISOString() }, token);
      }

      // 2. Biography
      const bios = [
        { content: "I am a dedicated Frontend Developer with over 3 years of experience in crafting high-performance, visually stunning web applications. My journey began in Web Design, giving me a unique perspective on the intersection of aesthetics and functionality.", order: 0 },
        { content: "Currently specializing in the React ecosystem (Redux, TypeScript, Tailwind CSS), I bridge the gap between complex backend requirements and intuitive user experiences. With a background in accounting and a professional focus on On-page SEO, I bring a data-driven and analytical approach to every project I build.", order: 1 }
      ];

      for (const bio of bios) {
        await firestoreRest.create("biography", { ...bio, createdAt: new Date().toISOString() }, token);
      }

      // 3. Experience
      const experience = [
        { role: "Frontend Developer", company: "Edzyme Tech Private Limited", period: "2024 - Present", description: "Leading development of enterprise applications with modern tech stack." },
        { role: "Web Designer", company: "Clients Now Technologies", period: "2022 - 2024", description: "Built and maintained multiple client projects using React and Node.js." }
      ];

      for (const exp of experience) {
        await firestoreRest.create("experiences", { ...exp, createdAt: new Date().toISOString() }, token);
      }

      // 4. Education
      const education = [
        { degree: "Web Designer", institution: "Agile Group Of Company - Ahmedabad", period: "Dec 2020 - Apr 2021", description: "Completed web design certification and training." },
        { degree: "Master of Accounting", institution: "Saurashtra University - Rajkot", period: "2018 - 2020", description: "Specialized in financial accounting and auditing." },
        { degree: "Bachelor of Accounting", institution: "M K Bhavnagar University - Bhavnagar", period: "2016 - 2018", description: "Auditing and Accounting." }
      ];

      for (const edu of education) {
        await firestoreRest.create("educations", { ...edu, createdAt: new Date().toISOString() }, token);
      }

      toast({ title: "Success", description: "Data seeded successfully! Refresh the page." });

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to seed data", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const handleCardClick = (section: AdminSection) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  const chartData = useMemo(() => {
    const dates: string[] = [];
    const now = new Date();
    let daysToShow = 7;

    if (timeRange === 'day') daysToShow = 1;
    if (timeRange === 'week') daysToShow = 7;
    if (timeRange === 'month') daysToShow = 30;
    if (timeRange === 'year') daysToShow = 365;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates.map(date => ({
      date: timeRange === 'year' ? date.substring(5) : date.substring(8), // Show MM-DD or DD
      fullDate: date,
      visits: visitorStats.dailyVisits[date] || 0,
      guests: visitorStats.dailyGuestVisits[date] || 0,
      users: visitorStats.dailyUserVisits[date] || 0
    }));
  }, [visitorStats.dailyVisits, timeRange]);

  const activeVisits = visitorStats.totalVisits;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Analytics Dashboard</h2>
          <p className="text-muted-foreground italic flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" /> Live overview of your digital presence
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary/20 hover:border-primary/40 bg-background/50 backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="capitalize">{timeRange}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 backdrop-blur-xl bg-background/95">
              {(['day', 'week', 'month', 'year'] as const).map(range => (
                <DropdownMenuItem
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn("capitalize cursor-pointer", timeRange === range && "bg-primary/10 font-bold")}
                >
                  {range}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={seedData} disabled={seeding} variant="outline" className="gap-2 border-primary/20 hover:border-primary/50 h-10 px-4 group">
            <Database className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-bold">{seeding ? "Syncing..." : "Sync Setup"}</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-primary/10 bg-gradient-to-br from-background to-primary/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Users</p>
              <h4 className="text-2xl font-black">{visitorStats.totalUsers}</h4>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-primary/10 bg-gradient-to-br from-background to-blue-500/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl shadow-inner">
              <Database className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Global Visits</p>
              <h4 className="text-2xl font-black">{activeVisits}</h4>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-primary/10 bg-gradient-to-br from-background to-amber-500/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl shadow-inner">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Projects</p>
              <h4 className="text-2xl font-black">{stats.totalProjects}</h4>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-primary/10 bg-gradient-to-br from-background to-purple-500/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl shadow-inner">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Public Blogs</p>
              <h4 className="text-2xl font-black">{stats.publicBlogs}</h4>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-primary/10 shadow-xl bg-gradient-to-b from-card to-background relative overflow-hidden h-[450px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Traffic Overview</h3>
                <p className="text-xs text-muted-foreground">Detailed visit analytics filtered by {timeRange}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 rounded-full border border-primary/5 text-[10px] font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>ALL VISITS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>GUESTS</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background/95 backdrop-blur-md border border-primary/10 p-4 rounded-2xl shadow-3xl">
                          <p className="font-bold text-xs mb-3 text-muted-foreground uppercase">{payload[0].payload.fullDate}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-8">
                              <span className="text-xs font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Total</span>
                              <span className="font-black text-primary">{payload[0].value}</span>
                            </div>
                            <div className="flex items-center justify-between gap-8">
                              <span className="text-xs font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Guests</span>
                              <span className="font-black text-blue-500">{payload[0].payload.guests}</span>
                            </div>
                            <div className="flex items-center justify-between gap-8">
                              <span className="text-xs font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Users</span>
                              <span className="font-black text-purple-500">{payload[0].payload.users}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVisits)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-12 opacity-50">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Weekly Growth</span>
              <span className="text-sm font-black text-green-500">+12%</span>
            </div>
            <div className="w-px h-8 bg-muted-foreground/20" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Avg Score</span>
              <span className="text-sm font-black">98.2</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-primary/10 flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="mb-4 p-4 bg-background rounded-2xl shadow-sm border border-border/50 group-hover:scale-105 transition-transform duration-300">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-xl mb-2">Message Center</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              You have <span className="font-bold text-foreground">{stats.unreadMessages}</span> unread messages waiting for your attention.
            </p>
            <Button
              onClick={() => handleCardClick('all-messages')}
              className="gradient-primary text-white border-0 shadow-lg shadow-primary/20 hover:shadow-primary/40 w-full max-w-sm h-12 font-bold"
            >
              Open Inbox
            </Button>
            <div className="mt-6 pt-6 border-t w-full flex items-center justify-around gap-4">
              <div
                className="cursor-pointer hover:bg-muted/50 p-2 rounded-xl transition-colors flex flex-col items-center"
                onClick={() => handleCardClick('starred-messages')}
              >
                <Star className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-[10px] font-bold uppercase">{stats.starredMessages} Starred</span>
              </div>
              <div className="w-px h-6 bg-muted-foreground/10" />
              <div
                className="cursor-pointer hover:bg-muted/50 p-2 rounded-xl transition-colors flex flex-col items-center"
                onClick={() => handleCardClick('all-messages')}
              >
                <Mail className="w-5 h-5 text-red-500 mb-1" />
                <span className="text-[10px] font-bold uppercase">View All</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 border-primary/10 overflow-hidden relative group shadow-lg bg-gradient-to-br from-background to-accent/5">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <Database className="w-24 h-24" />
          </div>
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> Visitor Breakdown
          </h3>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Guest Visitors</span>
              </div>
              <span className="font-bold">{visitorStats.guestVisits}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-1000"
                style={{ width: `${visitorStats.totalVisits > 0 ? (visitorStats.guestVisits / visitorStats.totalVisits) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium">Logged-in Users</span>
              </div>
              <span className="font-bold">{visitorStats.userVisits}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-1000"
                style={{ width: `${visitorStats.totalVisits > 0 ? (visitorStats.userVisits / visitorStats.totalVisits) * 100 : 0}%` }}
              />
            </div>

            <p className="text-[10px] text-muted-foreground italic pt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated session-wise for high precision.
            </p>
          </div>
        </Card>

        <Card
          onClick={() => handleCardClick('projects')}
          className="group relative overflow-hidden p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/10 hover:border-primary/30 bg-gradient-to-br from-background to-blue-500/5"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FolderKanban className="w-32 h-32 rotate-12" />
          </div>
          <div className="flex flex-col space-y-4 relative z-10">
            <div className="p-3 bg-blue-500/10 w-fit rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-foreground">{stats.totalProjects}</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Portfolio Projects</p>
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-primary/5">
              <span className="text-[10px] font-bold text-muted-foreground">ACTIVE WORKSPACE</span>
              <div className="flex items-center text-xs text-blue-600 font-bold group-hover:gap-2 transition-all">
                Manage <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </Card>

        <Card
          onClick={() => handleCardClick('blogs')}
          className="group relative overflow-hidden p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/10 hover:border-primary/30 bg-gradient-to-br from-background to-purple-500/5"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="w-32 h-32 rotate-12" />
          </div>
          <div className="flex flex-col space-y-4 relative z-10">
            <div className="p-3 bg-purple-500/10 w-fit rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-black text-foreground">{stats.totalBlogs}</h3>
                <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold mb-1">{stats.publicBlogs} LIVE</span>
              </div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Articles & Blogs</p>
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-primary/5">
              <span className="text-[10px] font-bold text-muted-foreground">CONTENT CENTER</span>
              <div className="flex items-center text-xs text-purple-600 font-bold group-hover:gap-2 transition-all">
                Manage <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 border-primary/10 bg-gradient-to-r from-primary/5 via-background to-transparent relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="p-6 bg-background rounded-3xl shadow-xl border border-primary/10 group-hover:scale-110 transition-transform duration-500">
              <MousePointer2 className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2 italic">Quick Command Center</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-lg leading-relaxed">
                Need to update your portfolio quickly? Use these shortcuts to add new content without navigating through folders.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  className="gradient-primary text-white shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-bold hover:scale-105 transition-all"
                  onClick={() => handleCardClick('projects')}
                >
                  New Project
                </Button>
                <Button
                  variant="outline"
                  className="h-11 px-6 rounded-xl font-bold border-primary/20 hover:bg-primary/5 transition-all"
                  onClick={() => handleCardClick('blogs')}
                >
                  Post Article
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-primary/10 bg-gradient-to-br from-background to-accent/10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-primary fill-primary/10" />
          </div>
          <h4 className="font-bold text-base mb-1">Feedback System</h4>
          <p className="text-xs text-muted-foreground mb-4">Manage user reviews and testimonials</p>
          <Button
            variant="link"
            className="text-primary font-bold decoration-2"
            onClick={() => handleCardClick('reviews')}
          >
            Manage Reviews <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </Card>
      </div>
    </div>
  );
};
