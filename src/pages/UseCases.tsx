import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { InteractiveChatBox } from "@/components/InteractiveChatBox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Home, Key, MessageSquare } from "lucide-react";

const UseCases = () => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="pt-32 pb-20 container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Casos de Uso</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore como a MarIA pode ajudar você a encontrar o imóvel ideal em Bombinhas através de diferentes fluxos de conversação.
          </p>
        </div>

        <Tabs defaultValue="temporada" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-12 h-auto p-1 bg-muted/50">
            <TabsTrigger value="temporada" className="py-4 flex flex-col gap-2">
              <Sun className="h-5 w-5" />
              <span>Temporada</span>
            </TabsTrigger>
            <TabsTrigger value="anual" className="py-4 flex flex-col gap-2">
              <Key className="h-5 w-5" />
              <span>Aluguel Anual</span>
            </TabsTrigger>
            <TabsTrigger value="compra" className="py-4 flex flex-col gap-2">
              <Home className="h-5 w-5" />
              <span>Compra</span>
            </TabsTrigger>
            <TabsTrigger value="interacao" className="py-4 flex flex-col gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>Interação</span>
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <TabsContent value="temporada" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Aluguel de Temporada</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Planeje suas férias perfeitas em Bombinhas. A MarIA ajuda você a encontrar casas e apartamentos disponíveis para datas específicas, filtrando por proximidade da praia e comodidades.
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">O que você pode perguntar:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Quero uma casa para o Réveillon perto da Praia do Mariscal."
                    </p>
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Procuro apartamento com 3 quartos para 6 pessoas em janeiro."
                    </p>
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Tem alguma opção que aceite pet na Praia da Lagoinha?"
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="anual" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Aluguel Anual</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Buscando morar em Bombinhas? Encontre opções de locação fixa com toda a assistência para entender requisitos, localização e valores médios.
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">O que você pode perguntar:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Preciso de uma casa para aluguel anual no Centro ou Bombas."
                    </p>
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Quais os documentos necessários para aluguel anual na cidade?"
                    </p>
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Procuro kitnet mobiliada para morar sozinho."
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compra" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Compra de Imóveis</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Invista no paraíso. A MarIA filtra as melhores oportunidades de investimento ou moradia própria, conectando você aos melhores corretores e proprietários.
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">O que você pode perguntar:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Quero ver apartamentos à venda na planta em Bombas."
                    </p>
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Procuro cobertura de frente para o mar para investimento."
                    </p>
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Quais bairros têm maior valorização em Bombinhas?"
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interacao" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Interação Amigável</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Tire dúvidas gerais sobre a cidade, melhores épocas para visita, custo de vida ou como funciona a nossa plataforma.
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">O que você pode perguntar:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Qual a melhor época para evitar filas em Bombinhas?"
                    </p>
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Como funciona a Taxa de Preservação Ambiental (TPA)?"
                    </p>
                    <p className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      "Quais as melhores praias para ir com crianças?"
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            <div className="sticky top-32 bg-background border rounded-3xl overflow-hidden shadow-2xl h-[600px]">
              <TabsContent value="temporada" className="m-0 h-full">
                <InteractiveChatBox forcedConvIndex={0} />
              </TabsContent>
              <TabsContent value="anual" className="m-0 h-full">
                <InteractiveChatBox forcedConvIndex={1} />
              </TabsContent>
              <TabsContent value="compra" className="m-0 h-full">
                <InteractiveChatBox forcedConvIndex={2} />
              </TabsContent>
              <TabsContent value="interacao" className="m-0 h-full">
                <InteractiveChatBox forcedConvIndex={3} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UseCases;
