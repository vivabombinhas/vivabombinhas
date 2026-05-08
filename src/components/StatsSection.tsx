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
    <section className="py-12 bg-white relative">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100 rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
          {stats.map((stat, i) => (
            <div 
              key={i}
              className="relative p-10 flex flex-col items-center text-center bg-white hover:bg-slate-50 transition-colors duration-500"
            >
              <div className="text-4xl font-bold text-slate-950 tracking-tight mb-2">
                <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}