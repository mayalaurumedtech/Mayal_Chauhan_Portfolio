import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { firestoreRest, extractVal } from "@/lib/firestore-rest";
import { z } from "zod";
import * as SiIcons from "react-icons/si";
import * as LucideIcons from "lucide-react";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters")
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicSocials, setDynamicSocials] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
              contactEmail: extractVal(settingsDoc.fields.contactEmail),
              contactPhone: extractVal(settingsDoc.fields.contactPhone),
              contactLocation: extractVal(settingsDoc.fields.contactLocation),
            });
          }
        } catch (e) { }
      } catch (error) {
        console.error('Error fetching contact data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Validate form data
      const validatedData = contactSchema.parse(formData);

      // Save to Firestore via REST API to avoid SDK channel calls
      await firestoreRest.create("contacts", {
        ...validatedData,
        createdAt: new Date().toISOString(),
        status: "unread"
      });

      toast.success("Message sent successfully! I'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Contact error:", error);
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <SEO
        title="Contact"
        description="Get in touch with me for project inquiries, collaborations, or just to say hello"
        keywords="contact, hire developer, project inquiry, collaboration"
      />
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Have a question or want to work together? Feel free to reach out!
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <Card className="p-6 animate-slide-up hover:shadow-lg transition-smooth">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-sm text-muted-foreground">{settings?.contactEmail || "mayalchauhan66@gmail.com"}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 animate-slide-up hover:shadow-lg transition-smooth" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-sm text-muted-foreground">{settings?.contactPhone || "+91 9723148970"}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 animate-slide-up hover:shadow-lg transition-smooth" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <p className="text-sm text-muted-foreground">{settings?.contactLocation || "Ahmedabad, Gujarat, India"}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2 p-6 md:p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-bold mb-6">Send Me a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="What's this about?"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Your message..."
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto gradient-primary border-0 text-white shadow-glow hover:shadow-lg transition-smooth"
                  size="lg"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Social Media Links Section */}
          {dynamicSocials.length > 0 && (
            <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-2xl font-bold mb-6">Connect with Me</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {dynamicSocials.map((social, index) => {
                  const SiIcon = (SiIcons as any)[social.iconName];
                  const LucideIcon = (LucideIcons as any)[social.iconName];
                  const IconComponent = SiIcon || LucideIcon || LucideIcons.ExternalLink;

                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 hover:scale-110 transition-all duration-300 flex items-center justify-center group shadow-sm"
                      title={social.platform}
                    >
                      <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review CTA Section */}
          <div className="mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
                <Mail className="w-48 h-48" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="max-w-xl space-y-4">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic">
                    Already worked with me?
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    I value your feedback! Share your experience with others and help me grow.
                    It only takes a minute to leave a review.
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    size="lg"
                    onClick={() => window.location.href = '/reviews'}
                    className="gradient-primary text-white font-bold h-14 px-10 rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all group"
                  >
                    <Send className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                    Give a Review
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
