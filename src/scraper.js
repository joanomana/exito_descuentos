const puppeteer = require('puppeteer');
const cliProgress = require('cli-progress');

const scrapeCategoria = async (categoria, descuentoMinimo, maxPaginas) => {
    const { nombre, link } = categoria.value;
    const baseUrl = link;
    const productosTotales = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const type = req.resourceType();
        if (['image', 'stylesheet', 'font'].includes(type)) req.abort();
        else req.continue();
    });

    const progressBar = new cliProgress.SingleBar({
        format: `${nombre} |{bar}| {percentage}% | Página {value}/{total}`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });

    progressBar.start(maxPaginas, 0);

    let paginasFallidas = 0;
    const maxPaginasFallidas = 3;

    for (let currentPage = 0; currentPage < maxPaginas; currentPage++) {
        const url = `${baseUrl}${currentPage}`;
        let success = false;
        let retries = 0;
        const maxRetries = 1;

        while (!success && retries <= maxRetries) {
            try {
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

                const productos = await page.evaluate((descuentoMinimo, nombre) => {
                    const resultados = [];
                    const grid = document.querySelector('.product-grid_fs-product-grid___qKN2');
                    if (!grid) return resultados;

                    const firstUrlFromSrcset = (srcset) => {
                        if (!srcset) return null;
                        const first = String(srcset).split(',')[0]?.trim();
                        return first?.split(/\s+/)[0] || null;
                    };

                    const absolutize = (u) => {
                        if (!u) return null;
                        return /^https?:\/\//i.test(u) ? u : `https://www.exito.com${u}`;
                    };

                    // Función para elegir imagen de producto evitando "envío gratis"
                    const getProductImage = (item) => {
                        // Buscar imagen dentro del enlace del producto
                        let imgEl = item.querySelector('a[data-testid="product-link"] img');

                        // Si no hay, buscar la primera imagen válida que no sea de flags
                        if (!imgEl) {
                            const candidates = Array.from(item.querySelectorAll('img')).filter(el => {
                                // ignorar imágenes dentro de contenedores de flag/promos
                                if (el.closest('.product-flag_productFlagContainer__cJsm8')) return false;
                                if (el.closest('[data-image-container]')) return false;
                                const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
                                return /vtexassets\.com\/arquivos\/ids\//.test(src);
                            });
                            imgEl = candidates[0] || null;
                        }
                        return imgEl;
                    };

                    const items = grid.querySelectorAll('li');
                    items.forEach(item => {
                        const descuentoElem = item.querySelector('.priceSection_container-promotion_discount__iY3EO span[data-percentage="true"]');
                        if (!descuentoElem) return;

                        const descuento = parseInt(descuentoElem.textContent.trim());
                        if (descuento >= descuentoMinimo) {
                            const titulo = item.querySelector('h3.styles_name__qQJiK')?.textContent.trim();
                            const marca = item.querySelector('h3.styles_brand__IdJcB')?.textContent.trim();
                            const precioOriginal = item.querySelector('.priceSection_container-promotion_price-dashed__FJ7nI')?.textContent.trim();
                            const precioConDescuento = item.querySelector('[data-fs-container-price-otros]')?.textContent.trim();
                            const enlaceRel = item.querySelector('a[data-testid="product-link"]')?.href;
                            const aliadoElem = item.querySelector('.allieds-display_fs-best-allied-info__DImuP');
                            const precioAliado = aliadoElem?.textContent.trim() || null;

                            const imgEl = getProductImage(item);
                            let imagen =
                                imgEl?.getAttribute('src') ||
                                imgEl?.getAttribute('data-src') ||
                                firstUrlFromSrcset(imgEl?.getAttribute('srcset'));

                            imagen = absolutize(imagen);
                            const enlace = absolutize(enlaceRel);

                            const urlAbsoluta = enlace?.startsWith('http') ? enlace : (enlace ? `https://www.exito.com${enlace}` : null);

                            if (urlAbsoluta) {
                                resultados.push({
                                    categoria: nombre,
                                    titulo,
                                    marca,
                                    descuento: `${descuento}%`,
                                    precioOriginal,
                                    precioConDescuento,
                                    precioAliado,
                                    enlace: urlAbsoluta,
                                    imagen: imagen || null,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                    });

                    return resultados;
                }, descuentoMinimo, nombre);

                productosTotales.push(...productos);
                success = true;

            } catch (error) {
                console.warn(`⚠️ Error cargando página ${currentPage} de "${nombre}": ${error.message}`);
                retries++;

                if (retries > maxRetries) {
                    paginasFallidas++;
                    console.error(`❌ Falló 2 veces la página ${currentPage} de "${nombre}". Total fallidas: ${paginasFallidas}`);
                    if (paginasFallidas >= maxPaginasFallidas) {
                        console.error(`🚫 Más de ${maxPaginasFallidas} páginas fallidas en "${nombre}". Saltando a la siguiente categoría...`);
                        break;
                    }
                } else {
                    console.log(`🔁 Reintentando página ${currentPage}...`);
                }
            }
        }

        progressBar.increment();
    }

    progressBar.stop();
    await browser.close();

    console.log(`🧪 Total productos encontrados en "${nombre}": ${productosTotales.length}`);
    return productosTotales;
};

module.exports = scrapeCategoria;
