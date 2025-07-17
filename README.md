# 🛒 Scraper de Descuentos Éxito

Este es un **script de Node.js con Puppeteer** que permite hacer scraping del sitio web de [Éxito.com](https://www.exito.com), buscando productos con descuentos mayores a un porcentaje mínimo especificado, dentro de una categoría seleccionada por el usuario.

---

## 🚀 Características

- Consulta productos por **categoría** (como Mercado, Tecnología, Ropa, etc.).
- Filtro por **porcentaje mínimo de descuento** (ej. ≥ 50%).
- Control de cuántas **páginas** escanear.
- **Barra de progreso** por consola.
- Exporta resultados en **formato JSON**.
- Interfaz interactiva por consola.

---

## 📦 Requisitos

- Node.js v18 o superior
- Acceso a Internet (el script utiliza Puppeteer para abrir páginas)

---

## 🛠️ Uso

1. Instala las dependencias:

```bash
npm install
```

2. Ejecuta el script con:
```bash
node index.js
```

3. Luego sigue las instrucciones interactivas:
```bash
✔ 📦 Selecciona una categoría: Seleccionar
✔ 💸 ¿Descuento mínimo que deseas filtrar? (ej: 50) ..
✔ 📄 ¿Cuántas páginas quieres revisar? ..
```
---

## 📁 Salida
El script generará un archivo .json con el nombre de la categoría:

```pgsql

productos_Mercado.json
productos_Tecnología.json
```
Cada entrada del archivo contiene:

```json
{
  "titulo": "Nombre del producto",
  "marca": "Marca",
  "descuento": "50%",
  "precioOriginal": "$100.000",
  "precioConDescuento": "$50.000",
  "enlace": "https://www.exito.com/producto-ejemplo"
}
```
---
## 🧩 Librerías utilizadas
- puppeteer: Navegación automática por páginas.

- inquirer: Prompts por consola.

- cli-progress: Barra de progreso visual.

- fs: Para guardar los resultados.

