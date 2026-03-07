# Presentación y Captura de Contraste

## Antes
- API con una sola función de respuesta, sin filtros ni paginación.
- Sin controles de seguridad (CORS abierto, sin rate limit).
- Sin documentación de arquitectura.

## Después
- Arquitectura por capas, handlers SOLID, visión C4 documentada.
- Búsqueda agregada a catálogos abiertos, filtros, paginación.
- Conversación natural + opinión basada en bibliografía con referencias a demanda.
- Seguridad: CORS allowlist, cabeceras, rate limiting.

## Guion sugerido (10–12 min)
- Contexto y objetivos (1m)
- Estilo y patrones elegidos (2m)
- C4: contexto → contenedores → componentes (4m)
- Demo: saludo, opinión, referencias, búsqueda y paginación (3m)
- Contraste y lecciones aprendidas (2m)