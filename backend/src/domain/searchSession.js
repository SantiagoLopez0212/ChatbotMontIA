/*
 Componente: SearchSession (Dominio)
 SRP: Mantiene estado de busqueda y referencias (offset, limit, cache).
*/
class SearchSession {
  constructor(limit) {
    this.limit = limit;
    this.state = null;
    this.references = null;
  }
  start(query, filters) {
    this.state = { query, filters: filters || {}, offset: 0 };
  }
  hasActiveSearch() { return Boolean(this.state && this.state.query); }
  currentParams() { return this.state ? { ...this.state, limit: this.limit } : null; }
  advancePage() { if (!this.state) return null; this.state.offset += this.limit; return this.currentParams(); }
  rollbackPage() { if (!this.state) return null; this.state.offset = Math.max(0, this.state.offset - this.limit); }
  setReferences(topic, items) { this.references = { topic, items: Array.isArray(items) ? items : [] }; }
  getReferences() { return this.references; }
  clearReferences() { this.references = null; }
  clear() { this.state = null; this.clearReferences(); }
}
module.exports = SearchSession;

