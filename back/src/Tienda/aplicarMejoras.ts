import CatalogoMejoras from './CatalogoMejoras';
import { ConfigInicial, configInicialBase } from './ConfigInicial';

/**
 * Construye la `ConfigInicial` del personaje aplicando, en orden, los
 * aplicadores de cada mejora del perfil (`profile.mejoras`). Aquí se hace
 * **efectiva la meta-progresión**: comprar una mejora en el hub sólo guardó su
 * id; este paso (invocado al `crear` una run) materializa su efecto sobre los
 * stats/inventario iniciales.
 *
 * - **Determinista**: misma lista ⇒ misma config.
 * - **Tolerante**: un id que no exista en el catálogo (dato viejo) se ignora
 *   sin romper. Las mejoras acumulables apiladas (repetidas en el array)
 *   apilan su efecto.
 */
export default function aplicarMejoras(mejoras: string[]): ConfigInicial {
    const config = configInicialBase();
    for (const id of mejoras) {
        const mejora = CatalogoMejoras.obtener(id);
        if (mejora) {
            mejora.aplicador(config);
        }
    }
    return config;
}
