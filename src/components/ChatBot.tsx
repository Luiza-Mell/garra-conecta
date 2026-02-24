import { useState } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

const FAQ: Record<string, string> = {
  "relatório": "Para enviar um relatório mensal, acesse 'Novo Relatório' no menu lateral. O formulário possui 8 etapas que podem ser preenchidas e salvas como rascunho a qualquer momento.",
  "prazo": "Os relatórios mensais devem ser enviados até o dia 10 do mês seguinte ao mês de referência.",
  "anexo": "Você pode anexar evidências como fotos, documentos e comprovantes financeiros na etapa de Evidências do relatório.",
  "rascunho": "Sim! Você pode salvar o relatório como rascunho e voltar para completá-lo depois. Basta clicar em 'Salvar Rascunho'.",
  "contato": "Você pode entrar em contato conosco pelo WhatsApp (11) 99816-2471 ou pelo email contato@institutogarra.org.br",
  "ajuda": "Posso ajudar com dúvidas sobre relatórios, prazos, anexos e funcionalidades da plataforma. Digite sua pergunta!",
};

function findAnswer(question: string): string {
  const q = question.toLowerCase();
  for (const [key, answer] of Object.entries(FAQ)) {
    if (q.includes(key)) return answer;
  }
  return "Não encontrei uma resposta específica para sua dúvida. Tente perguntar sobre: relatórios, prazos, anexos, rascunhos ou contato. Ou fale conosco pelo WhatsApp (11) 99816-2471.";
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Olá! Sou o assistente do Instituto Garra. Como posso ajudar você hoje?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "bot",
      content: findAnswer(input),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up" style={{ height: "28rem" }}>
          {/* Header */}
          <div className="bg-hero-gradient px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-foreground" />
              <span className="font-semibold text-primary-foreground text-sm">Assistente Garra</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] px-3 py-2 rounded-xl text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-accent text-accent-foreground rounded-bl-sm"
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua dúvida..."
                className="flex-1 text-sm"
              />
              <Button type="submit" size="icon" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          isOpen
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground animate-pulse-glow"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
};

export default ChatBot;
