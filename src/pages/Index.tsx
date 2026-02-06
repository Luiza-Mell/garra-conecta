import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Users, FileText, TrendingUp, Building2, HandHeart } from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">G</span>
            </div>
            <span className="font-bold text-xl text-foreground">Instituto Garra</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth?type=organization">Área da ONG</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/auth?type=supporter">Área do Apoiador</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-8 md:pt-28 md:pb-12 bg-accent-subtle overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium mb-6 animate-fade-in">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-foreground">Transformando vidas através do impacto social</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
                Plataforma de{" "}
                <span className="text-primary">Acompanhamento</span>{" "}
                de Impacto Social
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up animation-delay-100">
                Conectamos organizações sociais e apoiadores para criar um ecossistema
                de transparência, colaboração e resultados mensuráveis.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up animation-delay-200">
                <Button size="xl" variant="hero" asChild>
                  <Link to="/auth?type=organization">
                    <Building2 className="w-5 h-5" />
                    Sou uma ONG
                  </Link>
                </Button>
                <Button size="xl" variant="hero-outline" asChild>
                  <Link to="/auth?type=supporter">
                    <HandHeart className="w-5 h-5" />
                    Sou Apoiador
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:block animate-fade-in animation-delay-200">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl transform scale-95"></div>
                <img 
                  src={heroImage} 
                  alt="Mãos unidas representando impacto social" 
                  className="relative w-full rounded-3xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Uma plataforma completa para gestão e acompanhamento de projetos sociais
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group p-8 rounded-2xl bg-card border border-border card-hover">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Relatórios Mensais
              </h3>
              <p className="text-muted-foreground">
                Envie relatórios detalhados sobre a execução dos projetos, 
                incluindo atividades, finanças e evidências de impacto.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group p-8 rounded-2xl bg-card border border-border card-hover">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Indicadores de Impacto
              </h3>
              <p className="text-muted-foreground">
                Acompanhe métricas de resultado, número de beneficiários 
                e o impacto gerado em tempo real.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group p-8 rounded-2xl bg-card border border-border card-hover">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Transparência Total
              </h3>
              <p className="text-muted-foreground">
                Apoiadores têm acesso a dados consolidados sobre todos 
                os projetos que ajudam a financiar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-garra-black text-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="animate-slide-up">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50+</div>
              <div className="text-background/70">Organizações Parceiras</div>
            </div>
            <div className="animate-slide-up animation-delay-100">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">R$ 2M+</div>
              <div className="text-background/70">Recursos Destinados</div>
            </div>
            <div className="animate-slide-up animation-delay-200">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">10k+</div>
              <div className="text-background/70">Pessoas Impactadas</div>
            </div>
            <div className="animate-slide-up animation-delay-300">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">100+</div>
              <div className="text-background/70">Projetos Apoiados</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-primary rounded-3xl p-12 shadow-glow">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Faça Parte Dessa Transformação
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Junte-se a nós e ajude a construir um futuro mais justo e igualitário.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero" asChild>
                <Link to="/auth?type=organization">
                  Cadastrar Organização
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="hero-outline" className="border-garra-black text-garra-black hover:bg-garra-black hover:text-background" asChild>
                <Link to="/auth?type=supporter">
                  Quero Apoiar
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">G</span>
              </div>
              <span className="font-semibold text-foreground">Instituto Garra</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Instituto Garra. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
