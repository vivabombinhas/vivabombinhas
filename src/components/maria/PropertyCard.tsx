import {
  Home, MapPin, BedDouble, Bath, Car, Waves, Sun, Dog,
  Wind, Wifi, UtensilsCrossed, ExternalLink, Phone, Users, Maximize, Flame
} from "lucide-react";

export interface Property {
  id: string;
  titulo: string;
  bairro: string | null;
  finalidade: string;
  tipo: string;
  preco: number | null;
  preco_temporada_diaria: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas_garagem: number | null;
  area_m2: number | null;
  capacidade_pessoas: number | null;
  piscina: boolean | null;
  vista_mar: boolean | null;
  frente_mar: boolean | null;
  mobiliado: boolean | null;
  churrasqueira: boolean | null;
  ar_condicionado: boolean | null;
  wifi: boolean | null;
  aceita_pet: boolean | null;
  fotos: string[] | null;
  link_anuncio: string | null;
  anunciante_telefone: string | null;
  gestao_propria?: boolean | null;
  imobiliaria_nome?: string | null;
  destaque_pago?: boolean | null;
  destaque_ate?: string | null;
}

function formatPrice(property: Property) {
  if (property.finalidade === "temporada" && property.preco_temporada_diaria) {
    return `R$ ${property.preco_temporada_diaria.toLocaleString("pt-BR")}/dia`;
  }
  if (property.preco) {
    if (property.finalidade === "aluguel_anual") {
      return `R$ ${property.preco.toLocaleString("pt-BR")}/mês`;
    }
    return `R$ ${property.preco.toLocaleString("pt-BR")}`;
  }
  return "Consulte";
}

function formatFinalidade(f: string) {
  switch (f) {
    case "compra": return "Compra";
    case "aluguel_anual": return "Aluguel";
    case "temporada": return "Temporada";
    default: return f;
  }
}

function formatTipo(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ");
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const amenities: { icon: React.ElementType; label: string }[] = [];

  if (property.piscina) amenities.push({ icon: Waves, label: "Piscina" });
  if (property.vista_mar) amenities.push({ icon: Sun, label: "Vista mar" });
  if (property.frente_mar) amenities.push({ icon: Waves, label: "Frente mar" });
  if (property.mobiliado) amenities.push({ icon: Home, label: "Mobiliado" });
  if (property.churrasqueira) amenities.push({ icon: UtensilsCrossed, label: "Churrasq." });
  if (property.ar_condicionado) amenities.push({ icon: Wind, label: "Ar cond." });
  if (property.wifi) amenities.push({ icon: Wifi, label: "Wi-Fi" });
  if (property.aceita_pet) amenities.push({ icon: Dog, label: "Pet" });

  const isDestaqueAtivo =
    Boolean(property.destaque_pago) &&
    (!property.destaque_ate || new Date(property.destaque_ate).getTime() > Date.now());

  return (
    <div
      className={`relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group ${
        isDestaqueAtivo
          ? "border-2 border-transparent bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 p-[2px]"
          : "border border-border/60"
      }`}
    >
      <div className={isDestaqueAtivo ? "bg-card rounded-[10px] overflow-hidden" : ""}>
      {/* Thumbnail */}
      {property.fotos && property.fotos.length > 0 && (
        <div className="relative w-full h-36 bg-muted overflow-hidden">
          <img
            src={property.fotos[0]}
            alt={property.titulo}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=400&fit=crop&q=60";
              target.style.opacity = "0.5";
            }}
          />
          {/* Badges over image */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
            {isDestaqueAtivo && (
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-bold backdrop-blur-sm shadow-md flex items-center gap-1 animate-pulse">
                <Flame className="w-2.5 h-2.5" />
                Oportunidade Premium
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold backdrop-blur-sm">
              {formatTipo(property.tipo)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-accent/90 text-accent-foreground text-[10px] font-semibold backdrop-blur-sm">
              {formatFinalidade(property.finalidade)}
            </span>
          </div>
        </div>
      )}

      {/* Header with badge (fallback when no photo) */}
      {(!property.fotos || property.fotos.length === 0) && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              {formatTipo(property.tipo)}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs font-medium text-accent">
              {formatFinalidade(property.finalidade)}
            </span>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-3 space-y-2.5">
        {/* Title */}
        <h3 className={`text-sm font-bold leading-snug line-clamp-2 ${isDestaqueAtivo ? "text-amber-900 dark:text-amber-100" : "text-foreground"}`}>
          {property.titulo}
        </h3>

        {/* Location */}
        {property.bairro && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs">{property.bairro}, Bombinhas</span>
          </div>
        )}

        {/* Price */}
        <div className="bg-primary/5 rounded-lg px-3 py-2">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {formatPrice(property)}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {property.quartos != null && property.quartos > 0 && (
            <div className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              <span>{property.quartos} {property.quartos === 1 ? "quarto" : "quartos"}</span>
            </div>
          )}
          {property.banheiros != null && property.banheiros > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              <span>{property.banheiros} {property.banheiros === 1 ? "banh." : "banh."}</span>
            </div>
          )}
          {property.vagas_garagem != null && property.vagas_garagem > 0 && (
            <div className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" />
              <span>{property.vagas_garagem} {property.vagas_garagem === 1 ? "vaga" : "vagas"}</span>
            </div>
          )}
          {property.area_m2 != null && (
            <div className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" />
              <span>{property.area_m2} m²</span>
            </div>
          )}
          {property.capacidade_pessoas != null && property.capacidade_pessoas > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{property.capacidade_pessoas} pessoas</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium"
              >
                <Icon className="w-2.5 h-2.5" />
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Gestão própria badge */}
        {property.gestao_propria && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
            <Home className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary">
              Administrado por {property.imobiliaria_nome ?? "nossa imobiliária"}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {property.link_anuncio && !property.gestao_propria && (
            <a
              href={property.link_anuncio}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver anúncio
            </a>
          )}
          {property.anunciante_telefone && (
            <a
              href={`https://wa.me/${(() => {
                const digits = property.anunciante_telefone.replace(/\D/g, "");
                // Se já começa com 55 e tem 12-13 dígitos, já tem DDI
                if (digits.startsWith("55") && digits.length >= 12) return digits;
                // Senão, adiciona 55
                return "55" + digits;
              })()}?text=${encodeURIComponent(
                property.gestao_propria
                  ? `Olá! Tenho interesse no imóvel "${property.titulo}" anunciado na MarIA. Pode me passar mais informações?`
                  : `Olá! Vi o imóvel "${property.titulo}" na MarIA Bombinhas e gostaria de mais informações.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${property.gestao_propria ? "flex-1" : ""} flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity`}
            >
              <Phone className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
