function classifyIntent(message) {
  if (message.toLowerCase().includes("buscar")) return "search";
  return "unknown";
}

module.exports = classifyIntent;
