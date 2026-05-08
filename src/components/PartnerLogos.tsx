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
        <div className="flex flex-wrap justify-center items-center gap-x-6 md:gap-x-12 gap-y-4 opacity-50">
          {partners.map((p, i) => (
            <div key={i} className="flex items-center gap-x-6 md:gap-x-12">
              <span className="text-lg md:text-xl font-semibold text-slate-700 tracking-tight">
                {p.name}
              </span>
              {i < partners.length - 1 && (
                <span className="text-slate-300 text-xl">·</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerLogos;