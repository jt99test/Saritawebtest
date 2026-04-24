  COPY_GUIDE.md I18N_RULES.md
# SARITA — MASTER SPEC (v1)

## Visión
SARITA es una experiencia de astrología minimalista, visual y emocionalmente cercana.

No enseña astrología.
No abruma con tecnicismos.

Explica de forma clara:
qué significa tu carta natal para ti.

## Principios clave
- Simplicidad extrema en interfaz
- Alta calidad visual
- Movimiento elegante y contenido
- Lenguaje claro y cercano
- Precisión máxima en cálculos (fase posterior)
- Experiencia guiada, no exploratoria

---

## Flujo del producto (v1)

1. Home
2. Formulario
3. Loading
4. Resultado (intro + carta)

---

## 1. HOME

### Objetivo
Captar atención y llevar al usuario al formulario.

### Contenido
- Logo: SARITA (centrado)
- Línea secundaria (subheadline)
- Botón: "Generar carta natal"
- Selector de idioma (discreto)

### Visual
- Fondo negro profundo
- Galaxia en movimiento
- Sistema solar o planetas realistas
- Glow neón contenido
- Movimiento lento

### Restricciones
- No añadir secciones extra
- No explicar producto
- No saturar

---

## 2. FORMULARIO

### Campos
- Nombre
- Fecha de nacimiento
- Hora de nacimiento
- Lugar de nacimiento

### UX
- Interfaz limpia
- Labels claros
- Sin lenguaje técnico
- Autocomplete en lugar de nacimiento

### Lugar de nacimiento
- Autocomplete inteligente
- Prioridad: España > Italia > resto
- Debe devolver:
  - nombre
  - país
  - coordenadas (lat/lng)

### CTA
- "Ver mi carta natal"

---

## 3. LOADING

### Objetivo
Convertir la espera en una experiencia emocional

### Visual
- Globo terráqueo realista
- Glow azul neón
- Zoom hacia ciudad de nacimiento
- Fondo espacial

### Mensajes (rotativos)
- "Buscando el cielo del momento en que naciste"
- "Trazando la posición de los planetas"
- "Preparando tu carta natal"

---

## 4. RESULTADO (v1)

### Estructura
1. Introducción breve
2. Carta natal

### Introducción
Personalizada con nombre.

Ejemplo:
"[Nombre], así estaban alineados los planetas cuando naciste."

### Carta
- Representación visual limpia
- Sin explicación larga todavía
- Base para futuras interpretaciones

---

## Diseño visual global

### Estilo
- Realista + minimal + neón contenido

### Evitar
- estética “mística barata”
- iconos zodiacales cliché
- exceso de colores
- saturación de efectos

---

## Interactividad

v1:
- mínima pero pulida

futuro:
- exploración de planetas
- interacción con carta
- animaciones reactivas

---

## Prioridades técnicas

1. Flujo completo funcional
2. UI consistente
3. Arquitectura preparada para:
   - i18n
   - cálculos astrológicos
   - expansión futura

---

## Fases futuras

- cálculo real de carta natal
- interpretación simple
- modo exploración
- cuentas de usuario
- compartir carta