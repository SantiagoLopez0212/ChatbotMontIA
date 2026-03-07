class HandleChatMessage {
  constructor(searchUseCase) {
    this.searchUseCase = searchUseCase;
  }

  async handle(userMessage) {
    if (userMessage.toLowerCase().includes("buscar")) {
      const query = userMessage.replace(/buscar/i, "").trim();
      const results = await this.searchUseCase.execute(query);
      return results.map(r => `${r.title} — ${r.author} (${r.year})\n${r.link}`).join("\n\n");
    }
    return "Puedo ayudarte a buscar artículos académicos. Escribe: 'buscar inteligencia artificial'";
  }
}

module.exports = HandleChatMessage;
