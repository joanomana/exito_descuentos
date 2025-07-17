const puppeteer = require('puppeteer');
const inquirer = require('inquirer').default;
const fs = require('fs');
const cliProgress = require('cli-progress');

(async () => {
    const categoriasDisponibles = [
        {
            name: 'Mercado',
            value: {
            nombre: 'mercado',
            link: 'https://www.exito.com/mercado?vendido-por=exito&category-1=mercado&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Vinos y Licores',
            value: {
            nombre: 'Licores',
            link: 'https://www.exito.com/vinos-y-licores/whisky?category-2=whisky&vendido-por=exito&category-1=vinos-y-licores&facets=category-2%2Cvendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Cuidado Personal',
            value: {
            nombre: 'Cuidado Personal',
            link: 'https://www.exito.com/cuidado-personal?vendido-por=exito&category-1=cuidado-personal&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Tecnología',
            value: {
            nombre: 'Tecnología',
            link: 'https://www.exito.com/tecnologia?vendido-por=exito&category-1=tecnologia&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Hogar y decoración',
            value: {
            nombre: 'Hogar y decoración',
            link: 'https://www.exito.com/hogar-y-decoracion?vendido-por=exito&category-1=hogar-y-decoracion&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Belleza',
            value: {
            nombre: 'Belleza',
            link: 'https://www.exito.com/belleza?vendido-por=exito&category-1=belleza&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Bebes',
            value: {
            nombre: 'Bebes',
            link: 'https://www.exito.com/bebes?vendido-por=exito&category-1=bebes&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Moda y accesorios',
            value: {
            nombre: 'Moda y accesorios',
            link: 'https://www.exito.com/moda-y-accesorios?vendido-por=exito&category-1=moda-y-accesorios&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Juguetes y juegos',
            value: {
            nombre: 'Juguetes y juegos',
            link: 'https://www.exito.com/juguetes-y-juegos?vendido-por=exito&category-1=juguetes-y-juegos&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Jardín y aire libre',
            value: {
            nombre: 'Jardín y aire libre',
            link: 'https://www.exito.com/jardin-y-aire-libre?vendido-por=exito&category-1=jardin-y-aire-libre&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'deportes y fitness',
            value: {
            nombre: 'deportes y fitness',
            link: 'https://www.exito.com/deportes-y-fitness?vendido-por=exito&category-1=deportes-y-fitness&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Herramientas y ferretería',
            value: {
            nombre: 'Herramientas y ferretería',
            link: 'https://www.exito.com/herramientas-y-ferreteria?vendido-por=exito&category-1=herramientas-y-ferreteria&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        },
        {
            name: 'Papelería y libros',
            value: {
            nombre: 'Papelería y libros',
            link: 'https://www.exito.com/papeleria-y-libros?vendido-por=exito&category-1=papeleria-y-libros&facets=vendido-por%2Ccategory-1&sort=discount_desc&page='
            }
        }
    ];


    const respuestas = await inquirer.prompt([
        {
        type: 'list',
        name: 'categoria',
        message: '📦 Selecciona una categoría:',
        choices: categoriasDisponibles
        },
        {
        type: 'number',
        name: 'descuentoMinimo',
        message: '💸 ¿Descuento mínimo que deseas filtrar? (ej: 50)',
        default: 50
        },
        {
        type: 'number',
        name: 'maxPaginas',
        message: '📄 ¿Cuántas páginas quieres revisar?',
        default: 4
        }
    ]);

    const { categoria, descuentoMinimo, maxPaginas } = respuestas;
    const { nombre, link } = categoria;
    const baseUrl = link;


    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const productosTotales = [];

    
    const progressBar = new cliProgress.SingleBar({
        format: '🚀 Progreso |{bar}| {percentage}% | Página {value}/{total}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });

    progressBar.start(maxPaginas, 0);

    for (let currentPage = 0; currentPage < maxPaginas; currentPage++) {
        const url = `${baseUrl}${currentPage}`;
        await page.goto(url, { waitUntil: 'networkidle2' });

        const productos = await page.evaluate((descuentoMinimo) => {
        const resultados = [];
        const grid = document.querySelector('.product-grid_fs-product-grid___qKN2');
        if (!grid) return resultados;

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
            const enlace = item.querySelector('a[data-testid="product-link"]')?.href;

            resultados.push({
                titulo,
                marca,
                descuento: `${descuento}%`,
                precioOriginal,
                precioConDescuento,
                enlace: enlace?.startsWith('http') ? enlace : `https://www.exito.com${enlace}`
            });
            }
        });

        return resultados;
        }, descuentoMinimo);

        productosTotales.push(...productos);
        progressBar.increment();
    }

    progressBar.stop();

    const fileName = `cat_${nombre}.json`;
    fs.writeFileSync(fileName, JSON.stringify(productosTotales, null, 2));

    console.log(`✅ Total productos encontrados con descuento ≥ ${descuentoMinimo}%: ${productosTotales.length}`);
    console.log(`📁 Resultados guardados en ${fileName}`);

    await browser.close();
})();
