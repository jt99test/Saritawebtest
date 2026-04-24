 # SARITA — I18N RULES

## Idiomas soportados

- Español (default)
- Inglés
- Italiano

---

## Regla clave

NUNCA hardcodear texto en componentes.

Todo el contenido visible debe salir de un sistema de traducción.

---

## Estructura recomendada

Crear archivos:

/locales/es.json  
/locales/en.json  
/locales/it.json  

---

## Ejemplo estructura

```json
{
  "home": {
    "cta": "Generar carta natal",
    "subtitle": "El cielo del día en que naciste"
  },
  "form": {
    "name": "Nombre",
    "birthdate": "Fecha de nacimiento",
    "birthtime": "Hora de nacimiento",
    "location": "Lugar de nacimiento",
    "submit": "Ver mi carta natal"
  },
  "loading": {
    "step1": "Buscando el cielo del momento en que naciste",
    "step2": "Trazando la posición de los planetas",
    "step3": "Preparando tu carta natal"
  }
}
