const conectarDB = require('./src/data/db');
const scrapeCategoria = require('./src/scraper');
const Producto = require('./src/models/producto');
const categoriasDisponibles = require('./src/data/categorias');

const descuentoMinimo = 70;
const maxPaginas = 50;

const ejecutarScraper = async () => {
    try {
        await conectarDB();
        console.log('🔗 Conectado a MongoDB');

        const todosLosProductos = [];

        for (const categoria of categoriasDisponibles) {
        console.log(`\n📦 Procesando categoría: ${categoria.name}`);
        let erroresEnCategoria = 0;

        for (let i = 0; i < 2; i++) {
            try {
            const productos = await scrapeCategoria(categoria, descuentoMinimo, maxPaginas);

            console.log(`🧪 Productos obtenidos: ${productos.length}`);

            if (!productos.length) {
                erroresEnCategoria++;
                console.warn(`⚠️ No se encontraron productos en ${categoria.name} (corrida ${i + 1})`);
            } else {
                todosLosProductos.push(...productos);
            }

            if (erroresEnCategoria >= 3) {
                console.error(`❌ Más de 3 fallos en ${categoria.name}. Pasando a la siguiente categoría.`);
                break;
            }
            } catch (err) {
            erroresEnCategoria++;
            console.error(`🚨 Error al procesar ${categoria.name}:`, err.message);
            }
        }
        }

        console.log(`\n📊 Total de productos únicos antes de insertar: ${todosLosProductos.length}`);

        const claveUnica = p => `${p.titulo}-${p.precioConDescuento}`;
        const productosFiltrados = Object.values(
        todosLosProductos.reduce((acc, prod) => {
            const clave = claveUnica(prod);
            acc[clave] = prod;
            return acc;
        }, {})
        );

        console.log(`🧼 Después de eliminar duplicados: ${productosFiltrados.length}`);

        try {
        const resultado = await Producto.insertMany(productosFiltrados, { ordered: false });
        console.log(`✅ Insertados correctamente ${resultado.length} productos nuevos`);
        } catch (error) {
        if (error.code === 11000 || error.message.includes('duplicate key')) {
            const insertados = error.insertedDocs?.length || 0;
            console.warn(`⚠️ Algunos productos ya estaban en la base. Insertados: ${insertados}`);
        } else {
            console.error(`❌ Error insertando productos en MongoDB:`, error.message);
        }
        }

        console.log('\n🏁 Scraping completado.\n');
    } catch (err) {
        console.error('❌ Error general:', err.message);
    } finally {
        process.exit();
    }
};

ejecutarScraper();
