import { useEffect, useState, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";

function Counter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2.5,
        ease: [0.16, 1, 0.3, 1], // easeOutQuart for a smoother "roulette" stop
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
    <section className="py-24 bg-[#04111f] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#38b6ff]/30 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#38b6ff]/30 to-transparent" />
        
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#38b6ff]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: i * 0.2,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              viewport={{ once: true }}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Stat Card Background (subtle) */}
              <div className="absolute inset-0 bg-white/[0.02] border border-white/[0.05] rounded-3xl -m-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative mb-3">
                <div className="text-5xl lg:text-7xl font-bold text-white tracking-tighter">
                  <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                    <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </span>
                </div>
                {/* Decorative dot */}
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: i * 0.2 + 0.5 }}
                  className="absolute -right-4 top-2 w-2 h-2 rounded-full bg-[#38b6ff] shadow-[0_0_12px_rgba(56,182,255,0.8)]"
                />
              </div>

              <div className="text-[11px] md:text-[13px] text-white/40 font-bold uppercase tracking-[0.3em] leading-tight">
                {stat.label}
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* WaBadge replacement/Online indicator */}
      <div className="mt-16 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl"
        >
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
          </div>
          <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
            Sistemas atualizados e MarIA online agora
          </span>
        </motion.div>
      </div>
    </section>
  );
}
