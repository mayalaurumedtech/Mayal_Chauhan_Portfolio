import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { User, Briefcase, GraduationCap, Award } from "lucide-react";
import * as SiIcons from "react-icons/si";
import { useSkills } from "@/hooks/useSkills";
import { useBiography } from "@/hooks/useBiography";
import { useExperiences } from "@/hooks/useExperiences";
import { useEducations } from "@/hooks/useEducations";

const About = () => {
  const { data: skills = [] } = useSkills();
  const { data: biography = [] } = useBiography();
  const { data: experiences = [] } = useExperiences();
  const { data: educations = [] } = useEducations();

  return (
    <>
      <SEO
        title="About"
        description="Learn more about my background, skills, experience, and education as a Full Stack Developer"
        keywords="about, biography, skills, experience, education, full stack developer"
      />
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              About Me
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Frontend Developer | React Js Developer | Web Designer
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Bio Card */}
            <Card className="p-6 md:p-8 animate-slide-up hover:shadow-lg transition-smooth">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Biography</h2>
              </div>
              {biography.length > 0 ? (
                biography.map((bio) => (
                  <p key={bio.id} className="text-muted-foreground leading-relaxed mb-4">
                    {bio.content}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Loading biography...
                </p>
              )}
            </Card>

            <Card className="p-6 md:p-8 animate-slide-up hover:shadow-lg transition-smooth" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Skills</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {skills.map((skill, index) => {
                  const IconComponent = SiIcons[skill.iconName as keyof typeof SiIcons] || SiIcons.SiJavascript;
                  return (
                    <div
                      key={skill.id}
                      className="group flex flex-col items-center p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-md"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${skill.color} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground text-center">{skill.name}</span>
                    </div>
                  );
                })}
                {skills.length === 0 && <p className="col-span-4 text-center text-muted-foreground">Loading skills...</p>}
              </div>
            </Card>
          </div>

          {/* Experience & Education */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Experience */}
            <Card className="p-6 md:p-8 animate-slide-up hover:shadow-lg transition-smooth" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Experience</h2>
              </div>

              <div className="space-y-6">
                {experiences.length > 0 ? (
                  experiences.map((exp, index) => (
                    <div key={exp.id} className={`border-l-2 ${index % 2 === 0 ? 'border-primary' : 'border-accent'} pl-4`}>
                      <p className="text-sm text-muted-foreground">{exp.period}</p>
                      <h3 className="text-xl font-semibold mt-1">{exp.role}</h3>
                      <p className="text-primary font-medium">{exp.company}</p>
                      <p className="text-muted-foreground mt-2">
                        {exp.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Loading experience...</p>
                )}
              </div>
            </Card>

            {/* Education */}
            <Card className="p-6 md:p-8 animate-slide-up hover:shadow-lg transition-smooth" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Education</h2>
              </div>

              <div className="space-y-6">
                {educations.length > 0 ? (
                  educations.map((edu, index) => (
                    <div key={edu.id} className={`border-l-2 ${index % 2 === 0 ? 'border-accent' : 'border-primary'} pl-4`}>
                      <p className="text-sm text-muted-foreground">{edu.period}</p>
                      <h3 className="text-xl font-semibold mt-1">{edu.degree}</h3>
                      <p className="text-primary font-medium">{edu.institution}</p>
                      <p className="text-muted-foreground mt-2">
                        {edu.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Loading education...</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
