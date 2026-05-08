const partners = [
  { name: "Airbnb", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg" },
  { name: "OLX", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9e/OLX_logo.svg" },
  { name: "Zap Imóveis", logo: "https://upload.wikimedia.org/wikipedia/pt/4/44/Logo_ZAP_Imóveis.png" },
  { name: "VivaReal", logo: "https://logodownload.org/wp-content/uploads/2019/08/vivareal-logo.png" },
];

const PartnerLogos = () => {
  return (
    <div className="bg-white py-12 border-b border-slate-50">
      <div className="container px-4 mx-auto">
        <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-10">
          Tecnologia conectada com as maiores plataformas
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {partners.map((p, i) => (
            <img 
              key={i} 
              src={p.logo} 
              alt={p.name} 
              className="h-6 md:h-8 w-auto object-contain" 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerLogos;