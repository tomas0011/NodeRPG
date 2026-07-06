import { RunModel } from '../src/Persistence/mongo';
import { normalizar } from '../src/Persistence/MongoRunRepository';
import { RunDTO, SCHEMA_VERSION } from '../src/Persistence/dtos';

/**
 * Regresión del bug de persistencia del delta por sala: el modo `strict` de
 * Mongoose descartaba `escenario.estadoMutablePorSala` al guardar (el campo no
 * estaba declarado en `EscenarioSchema`) y `normalizar()` lo descartaba al
 * cargar. Ambos caminos se ejercitan acá SIN conexión a Mongo: instanciar un
 * documento aplica el casting del schema, y `normalizar` es una función pura.
 */

function dtoConDelta(): RunDTO {
    return {
        runId: 'run-delta',
        sessionId: 'sesion-delta',
        schemaVersion: SCHEMA_VERSION,
        semilla: 42,
        plataAcumulada: 0,
        jugador: {
            nombre: 'Tomas',
            vidaMaxima: 10,
            vidaActual: 10,
            destreza: 1,
            oro: 0,
            xp: 0,
            nivel: 1,
            inventario: ['espada'],
            equipados: []
        },
        escenario: {
            lugarId: 'bar',
            salasVisitadas: ['bar'],
            estadoMutablePorSala: {
                bar: {
                    objetosTomados: ['espada'],
                    objetosAgregadosAlSuelo: ['martillo'],
                    ocupantesEliminados: ['cantinero']
                }
            }
        }
    };
}

describe('Schema de Mongo: estadoMutablePorSala', () => {
    it('el casting del RunModel conserva escenario.estadoMutablePorSala', () => {
        const doc = new RunModel(dtoConDelta());
        const objeto = doc.toObject();

        expect(objeto.escenario.estadoMutablePorSala).toEqual({
            bar: {
                objetosTomados: ['espada'],
                objetosAgregadosAlSuelo: ['martillo'],
                ocupantesEliminados: ['cantinero']
            }
        });
    });

    it('el casting del RunModel no rompe docs sin el campo (runs viejas)', () => {
        const dto = dtoConDelta();
        delete dto.escenario.estadoMutablePorSala;
        const doc = new RunModel(dto);
        const objeto = doc.toObject();

        // El default del schema es {}: nunca undefined que rompa al mapper.
        expect(objeto.escenario.estadoMutablePorSala || {}).toEqual({});
    });
});

describe('normalizar() de MongoRunRepository: estadoMutablePorSala', () => {
    it('preserva el delta por sala al cargar', () => {
        const resultado = normalizar(dtoConDelta());

        expect(resultado.escenario.estadoMutablePorSala).toEqual({
            bar: {
                objetosTomados: ['espada'],
                objetosAgregadosAlSuelo: ['martillo'],
                ocupantesEliminados: ['cantinero']
            }
        });
    });

    it('un doc viejo sin el campo cae a {} tolerante', () => {
        const dto = dtoConDelta();
        delete dto.escenario.estadoMutablePorSala;

        const resultado = normalizar(dto);
        expect(resultado.escenario.estadoMutablePorSala).toEqual({});
    });

    it('un delta malformado se sanea campo a campo', () => {
        const dto = dtoConDelta();
        dto.escenario.estadoMutablePorSala = {
            bar: { objetosTomados: ['espada'] }
        } as never;

        const resultado = normalizar(dto);
        expect(resultado.escenario.estadoMutablePorSala).toEqual({
            bar: {
                objetosTomados: ['espada'],
                objetosAgregadosAlSuelo: [],
                ocupantesEliminados: []
            }
        });
    });
});
