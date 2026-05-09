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
    { value: 20, prefix: "+", label: "Imobiliárias locais" },
    { value: 580, prefix: "+", label: "Imóveis ativos" },
    { value: 100, suffix: "%", label: "Foco em Bombinhas" },
  ];

  return (
    <section className="py-20 bg-background relative border-y border-border/40">
      <div className="container-wide">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col items-center md:items-start text-center md:text-left group"
            >
              <div className="text-h1 mb-2 tabular-nums text-foreground tracking-tighter">
                <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <div className="text-badge text-muted-foreground tracking-[0.2em]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}