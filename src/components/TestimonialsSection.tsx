import { motion } from "framer-motion";

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="rounded-[48px] bg-slate-50 border border-slate-100 p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.4em] mb-6">Comunidade</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-950 mb-8">
              Ajudando pessoas a descobrir <span className="text-blue-600 italic">Bombinhas.</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">
              Estamos organizando o mercado imobiliário local para que você tenha a melhor experiência de busca.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border border-white bg-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                  <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-[10px] font-bold text-white/50 uppercase">
                    M
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-slate-950 font-bold text-sm">+500</span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">buscas realizadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { TestimonialsSection };