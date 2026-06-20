import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import CurvaDeNivel from '../../Personaje/CurvaDeNivel';
import IComando from '../IComando';

class GetStatus implements IComando {
    getKey() {
        return 'status'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar(_agente: string, state: GameState): CommandResult {
        const jugador = state.jugador;
        const objetosEncontrados = jugador.getInventario().getObjetos().map((objeto) => objeto.getNombre())
        // XP/nivel de la run (efímeros; 3i). Se leen por getter (no campo crudo):
        // un jugador decorado reenvía al base. xpParaSiguiente desde la curva única.
        const nivel = jugador.getNivel();
        const xp = jugador.getXpActual();
        const xpParaSiguiente = CurvaDeNivel.xpParaSiguiente(nivel);
        const message = `
            Nombre: ${jugador.getNombre()}
            Nivel: ${nivel}
            XP: ${xp}/${xpParaSiguiente}
            Vida: ${jugador.getVidaActual()}/${jugador.getVidaMaxima()}
            Clase de armadura: ${jugador.claseDeArmadura()}
            Dado de golpe: ${jugador.dadoDeGolpe()}
            Oro: ${jugador.getOro()}
            Inventario: ${objetosEncontrados.length ? objetosEncontrados : 'vacio'}
        `;
        return {
            ok: true,
            message,
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
                inventario: objetosEncontrados,
                equipados: state.equipados
            }
        };
    }
}

export default GetStatus;
