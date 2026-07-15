import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Home, 
  ClipboardList, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Sparkles,
  Search,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  MapPin,
  Pencil,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdvertiserLoginPanel from "@/components/AdvertiserLoginPanel";

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch submissions
      const { data: subs, error: subsError } = await supabase
        .from("imoveis_submissions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;
      setSubmissions(subs || []);

      // Fetch approved properties
      const { data: props, error: propsError } = await supabase
        .from("imoveis")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (propsError) throw propsError;
      setProperties(props || []);

      // Fetch matches for these properties
      if (props && props.length > 0) {
        const propIds = props.map(p => p.id);
        const { data: mtch, error: mtchError } = await supabase
          .from("lead_matches")
          .select(`
            *,
            lead:leads_maria(*),
            imovel:imoveis(titulo, bairro)
          `)
          .in("imovel_id", propIds)
          .order("score", { ascending: false });

        if (mtchError) throw mtchError;
        setMatches(mtch || []);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Erro ao carregar dados do painel");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="container py-10 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!session) {
    return <AdvertiserLoginPanel />;
  }

  const pendingSubmissions = submissions.filter(s => s.status_submission === "pendente");
  const approvedProperties = properties.length;
  const totalMatches = matches.length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold">
              <span className="text-gradient">Mar</span>IA
            </Link>
            <Badge variant="outline" className="ml-2">Painel do Anunciante</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              {session.user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Bem-vindo de volta! Veja como estão seus anúncios.</p>
          </div>
          <Button onClick={() => navigate("/anuncie")} className="gap-2">
            <Plus className="h-4 w-4" /> Anunciar Novo Imóvel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Imóveis Ativos</CardTitle>
              <Home className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedProperties}</div>
              <p className="text-xs text-muted-foreground">Aparecendo nas buscas da MarIA</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Submissões Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
              <p className="text-xs text-muted-foreground">Aguardando revisão da nossa equipe</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Interessados (Matches)</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMatches}</div>
              <p className="text-xs text-muted-foreground">Clientes qualificados pela IA</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="bg-background border">
            <TabsTrigger value="properties" className="gap-2">
              <Home className="h-4 w-4" /> Meus Imóveis
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <ClipboardList className="h-4 w-4" /> Submissões
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Users className="h-4 w-4" /> Interessados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            {properties.length === 0 ? (
              <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                <Home className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium">Nenhum imóvel aprovado ainda</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                  Assim que sua submissão for revisada e aprovada, ela aparecerá aqui como um imóvel ativo.
                </p>
                <Button variant="outline" onClick={() => navigate("/anuncie")}>Cadastrar Primeiro Imóvel</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <Card key={prop.id} className="overflow-hidden group">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {prop.fotos?.[0] ? (
                        <img 
                          src={prop.fotos[0]} 
                          alt={prop.titulo} 
                          className="object-cover w-full h-full transition-transform group-hover:scale-105" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=400&fit=crop&q=60";
                            target.style.opacity = "0.5";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Home className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className={prop.status === "ativo" ? "bg-emerald-500" : "bg-amber-500"}>
                          {prop.status === "ativo" ? "Ativo" : prop.status}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold line-clamp-1">{prop.titulo}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {prop.bairro || "Bombinhas"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm font-semibold">
                          {prop.preco ? 
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.preco) : 
                            prop.preco_temporada_diaria ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.preco_temporada_diaria)}/dia` : 
                            "Consulte"
                          }
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title="Reprocessar fotos"
                            disabled={!prop.link_anuncio}
                            onClick={async () => {
                              if (!prop.link_anuncio) return;
                              toast.info("Reprocessando fotos... ✨");
                              try {
                                const { data: result, error } = await supabase.functions.invoke("extract-property-from-link", {
                                  body: { url: prop.link_anuncio }
                                });
                                
                                if (error) throw error;
                                if (!result?.success || !result?.data?.fotos) throw new Error("Não foi possível extrair novas fotos");

                                const { error: updateError } = await supabase
                                  .from("imoveis")
                                  .update({ fotos: result.data.fotos })
                                  .eq("id", prop.id);

                                if (updateError) throw updateError;
                                
                                toast.success(`${result.data.fotos.length} fotos atualizadas!`);
                                fetchData(session.user.id);
                              } catch (e) {
                                console.error(e);
                                toast.error("Erro ao atualizar fotos");
                              }
                            }}
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title="Editar"
                            onClick={() => navigate(`/admin/imoveis?id=${prop.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver Matches">
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Submissões</CardTitle>
                <CardDescription>Acompanhe o processo de aprovação dos seus envios.</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Você ainda não enviou nenhum imóvel.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            sub.status_submission === "pendente" ? "bg-amber-100 text-amber-600" :
                            sub.status_submission === "aprovado" ? "bg-emerald-100 text-emerald-600" :
                            "bg-rose-100 text-rose-600"
                          }`}>
                            {sub.status_submission === "pendente" ? <Clock className="h-5 w-5" /> :
                             sub.status_submission === "aprovado" ? <CheckCircle2 className="h-5 w-5" /> :
                             <XCircle className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-semibold">{sub.titulo}</p>
                            <p className="text-sm text-muted-foreground">
                              Enviado em {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            sub.status_submission === "pendente" ? "secondary" :
                            sub.status_submission === "aprovado" ? "default" :
                            "destructive"
                          }>
                            {sub.status_submission.charAt(0).toUpperCase() + sub.status_submission.slice(1)}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Interessados Encontrados</CardTitle>
                    <CardDescription>Pessoas que procuram exatamente o que você oferece.</CardDescription>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/20 gap-1">
                    <Sparkles className="h-3 w-3" /> MarIA Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="py-12 text-center space-y-4">
                    <Users className="h-12 w-12 text-muted-foreground opacity-20 mx-auto" />
                    <p className="text-muted-foreground">Nenhum interessado encontrado ainda.</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      A MarIA analisa constantemente as conversas com usuários para encontrar o imóvel ideal. Quando houver um match, ele aparecerá aqui!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((match) => (
                      <div key={match.id} className="p-4 border rounded-xl space-y-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {match.lead?.nome?.[0] || "?"}
                            </div>
                            <div>
                              <p className="font-bold">{match.lead?.nome || "Interessado Anônimo"}</p>
                              <p className="text-xs text-muted-foreground">Score de afinidade: {match.score}%</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                            Match Alto
                          </Badge>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Interesse no seu imóvel:</p>
                          <p className="font-medium">"{match.imovel?.titulo}"</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Por que é um match?</p>
                          <div className="flex flex-wrap gap-1">
                            {match.match_reasons?.map((reason: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button className="w-full gap-2 mt-2" variant="outline">
                          <MessageSquare className="h-4 w-4" /> Ver Conversa da IA
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
