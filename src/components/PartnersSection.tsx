import { useState } from "react";
import { Building2, Users, Eye, TrendingUp, ArrowRight, Phone, Link2, BedDouble, Bath, Car, Ruler, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  { icon: Eye, title: "Mais visibilidade", desc: "Seus imóveis aparecem para quem está buscando ativamente na região." },
  { icon: Users, title: "Leads qualificados", desc: "Conecte-se com pessoas que já descreveram exatamente o que procuram." },
  { icon: TrendingUp, title: "Alcance inteligente", desc: "A IA da MarIA recomenda seus imóveis quando batem com a busca do usuário." },
  { icon: Building2, title: "Gestão simples", desc: "Cadastre e atualize seus anúncios em poucos minutos." },
];

const finalidadeMap: Record<string, string> = {
  aluguel: "aluguel_anual",
  temporada: "temporada",
  venda: "venda",
};

const typeOptions = [
  { value: "aluguel", label: "Aluguel Anual" },
  { value: "temporada", label: "Temporada" },
  { value: "venda", label: "Venda" },
];

const propertyCategories = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "cobertura", label: "Cobertura" },
  { value: "kitnet", label: "Kitnet" },
  { value: "studio", label: "Studio" },
  { value: "sobrado", label: "Sobrado" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
];

const PartnersSection = () => {
  const [open, setOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const { toast } = useToast();

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      telefone: formData.get("telefone"),
      email: formData.get("email"),
      tipo: selectedTypes,
      categoria: selectedCategory,
      bairro: formData.get("bairro"),
      quartos: formData.get("quartos"),
      banheiros: formData.get("banheiros"),
      vagas: formData.get("vagas"),
      area: formData.get("area"),
      valor: formData.get("valor"),
      link: formData.get("link"),
      descricao: formData.get("descricao"),
    };
    console.log("Anúncio enviado:", data);
    toast({
      title: "Anúncio enviado com sucesso! 🎉",
      description: "Nossa equipe vai revisar e entrar em contato em breve.",
    });
    setOpen(false);
    setSelectedTypes([]);
    setSelectedCategory("");
  };

  return (
    <section id="anunciar" className="py-12 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-wider mb-4">
              <Building2 className="h-4 w-4" />
              Para anunciantes
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Anuncie na <span className="text-gradient">MarIA</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Proprietários, corretores e imobiliárias: coloque seus imóveis na frente de quem está
              procurando ativamente em Bombinhas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-10 md:mb-12">
            {benefits.map((b, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <b.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA card */}
          <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5 p-8 md:p-10 text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              Faça parte do ecossistema MarIA
            </h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Cadastre seus imóveis e seja encontrado por quem busca alugar, comprar ou investir em Bombinhas.
            </p>
            <Button
              size="lg"
              className="gap-2 rounded-xl bg-gradient-to-r from-accent to-primary hover:opacity-90 text-primary-foreground"
              onClick={() => setOpen(true)}
            >
              Quero anunciar meus imóveis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog do formulário */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cadastrar imóvel</DialogTitle>
            <DialogDescription>
              Preencha as informações do seu imóvel. Nossa equipe revisará e publicará em breve.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Dados do anunciante */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Seus dados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome / Empresa</Label>
                  <Input id="nome" name="nome" placeholder="João Silva" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="telefone" name="telefone" placeholder="(47) 99999-0000" className="pl-9" required />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
              </div>
            </div>

            {/* Tipo de negócio */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Tipo de negócio</p>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleType(t.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedTypes.includes(t.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Tipo de imóvel</p>
              <div className="flex flex-wrap gap-2">
                {propertyCategories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedCategory(c.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedCategory === c.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-1.5">
              <Label htmlFor="bairro">Bairro / Localização</Label>
              <Input id="bairro" name="bairro" placeholder="Ex: Mariscal, Bombas, Centro..." required />
            </div>

            {/* Especificações */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Especificações</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quartos" className="flex items-center gap-1.5 text-xs">
                    <BedDouble className="h-3.5 w-3.5" /> Quartos
                  </Label>
                  <Input id="quartos" name="quartos" type="number" min="0" placeholder="3" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banheiros" className="flex items-center gap-1.5 text-xs">
                    <Bath className="h-3.5 w-3.5" /> Banheiros
                  </Label>
                  <Input id="banheiros" name="banheiros" type="number" min="0" placeholder="2" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vagas" className="flex items-center gap-1.5 text-xs">
                    <Car className="h-3.5 w-3.5" /> Vagas
                  </Label>
                  <Input id="vagas" name="vagas" type="number" min="0" placeholder="1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="area" className="flex items-center gap-1.5 text-xs">
                    <Ruler className="h-3.5 w-3.5" /> Área (m²)
                  </Label>
                  <Input id="area" name="area" type="number" min="0" placeholder="80" />
                </div>
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input id="valor" name="valor" placeholder="Ex: 2.500/mês ou 450.000" required />
            </div>

            {/* Link */}
            <div className="space-y-1.5">
              <Label htmlFor="link" className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Link do anúncio (opcional)
              </Label>
              <Input id="link" name="link" type="url" placeholder="https://olx.com.br/seu-anuncio" />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição adicional</Label>
              <Textarea id="descricao" name="descricao" placeholder="Detalhes do imóvel, diferenciais, mobília..." rows={3} />
            </div>

            <Button type="submit" size="lg" className="w-full gap-2 rounded-xl bg-gradient-to-r from-accent to-primary hover:opacity-90 text-primary-foreground">
              Enviar anúncio
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PartnersSection;
