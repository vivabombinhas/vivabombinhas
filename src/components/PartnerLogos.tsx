const partners = [
  { name: "Airbnb" },
  { name: "OLX" },
  { name: "Zap Imóveis" },
  { name: "VivaReal" },
];

const PartnerLogos = () => {
  return (
    <div className="bg-white py-12 border-b border-slate-100">
      <div className="container px-4 mx-auto">
        <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-10">
          Imóveis também anunciados em
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 md:gap-x-20 gap-y-6 opacity-50">
          {partners.map((p, i) => (
            <span 
              key={i} 
              className="text-lg md:text-xl font-bold text-slate-700 tracking-tight"
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerLogos;