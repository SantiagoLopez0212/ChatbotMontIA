/*
 Componente: ChatHandler (Interfaz)
 Patron: Strategy/Chain of Responsibility (cada handler es una estrategia).
 SOLID: ISP/LSP (canHandle/handle minimo e intercambiable).
*/
class ChatHandler {
  canHandle(_ctx){ throw new Error('Implement canHandle'); }
  async handle(_ctx){ throw new Error('Implement handle'); }
}
module.exports = ChatHandler;

