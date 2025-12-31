import { IconType } from "react-icons";
import { SiCss3, SiGoogle, SiHtml5, SiJavascript, SiReact, SiRedux, SiTailwindcss, SiTypescript } from "react-icons/si";

export interface Skill {
    name: string;
    icon: IconType;
    color: string;
}

export interface Experience {
    role: string;
    company: string;
    period: string;
    description: string;
}

export interface Project {
    title: string;
    description: string;
    tags: string[];
    image: string;
}

export const skills: Skill[] = [
    { name: "React", icon: SiReact, color: "from-cyan-400 to-blue-500" },
    { name: "Redux", icon: SiRedux, color: "from-purple-500 to-violet-600" },
    { name: "TypeScript", icon: SiTypescript, color: "from-blue-500 to-blue-700" },
    { name: "JavaScript", icon: SiJavascript, color: "from-yellow-400 to-orange-500" },
    { name: "Tailwind CSS", icon: SiTailwindcss, color: "from-cyan-400 to-teal-500" },
    { name: "HTML5", icon: SiHtml5, color: "from-orange-400 to-red-500" },
    { name: "CSS3", icon: SiCss3, color: "from-blue-400 to-indigo-500" },
    { name: "On-page SEO", icon: SiGoogle, color: "from-blue-500 to-green-500" },
];

export const experiences: Experience[] = [
    {
        role: "Frontend Developer",
        company: "Edzyme Tech Private Limited",
        period: "2024 - Present",
        description: "Leading development of scalable web applications using React and Node.js"
    },
    {
        role: "Web Designer",
        company: "Clients Now Technologies",
        period: "2022 - 2024",
        description: "Built responsive user interfaces and improved performance metrics"
    }
];

export const projects = [
    {
        title: "E-Commerce Platform",
        description: "Full-stack online store with payment integration",
        tags: ["React", "Node.js", "PostgreSQL"],
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop"
    },
    {
        title: "Task Management App",
        description: "Collaborative project management tool",
        tags: ["TypeScript", "Redux", "Firebase"],
        image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop"
    },
    {
        title: "Portfolio Website",
        description: "Modern responsive portfolio with animations",
        tags: ["React", "Tailwind", "GSAP"],
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
    }
];

export const latestBlogPosts = [
    { title: "Building Scalable React Applications", excerpt: "Best practices for structuring large React projects", date: "Dec 15, 2024" },
    { title: "TypeScript Tips for Beginners", excerpt: "Essential TypeScript concepts every developer should know", date: "Dec 10, 2024" },
    { title: "CSS Grid vs Flexbox", excerpt: "When to use each layout system for best results", date: "Dec 5, 2024" }
];
