import { useEffect, useState, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";

function Counter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 1.5, // Faster, smoother
        ease: [0.16, 1, 0.3, 1],
        onUpdate(value) {
          setDisplayValue(Math.floor(value));
        },
      });
      return () => controls.stop();
    }
  }, [value, isInView]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{displayValue}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const stats = [
    { value: 20, prefix: "+", label: "Imobiliárias" },
    { value: 580, prefix: "+", label: "Imóveis Ativos" },
    { value: 100, suffix: "%", label: "Foco Local" },
  ];

  return (
    <section className="py-20 md:py-24 bg-background relative overflow-hidden -mt-16 md:-mt-24 z-20">
      <div className="container-wide">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass border border-white/40 rounded-[32px] p-2 md:p-3 shadow-premium backdrop-blur-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/20">
              {stats.map((stat, i) => (
                <div 
                  key={i}
                  className="flex flex-col items-center justify-center py-6 px-8 group"
                >
                  <div className="text-3xl md:text-4xl font-bold tabular-nums text-foreground tracking-tighter mb-1 group-hover:text-primary transition-colors duration-500">
                    <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </div>
                  <div className="text-badge">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
