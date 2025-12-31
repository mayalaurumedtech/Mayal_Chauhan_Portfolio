import { CodeXml, Cpu, Layers } from "lucide-react";
import {
  SiReact, SiRedux, SiJavascript, SiTypescript,
  SiTailwindcss, SiHtml5, SiCss3, SiGoogle
} from "react-icons/si";

export const FestivalDecor = () => {
  return (
    <>
      {/* Decorative Theme Blurs - Deep Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/8 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[30%] left-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Floating Tech Symbols - Middle Decorative Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Development Core Symbols */}
        <CodeXml
          className="absolute top-[10%] left-[5%] text-primary/40 animate-spin-glow"
          size={42}
        />
        <SiReact
          className="absolute top-[22%] left-[10%] text-accent/35 animate-float-slow"
          size={36}
        />
        <SiTypescript
          className="absolute top-[5%] left-[18%] text-secondary/30 animate-pulse-glow"
          size={26}
        />

        {/* Design & Layout Symbols */}
        <SiTailwindcss
          className="absolute top-[8%] right-[8%] text-accent/40 animate-float"
          size={40}
        />
        <SiHtml5
          className="absolute top-[22%] right-[14%] text-primary/35 animate-spin-slow"
          size={30}
        />
        <Layers
          className="absolute top-[12%] right-[22%] text-secondary/30 animate-bounce-slow"
          size={26}
        />

        {/* Logic & Flow Symbols */}
        <SiJavascript
          className="absolute bottom-[15%] left-[10%] text-primary/40 animate-spin-glow"
          size={36}
        />
        <SiRedux
          className="absolute bottom-[28%] left-[15%] text-accent/35 animate-float-slow"
          size={28}
        />
        <Cpu
          className="absolute bottom-[8%] left-[22%] text-secondary/30 animate-pulse-glow"
          size={32}
        />

        {/* Web & SEO Symbols */}
        <SiCss3
          className="absolute bottom-[12%] right-[10%] text-accent/40 animate-float"
          size={38}
        />
        <SiGoogle
          className="absolute bottom-[25%] right-[18%] text-primary/35 animate-spin-slow"
          size={30}
        />
        <CodeXml
          className="absolute bottom-[6%] right-[25%] text-secondary/30 animate-bounce-slow"
          size={24}
        />

        {/* Scattered Background Fillers */}
        <SiReact
          className="absolute top-[48%] left-[12%] text-primary/12 animate-float"
          size={22}
        />
        <SiJavascript
          className="absolute top-[52%] right-[15%] text-accent/12 animate-float-slow"
          size={24}
        />
        <SiHtml5
          className="absolute bottom-[38%] left-[38%] text-secondary/12 animate-pulse-glow"
          size={20}
        />
      </div>
    </>
  );
};
