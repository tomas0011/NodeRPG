import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import CurvaDeNivel from '../../Personaje/CurvaDeNivel';
import { seccion } from '../formato';
import IComando from '../IComando';

class GetStatus implements IComando {
    getKey() {
        return 'status'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    getUso(): string {
        return 'status';
    }

    getDescripcion(): string {
        return 'Muestra tu estado actual: vida, nivel, oro, equipo y estadísticas.';
    }

    ejecutar(_agente: string, state: GameState): CommandResult {
        const jugador = state.jugador;
        // Vista separada: lo equipado sale del inventario visible y vuelve al
        // desequipar. El objeto sigue viviendo en el inventario base.
        const inventarioVisible = state.objetosDisponibles().map((objeto) => objeto.getNombre());
        const equipados = state.objetosEquipados().map((objeto) => objeto.getNombre());
        // XP/nivel de la run (efímeros; 3i). Se leen por getter (no campo crudo):
        // un jugador decorado reenvía al base. xpParaSiguiente desde la curva única.
        const nivel = jugador.getNivel();
        const xp = jugador.getXpActual();
        const xpParaSiguiente = CurvaDeNivel.xpParaSiguiente(nivel);
        const lineas = [
            `Nombre: ${jugador.getNombre()}`,
            `Nivel: ${nivel}`,
            `XP: ${xp}/${xpParaSiguiente}`,
            `Vida: ${jugador.getVidaActual()}/${jugador.getVidaMaxima()}`,
            `Clase de armadura: ${jugador.claseDeArmadura()}`,
            `Dado de golpe: ${jugador.dadoDeGolpe()}`,
            `Oro: ${jugador.getOro()}`,
            ...seccion('Equipado', equipados, 'nada'),
            ...seccion('Inventario', inventarioVisible, 'vacío')
        ];
        return {
            ok: true,
            message: lineas.join('\n'),
            data: {
                nombre: jugador.getNombre(),
                // Nivel y XP de la run (efímeros; NO van al perfil). xpParaSiguiente
                // sale de la curva única (CurvaDeNivel), sin números mágicos aquí.
                nivel,
                xp,
                xpParaSiguiente,
                vidaActual: jugador.getVidaActual(),
                vidaMaxima: jugador.getVidaMaxima(),
                claseDeArmadura: jugador.claseDeArmadura(),
                dadoDeGolpe: jugador.dadoDeGolpe(),
                // Oro de la run (efímero; se pierde al cerrar). La plata del
                // perfil se consulta en el hub (comando `perfil`).
                oro: jugador.getOro(),
                inventario: inventarioVisible,
                equipados
            }
        };
    }

}

export default GetStatus;
