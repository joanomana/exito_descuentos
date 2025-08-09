const conectarDB = require('./src/data/db');
const scrapeCategoria = require('./src/scraper');
const Producto = require('./src/models/producto');
const categoriasDisponibles = require('./src/data/categorias');


const DESCUENTO_MINIMO = 70;
const MAX_PAGINAS = 50;
const CORRIDAS_POR_CATEGORIA = 2;


const parsePrecio = (s) => {
    if (!s) return null;
    const onlyDigits = String(s).replace(/[^\d]/g, '');
    if (!onlyDigits) return null;
    return Number(onlyDigits); 
};

const ejecutarScraper = async () => {
    const runTag = new Date(); 

    try {
        await conectarDB();
        console.log('🔗 Conectado a MongoDB');

        for (const categoria of categoriasDisponibles) {
        console.log(`\n📦 Procesando categoría: ${categoria.name}`);
        let erroresEnCategoria = 0;

        const productosCategoria = [];

        for (let i = 0; i < CORRIDAS_POR_CATEGORIA; i++) {
            try {
            const productos = await scrapeCategoria(categoria, DESCUENTO_MINIMO, MAX_PAGINAS);

            console.log(`🧪 [${categoria.name}] corrida ${i + 1}: productos obtenidos = ${productos.length}`);

            if (!productos.length) {
                erroresEnCategoria++;
                console.warn(`⚠️ No se encontraron productos en ${categoria.name} (corrida ${i + 1})`);
            } else {
                productosCategoria.push(...productos);
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

        const mapa = new Map();
        for (const p of productosCategoria) {
            if (!p?.enlace) continue;

            mapa.set(p.enlace, p);
        }
        const productosUnicos = Array.from(mapa.values());

        console.log(`📊 [${categoria.name}] únicos antes de escribir: ${ productosUnicos.length }`);

        if (productosUnicos.length) {
            const ops = productosUnicos.map((p) => {
                const precioConDescuentoNum = parsePrecio(p.precioConDescuento);
                const precioOriginalNum = parsePrecio(p.precioOriginal);
                const descuentoNum = p.descuento ? parseInt(String(p.descuento).replace(/[^\d]/g, '')) : null;

                return {
                    updateOne: {
                        filter: { enlace: p.enlace },
                        update: {
                            $set: {
                                titulo: p.titulo,
                                marca: p.marca ?? null,
                                descuento: p.descuento ?? null,
                                descuentoNum,
                                precioOriginal: p.precioOriginal ?? null,
                                precioOriginalNum,
                                precioConDescuento: p.precioConDescuento ?? null,
                                precioConDescuentoNum,
                                precioAliado: p.precioAliado ?? null,
                                categoria: p.categoria,                 
                                enlace: p.enlace,
                                lastSeenAt: runTag,                     
                                timestamp: new Date(),                 
                            },
                            $setOnInsert: {
                                creadoEn: new Date(),
                            }
                        },
                        upsert: true
                    }
                };
            });

            try {
                const res = await Producto.bulkWrite(ops, { ordered: false });
                console.log(
                    `✅ [${categoria.name}] upserted: ${res.upsertedCount || 0}, matched: ${res.matchedCount || 0}, modified: ${res.modifiedCount || 0}`
                );
            } catch (e) {
                console.error(`❌ Error en bulkWrite (${categoria.name}):`, e.message);
            }
        }

        console.log(`🏁 [${categoria.name}] categoría completada.\n`);
        }

        console.log('🎉 Scraping completado para todas las categorías.');


    } catch (err) {
        console.error('❌ Error general:', err.message);
    } finally {
        process.exit();
    }
};

ejecutarScraper();
