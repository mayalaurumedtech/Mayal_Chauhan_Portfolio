import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { FestivalDecor } from "@/components/FestivalDecor";
import { Code2, Palette, Rocket, Github, Linkedin, Twitter, Briefcase, Calendar, ArrowRight, Download, Send, Sparkles, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreRest, extractVal } from "@/lib/firestore-rest";
import { useSkills } from "@/hooks/useSkills";
import { useExperiences } from "@/hooks/useExperiences";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { TestimonialSlider } from "@/components/TestimonialSlider";
import * as SiIcons from "react-icons/si";
import * as LucideIcons from "lucide-react";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: dynamicSkills = [], isLoading: skillsLoading } = useSkills();
  const { data: dynamicExperiences = [], isLoading: experienceLoading } = useExperiences();

  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);
  const [latestBlogPosts, setLatestBlogPosts] = useState<any[]>([]);
  const [dynamicSocials, setDynamicSocials] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const fullText = "Frontend Developer & Designer";
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseTime = 2000;

  useEffect(() => {
    const handleTyping = () => {
      const currentText = fullText.substring(0, displayText.length + (isDeleting ? -1 : 1));
      setDisplayText(currentText);

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch Projects - Get projects and sort in frontend
        const projectDocs = await firestoreRest.list('projects', { limit: 50 });

        const allProjects = projectDocs.map((doc: any) => {
          const data = doc.fields;
          return {
            id: doc.name.split('/').pop(),
            title: extractVal(data.title),
            description: extractVal(data.description),
            tags: extractVal(data.tags) || [],
            image: extractVal(data.image),
            category: extractVal(data.category),
            githubUrl: extractVal(data.githubUrl),
            liveUrl: extractVal(data.liveUrl),
            isPublic: extractVal(data.isPublic) !== false, // Default to true if missing
            isFeatured: extractVal(data.isFeatured) === true,
            createdAt: extractVal(data.createdAt) || ''
          };
        });

        // Smart Sort: Featured first, then by createdAt descending
        const sortedProjects = allProjects.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).slice(0, 10); // increased limit for slider

        setFeaturedProjects(sortedProjects);

        // Fetch Blog Posts - Get posts and sort in frontend
        const blogDocs = await firestoreRest.list('blog_posts', { limit: 50 });

        const allPosts = blogDocs.map((doc: any) => {
          const data = doc.fields;
          const dateVal = extractVal(data.date);
          return {
            id: doc.name.split('/').pop(),
            title: extractVal(data.title),
            excerpt: extractVal(data.excerpt),
            date: dateVal ? new Date(dateVal).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) : 'No date',
            slug: extractVal(data.slug),
            isPublic: extractVal(data.isPublic) !== false,
            isFeatured: extractVal(data.isFeatured) === true,
            rawDate: dateVal || ''
          };
        });

        // Smart Sort: Featured first, then by date descending
        const sortedPosts = allPosts.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
        }).slice(0, 10); // increased limit for slider

        setLatestBlogPosts(sortedPosts);

        // Fetch Social Media
        const socialDocs = await firestoreRest.list('social_media', { orderBy: 'order asc' });
        const socials = socialDocs.map((doc: any) => ({
          id: doc.name.split('/').pop(),
          platform: extractVal(doc.fields.platform),
          url: extractVal(doc.fields.url),
          iconName: extractVal(doc.fields.iconName),
        }));
        setDynamicSocials(socials);

        // Fetch Global Settings
        try {
          const settingsDoc = await firestoreRest.get('settings', 'global');
          if (settingsDoc && settingsDoc.fields) {
            setSettings({
              resumeUrl: extractVal(settingsDoc.fields.resumeUrl),
              contactEmail: extractVal(settingsDoc.fields.contactEmail),
              contactPhone: extractVal(settingsDoc.fields.contactPhone),
              contactLocation: extractVal(settingsDoc.fields.contactLocation),
            });
          }
        } catch (e) { }

      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };

    fetchHomeData();
  }, []);

  const socialLinks = [
    { icon: Github, url: "#", label: "GitHub" },
    { icon: Linkedin, url: "#", label: "LinkedIn" },
    { icon: Twitter, url: "#", label: "Twitter" }
  ];

  return (
    <>
      <SEO
        title="Home"
        description="Welcome to my portfolio. Full Stack Developer specializing in React, TypeScript, and modern web technologies."
        keywords="portfolio, web developer, full stack, react, typescript, web development"
      />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          <FestivalDecor />
          <div className="absolute inset-0 gradient-hero -z-10" />
          <div className="absolute inset-0 hero-overlay -z-10" />

          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge className="mb-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-4 py-1" variant="secondary">
                <Sparkles className="w-3 h-3 mr-2 text-blue-300" /> Welcome to My Portfolio
              </Badge>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-accent tracking-tight">
                Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200 drop-shadow-sm">Mayal Chauhan</span>
              </h1>

              <div className="h-20 md:h-24 flex items-center justify-center mb-6">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-medium text-blue-100/90 [text-shadow:_0_2px_10px_rgb(0_0_0_/_20%)]">
                  {displayText}
                  <span className="animate-pulse text-blue-300 ml-1">|</span>
                </h2>
              </div>

              <p className="text-lg md:text-2xl text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                Creating beautiful, functional, and user-friendly digital experiences with modern technologies
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center animate-scale-in mb-12">
                <Link to="/contact">
                  <Button size="lg" className="gradient-primary border-0 text-white shadow-glow hover:shadow-lg transition-smooth text-base md:text-lg w-full sm:w-auto px-8 h-14 font-bold shadow-xl hover:scale-105">
                    <Send className="w-5 h-5 mr-2" /> Hire Me
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto text-blue-200 hover:text-white hover:bg-white/5 px-8 h-14 text-lg"
                  onClick={() => {
                    if (settings?.resumeUrl) {
                      window.open(settings.resumeUrl, '_blank');
                    } else {
                      window.open('/resume.pdf', '_blank'); // Fallback
                    }
                  }}
                >
                  <Download className="w-5 h-5 mr-2" /> Resume
                </Button>
                <Link to="/projects">
                  <Button size="lg" variant="outline" className="gradient-primary border-0 text-white shadow-glow hover:shadow-lg transition-smooth text-base md:text-lg w-full sm:w-auto px-8 h-14 font-bold shadow-xl hover:scale-105">
                    View My Work
                  </Button>
                </Link>
              </div>

              <div className="flex gap-6 justify-center">
                {dynamicSocials.map((social, index) => {
                  const SiIcon = (SiIcons as any)[social.iconName];
                  const LucideIcon = (LucideIcons as any)[social.iconName];
                  const IconComponent = SiIcon || LucideIcon || Github;

                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/30 hover:scale-110 transition-all duration-300 flex items-center justify-center group backdrop-blur-md shadow-lg"
                      aria-label={social.platform}
                    >
                      <IconComponent className="w-6 h-6 text-white/90 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all" />
                    </a>
                  );
                })}
                {dynamicSocials.length === 0 && (
                  <div className="flex gap-4">
                    <Github className="w-6 h-6 text-white/20" />
                    <Linkedin className="w-6 h-6 text-white/20" />
                    <Twitter className="w-6 h-6 text-white/20" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="py-16 md:py-24 gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                <span className="text-primary">My Skills</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Technologies I work with to build amazing products
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
              {dynamicSkills.map((skill, index) => {
                const IconComponent = SiIcons[skill.iconName as keyof typeof SiIcons] || Code2;
                return (
                  <Card
                    key={skill.id}
                    className="p-4 md:p-6 text-center hover:shadow-lg transition-smooth hover:-translate-y-2 bg-card border-border animate-fade-in group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-smooth`} style={{ background: skill.color ? `linear-gradient(135deg, ${skill.color}, #ffffff55)` : undefined }}>
                      <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-base">{skill.name}</h3>
                  </Card>
                );
              })}
              {!skillsLoading && dynamicSkills.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground">No skills added yet.</div>
              )}
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                <span className="text-primary">Experience</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                My professional journey in software development
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              {dynamicExperiences.map((exp, index) => (
                <Card
                  key={exp.id}
                  className="p-6 hover:shadow-lg transition-smooth bg-card border-border animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{exp.role}</h3>
                      <p className="text-primary font-medium">{exp.company}</p>
                      <p className="text-muted-foreground text-sm mt-1">{exp.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      {exp.period}
                    </div>
                  </div>
                </Card>
              ))}
              {!experienceLoading && dynamicExperiences.length === 0 && (
                <div className="text-center text-muted-foreground">No experience added yet.</div>
              )}
            </div>
          </div>
        </section>

        {/* Projects Showcase */}
        <section className="py-16 md:py-24 gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                <span className="text-primary">Featured Projects</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Some of my recent work
              </p>
            </div>

            <div className="relative group/slider px-4 md:px-12">
              {/* Custom Navigation Buttons */}
              <button className="project-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md border hover:bg-background flex items-center justify-center disabled:opacity-50 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="project-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md border hover:bg-background flex items-center justify-center disabled:opacity-50 transition-all">
                <ChevronRight className="w-6 h-6" />
              </button>

              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation={{
                  prevEl: '.project-prev',
                  nextEl: '.project-next'
                }}
                pagination={{ clickable: true }}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                breakpoints={{
                  768: {
                    slidesPerView: 2,
                  },
                  1024: {
                    slidesPerView: 3,
                  },
                }}
                className="pb-12"
              >
                {featuredProjects.map((project, index) => (
                  <SwiperSlide key={index}>
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-smooth hover:-translate-y-2 bg-card border-border animate-fade-in group h-full flex flex-col"
                    >
                      <div className="aspect-video overflow-hidden shrink-0">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold underline-offset-4 decoration-primary truncate">{project.title}</h3>
                            {project.isFeatured && (
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {project.isPublic || user ? (
                              <>
                                {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer"><Github className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" /></a>}
                                {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer"><ArrowRight className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors -rotate-45" /></a>}
                              </>
                            ) : (
                              <div className="bg-background/90 backdrop-blur-sm rounded-full p-1 cursor-pointer" onClick={() => navigate('/auth')}>
                                <Lock className="w-4 h-4 text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {project.tags.map((tag: any, tagIndex: number) => (
                            <Badge key={tagIndex} variant="secondary" className="text-[10px] bg-primary/5 text-primary border-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="text-center mt-8">
              <Link to="/projects">
                <Button variant="outline" className="gap-2">
                  View All Projects <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialSlider />

        {/* Blog Section */}
        <section className="pt-16 md:pt-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                <span className="text-primary">Latest Blog Posts</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Thoughts and insights on web development
              </p>
            </div>

            <div className="relative group/slider px-4 md:px-12 max-w-6xl mx-auto">
              {/* Custom Navigation Buttons */}
              <button className="blog-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md border hover:bg-background flex items-center justify-center disabled:opacity-50 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="blog-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md border hover:bg-background flex items-center justify-center disabled:opacity-50 transition-all">
                <ChevronRight className="w-6 h-6" />
              </button>

              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation={{
                  prevEl: '.blog-prev',
                  nextEl: '.blog-next'
                }}
                pagination={{ clickable: true }}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                breakpoints={{
                  768: {
                    slidesPerView: 2,
                  },
                  1024: {
                    slidesPerView: 3,
                  },
                }}
                className="pb-12"
              >
                {latestBlogPosts.map((post, index) => (
                  <SwiperSlide key={index}>
                    <div
                      onClick={() => {
                        if (!post.isPublic && !user) {
                          navigate('/auth');
                        } else {
                          navigate(`/blog/${post.slug || post.id || ''}`);
                        }
                      }}
                      className="cursor-pointer h-full"
                    >
                      <Card
                        className="p-6 h-full hover:shadow-lg transition-smooth hover:-translate-y-2 bg-card border-border animate-fade-in group cursor-pointer relative flex flex-col"
                      >
                        {!post.isPublic && !user && (
                          <div className="absolute top-4 right-4 z-10">
                            <Lock className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <p className="text-muted-foreground text-sm mb-2">{post.date}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold group-hover:text-primary transition-smooth flex items-center gap-2 line-clamp-1">
                            {post.title}
                            {!post.isPublic && !user && <Lock className="w-3 h-3 text-muted-foreground/50" />}
                          </h3>
                          {post.isFeatured && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                      </Card>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="text-center mt-8">
              <Link to="/blog">
                <Button variant="outline" className="gap-2">
                  Read All Posts <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Card className="relative overflow-hidden p-8 md:p-12 lg:p-16 gradient-hero border-0 shadow-glow">
              <div className="relative z-10 text-center max-w-3xl mx-auto">
                <h2 className="text-3xl text-accent md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                  Let's Work Together
                </h2>
                <p className="text-lg md:text-xl text-white mb-6 md:mb-8">
                  Have a project in mind? Let's create something amazing together
                </p>
                <Link to="/contact">
                  <Button size="lg" className="gradient-primary border-0 text-white shadow-glow hover:shadow-lg transition-smooth text-base md:text-lg">
                    Start a Conversation
                  </Button>
                </Link>
              </div>

              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            </Card>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
