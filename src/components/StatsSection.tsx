import { useEffect, useState, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";

function Counter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
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
    { value: 20, prefix: "+", label: "Imobiliárias parceiras" },
    { value: 580, prefix: "+", label: "Imóveis cadastrados" },
    { value: 100, suffix: "%", label: "Foco em Bombinhas" },
  ];

  return (
    <section className="py-12 lg:py-20 bg-background relative">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative flex flex-col items-center md:items-start text-center md:text-left group"
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-[-0.04em] mb-2 md:mb-4 tabular-nums">
                <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <div className="text-[11px] lg:text-[12px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em] max-w-full md:max-w-[140px] leading-relaxed">
                {stat.label}
              </div>
              
              {/* Subtle accent line on hover */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-full transition-all duration-500 group-hover:h-12 hidden md:block" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}