"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Sparkles,
  CheckSquare,
  Heart,
  Mail,
  Users,
  Target,
  Menu,
  X,
  ArrowRight,
  Clock,
  FileText,
  Activity,
  Send,
  Zap,
  Bot,
  Shield,
  Layers,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AGENTS } from "@/lib/constants";

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

const heroWords = ["Action Items", "Clear Decisions", "Follow-up Emails", "Team Tasks"];

const iconMap: Record<string, LucideIcon> = {
  FileText,
  CheckSquare,
  Activity,
  Send,
};

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrollY;
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, to]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerChildren({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const scrollY = useScrollPosition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Agents", href: "#agents" },
    { label: "Get Started", href: "#cta" },
  ];

  return (
    <div className="min-h-full flex flex-col">
      <Navbar
        scrollY={scrollY}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        links={navLinks}
      />

      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <SectionDivider color="#6366f1" />
        <FeaturesSection />
        <SectionDivider color="#8b5cf6" />
        <HowItWorksSection />
        <SectionDivider color="#06b6d4" />
        <AgentsSection />
        <SectionDivider color="#6366f1" />
        <CTASection />
      </main>

      <FooterSection />
    </div>
  );
}

function Navbar({
  scrollY,
  mobileOpen,
  setMobileOpen,
  links,
}: {
  scrollY: number;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  links: { label: string; href: string }[];
}) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrollY > 20
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-lg font-bold text-transparent">
            MeetMind
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-text-muted transition-colors duration-200 hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
          <Link href="/analyze">
            <Button size="sm" className="shadow-lg shadow-primary/20">
              Try Now
            </Button>
          </Link>
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex cursor-pointer items-center justify-center text-text-primary md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border bg-surface md:hidden"
          >
            <div className="flex flex-col gap-2 px-4 py-4">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface2 hover:text-text-primary"
                >
                  {link.label}
                </a>
              ))}
              <Link href="/analyze" className="block">
                <Button size="sm" className="mt-2 w-full">
                  Try Now
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function ParticleBackground() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dx: (Math.random() - 0.5) * 60,
    dy: (Math.random() - 0.5) * -60,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 4,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            x: [0, p.dx],
            y: [0, p.dy],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function ParallaxOrbs({ scrollY }: { scrollY: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large orb top left */}
      <div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          transform: `translateY(${scrollY * 0.2}px)`,
          filter: "blur(60px)",
        }}
      />
      {/* Large orb top right */}
      <div
        className="absolute -right-32 top-20 h-80 w-80 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          transform: `translateY(${scrollY * 0.15}px)`,
          filter: "blur(60px)",
        }}
      />
      {/* Medium orb center */}
      <div
        className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          transform: `translateX(-50%) translateY(${scrollY * 0.1}px)`,
          filter: "blur(40px)",
        }}
      />
      {/* Animated floating shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute right-20 top-40 h-32 w-32 opacity-5"
        style={{ border: "1px solid #6366f1", borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute left-20 bottom-40 h-24 w-24 opacity-5"
        style={{ border: "1px solid #06b6d4", borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
      />
    </div>
  );
}

function HeroSection() {
  const scrollY = useScrollPosition();
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20 pb-32">
      <ParallaxOrbs scrollY={scrollY} />
      <ParticleBackground />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(rgba(99,102,241,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <HeroBadge />
          <HeroHeadline />
          <HeroSubtitle />
          <HeroCTAs />
          <FloatingCards />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function HeroBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary"
    >
      <Zap className="h-3.5 w-3.5" />
      <span className="font-medium">5 AI Agents — One Dashboard</span>
    </motion.div>
  );
}

function HeroHeadline() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % heroWords.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.h1
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
    >
      Turn Any Meeting Into{" "}
      <br className="hidden sm:block" />
          <span className="relative inline-block">
            <AnimatePresence mode="wait">
              <motion.span
                key={heroWords[wordIndex]}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-shift"
              >
                {heroWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
    </motion.h1>
  );
}

function HeroSubtitle() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mt-6 max-w-2xl text-lg text-text-muted sm:text-xl"
    >
      5 AI agents analyze your meeting transcript in seconds. Never miss a decision or action item again.
    </motion.p>
  );
}

function HeroCTAs() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
    >
      <Link href="/analyze">
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
          Analyze Your Meeting <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <Button variant="ghost" size="lg">
        See How It Works
      </Button>
    </motion.div>
  );
}

function FloatingCards() {
  const cardData = [
    {
      title: "Executive Summary",
      content:
        "The Q3 planning meeting covered budget allocation, team restructuring, and product roadmap priorities.",
      color: "from-primary to-secondary",
      label: "Summary",
    },
    {
      title: "Action Items",
      content:
        "1. Finalize Q4 budget by Friday\n2. Review team proposals by EOD\n3. Schedule follow-up with design",
      color: "from-success to-emerald-400",
      label: "Tasks",
    },
    {
      title: "Follow-up Email",
      content:
        "Hi team, here's a recap of today's key decisions and next steps...",
      color: "from-accent to-cyan-300",
      label: "Email Draft",
    },
  ];

  const floatDelays = [2.2, 2.5, 2.8];

  return (
    <div className="mt-16 hidden w-full max-w-4xl gap-4 md:grid md:grid-cols-3">
      {cardData.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 40 }}
          animate={{
            opacity: 1,
            y: [0, -10, 0],
          }}
          transition={{
            opacity: { duration: 0.6, delay: floatDelays[i] },
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5 + 2.2,
            },
          }}
        >
          <Card className="p-4 h-full">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full bg-gradient-to-r", card.color)} />
              <span className="text-xs font-medium text-text-muted">{card.label}</span>
            </div>
            <h4 className="mb-1 text-sm font-semibold text-text-primary">{card.title}</h4>
            <p className="whitespace-pre-line text-xs leading-relaxed text-text-muted">{card.content}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function StatsSection() {
  const stats = [
    { icon: MessageSquare, value: 10000, suffix: "+", label: "Meetings Analyzed" },
    { icon: Bot, value: 5, suffix: "", label: "AI Agents" },
    { icon: Clock, value: 30, suffix: "s", label: "Processing Time" },
    { icon: Shield, value: 99, suffix: "%", label: "Accuracy Rate" },
  ];

  return (
    <FadeInSection>
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <Card className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-6 text-center",
                i >= 2 && "md:border-t-0",
              )}
            >
              <stat.icon className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold text-text-primary md:text-3xl">
                <Counter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-text-muted">{stat.label}</div>
            </div>
          ))}
        </Card>
      </section>
    </FadeInSection>
  );
}

function SectionDivider({ color = "#6366f1" }: { color?: string }) {
  return (
    <div className="relative mx-auto max-w-6xl px-4">
      <div
        className="h-px w-full opacity-20"
        style={{
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
        }}
      />
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Instant Summary",
      description:
        "Get a concise, structured summary of any meeting in seconds. No more scanning through hours of recordings.",
      color: "#6366f1",
      gradient: "from-primary to-indigo-400",
    },
    {
      icon: CheckSquare,
      title: "Action Items",
      description:
        "Automatically extract tasks, deadlines, and ownership. Every commitment captured and assigned.",
      color: "#8b5cf6",
      gradient: "from-secondary to-purple-400",
    },
    {
      icon: Heart,
      title: "Sentiment Analysis",
      description:
        "Understand the emotional tone of your meetings. Detect tension, enthusiasm, and engagement levels.",
      color: "#06b6d4",
      gradient: "from-accent to-cyan-300",
    },
    {
      icon: Mail,
      title: "Follow-up Emails",
      description:
        "Auto-generate professional follow-up emails with key decisions, action items, and next steps.",
      color: "#10b981",
      gradient: "from-success to-emerald-300",
    },
    {
      icon: Users,
      title: "Task Assignment",
      description:
        "Identify who is responsible for what. Map tasks to team members automatically.",
      color: "#f59e0b",
      gradient: "from-warning to-amber-300",
    },
    {
      icon: Target,
      title: "Decision Tracking",
      description:
        "Every decision made during the meeting is logged, timestamped, and categorized for easy review.",
      color: "#6366f1",
      gradient: "from-primary to-indigo-400",
    },
  ];

  return (
    <FadeInSection>
      <section id="features" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)"
        }} />
        <div className="mb-14 text-center">
          <span className="mb-3 inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">Features</span>
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Everything Your Team Needs
          </h2>
          <p className="mt-3 text-text-muted">
            From transcripts to action — five AI agents handle it all.
          </p>
        </div>

        <StaggerChildren className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300",
                    "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br",
                      feature.gradient,
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-muted">
                    {feature.description}
                  </p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </section>
    </FadeInSection>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Paste Transcript",
      description:
        "Upload or paste your meeting notes, recording transcript, or conversation text into the dashboard.",
      color: "from-primary to-indigo-400",
    },
    {
      number: "02",
      icon: Layers,
      title: "AI Agents Analyze",
      description:
        "5 specialized AI agents work in parallel — extracting action items, analyzing sentiment, and more.",
      color: "from-secondary to-purple-400",
    },
    {
      number: "03",
      icon: Sparkles,
      title: "Get Results",
      description:
        "Download your meeting summary, task list, and follow-up email — ready to share with your team.",
      color: "from-accent to-cyan-300",
    },
  ];

  return (
    <FadeInSection>
      <section
        id="how-it-works"
        className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 70%)"
        }} />
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            From Transcript to Insights in 3 Steps
          </h2>
          <p className="mt-3 text-text-muted">
            No setup, no training. Just paste and go.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          <svg
            className="absolute left-0 right-0 top-16 hidden h-0.5 w-full md:block"
            viewBox="0 0 800 4"
            fill="none"
            preserveAspectRatio="none"
          >
            <line
              x1="40"
              y1="2"
              x2="760"
              y2="2"
              stroke="rgba(99,102,241,0.2)"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
          </svg>

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <FadeInSection key={step.number} delay={i * 0.15}>
                <div className="relative flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
                      step.color,
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="mb-2 text-sm font-bold text-primary">
                    Step {step.number}
                  </span>
                  <h3 className="mb-3 text-xl font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="max-w-xs text-sm leading-relaxed text-text-muted">
                    {step.description}
                  </p>
                </div>
              </FadeInSection>
            );
          })}
        </div>
      </section>
    </FadeInSection>
  );
}

function AgentsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % AGENTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <FadeInSection>
      <section
        id="agents"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Meet Your AI Team
          </h2>
          <p className="mt-3 text-text-muted">
            Five specialized agents working together to analyze your meetings.
          </p>
        </div>

        <div className="relative">
          {/* Pipeline connecting SVG between agents */}
          <svg
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-full w-full md:block"
            preserveAspectRatio="none"
            style={{ height: `${AGENTS.length * 100}px` }}
          >
            {AGENTS.slice(0, -1).map((agent, i) => {
              const isActiveAgent = i === activeIndex || i + 1 === activeIndex;
              return (
                <line
                  key={agent.id}
                  x1={`${(i + 0.5) * 20}%`}
                  y1="50"
                  x2={`${(i + 1.5) * 20}%`}
                  y2="50"
                  stroke={isActiveAgent ? agent.color : "#161822"}
                  strokeWidth="2"
                  strokeDasharray={isActiveAgent ? "none" : "4 3"}
                  className="transition-all duration-700"
                />
              );
            })}
          </svg>

          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-5 md:overflow-visible"
          >
            {AGENTS.map((agent, i) => {
              const Icon = iconMap[agent.icon] || Brain;
              const isActive = i === activeIndex;
              const isHovered = i === hoveredIndex;

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "relative min-w-[220px] flex-shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                    isActive || isHovered
                      ? "bg-surface shadow-lg shadow-primary/5 animate-border-glow"
                      : "border-border bg-surface/50",
                  )}
                  style={
                    isActive || isHovered
                      ? { boxShadow: `0 0 30px ${agent.color}20` }
                      : undefined
                  }
                >
                  {(isActive || isHovered) && (
                    <motion.div
                      layoutId="agent-glow"
                      className="pointer-events-none absolute inset-0 opacity-10"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${agent.color} 0%, transparent 70%)`,
                      }}
                    />
                  )}

                  <motion.div
                    animate={
                      isActive
                        ? {
                            scale: [1, 1.08, 1],
                            transition: { duration: 2, repeat: Infinity },
                          }
                        : {}
                    }
                    className={cn(
                      "mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg",
                    )}
                    style={{ backgroundColor: `${agent.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: agent.color }} />
                  </motion.div>

                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -inset-1 rounded-2xl border-2"
                      style={{
                        borderColor: `${agent.color}40`,
                        animation: "pulse-ring 2s ease-out infinite",
                        "--ring-color": `${agent.color}40`,
                      } as React.CSSProperties}
                    />
                  )}

                  <h3 className="mb-1 text-sm font-semibold text-text-primary">
                    {agent.name}
                  </h3>
                  <p className="mb-3 text-xs leading-relaxed text-text-muted">
                    {agent.role}
                  </p>
                  <p className="text-xs italic text-text-dim">
                    Specialized in{" "}
                    {agent.description.split(".")[0]?.toLowerCase() ?? "meeting analysis"}
                  </p>

                  {isActive && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute bottom-0 left-0 h-0.5 w-full origin-left"
                      style={{ backgroundColor: agent.color }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}

function CTASection() {
  return (
    <FadeInSection>
      <section id="cta" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-secondary/5 p-8 sm:p-12 lg:p-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl lg:text-5xl">
              Ready to Transform Your Meetings?
            </h2>
            <p className="mt-4 max-w-lg text-lg text-text-muted">
              Start analyzing for free — no account needed. Just paste your transcript and go.
            </p>
            <Link href="/analyze">
              <Button
                size="lg"
                className="mt-8 gap-2 shadow-lg shadow-primary/30"
              >
                Analyze Meeting Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}

function FooterSection() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <a href="#" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Brain className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-base font-bold text-transparent">
                MeetMind
              </span>
            </a>
            <p className="text-xs text-text-muted">
              AI-powered meeting intelligence for modern teams.
            </p>
          </div>

          <div className="flex gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Product
              </span>
              <a
                href="#features"
                className="text-sm text-text-muted transition-colors hover:text-text-primary"
              >
                Features
              </a>
              <a
                href="#agents"
                className="text-sm text-text-muted transition-colors hover:text-text-primary"
              >
                Agents
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-text-muted transition-colors hover:text-text-primary"
              >
                How It Works
              </a>
            </div>
          </div>


        </div>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-xs text-text-dim">
            &copy; {new Date().getFullYear()} MeetMind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
