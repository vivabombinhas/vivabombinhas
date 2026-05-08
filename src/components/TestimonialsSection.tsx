import { motion } from "framer-motion";

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="rounded-[64px] bg-slate-950 p-12 md:p-20 text-center relative overflow-hidden">
          {/* Depth gradients */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-8">
              Primeiros usuários <span className="text-primary italic">da MarIA.</span>
            </h2>
            <p className="text-white/40 text-lg font-medium leading-relaxed mb-12">
              Estamos em fase de lançamento exclusivo para Bombinhas. Seja um dos primeiros a experimentar a revolução imobiliária.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] font-bold text-white/20">
                    M
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-white font-bold text-sm">+120</span>
                <span className="text-white/30 text-xs font-medium uppercase tracking-widest">já testaram</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { TestimonialsSection };