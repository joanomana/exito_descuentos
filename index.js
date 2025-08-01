const conectarDB = require('./src/data/db');
const scrapeCategoria = require('./src/scraper');
const Producto = require('./src/models/producto');
const categoriasDisponibles = require('./src/data/categorias');

const descuentoMinimo = 70;
const maxPaginas = 50;

const ejecutarScraper = async () => {
    try {
        await conectarDB();

        for (const categoria of categoriasDisponibles) {
            console.log(`\n📦 Procesando categoría: ${categoria.name}`);
            

            for (let i = 0; i < 2; i++) {
                console.log(`🔁 Corrida ${i + 1}/2`);

                const productos = await scrapeCategoria(categoria, descuentoMinimo, maxPaginas);
                console.log(`🧪 Total productos devueltos por el scraper: ${productos.length}`);
                console.log('📋 Ejemplo de producto:', productos[0]);


                if (!productos || productos.length === 0) {
                    console.log(`⚠️ No se encontraron productos en "${categoria.name}" en la corrida ${i + 1}`);
                    continue;
                }

                try {
                    const resultado = await Producto.insertMany(productos, { ordered: false });
                    console.log(`✅ Insertados ${resultado.length} productos nuevos en "${categoria.name}" (corrida ${i + 1})`);
                } catch (error) {
                    if (error.code === 11000 || error.message.includes('duplicate key')) {
                        
                        const insertados = error.insertedDocs?.length || 0;
                        console.warn(`⚠️ Productos duplicados detectados en "${categoria.name}" (corrida ${i + 1}). Insertados: ${insertados}`);
                    } else {
                        console.error(`❌ Error al insertar productos en "${categoria.name}":`, error.message);
                    }
                }
            }
        }
        
        console.log('\n🏁 Scraping finalizado y guardado en MongoDB.\n');
    } catch (error) {
        console.error('❌ Error al ejecutar el scraper:', error.message);
    }

};

ejecutarScraper();
