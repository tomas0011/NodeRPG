import axios from 'axios';
import { CommandResponse, ErrorResponse } from '../api/tipos';

export class RequestManager {
    private static requestManager: RequestManager | null = null
    // URL del backend por variable de entorno (CRA inyecta REACT_APP_* en build).
    // En Vercel se setea REACT_APP_API_URL = URL del backend en Render; en dev local
    // cae a localhost:3001.
    private host = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    public static getInstance(): RequestManager {
        if (!RequestManager.requestManager) {
            RequestManager.requestManager = new RequestManager();
        }
        return RequestManager.requestManager
    }

    /**
     * Obtiene el sessionId persistido en localStorage; si no existe, genera uno
     * (UUID) y lo guarda. Identifica al jugador entre peticiones y reinicios.
     */
    private getSessionId(): string {
        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            localStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    /** Re-sincroniza el sessionId si el backend devolvió uno (lo persiste). */
    private sincronizarSessionId(sessionId?: string): void {
        if (sessionId && sessionId !== localStorage.getItem('sessionId')) {
            localStorage.setItem('sessionId', sessionId);
        }
    }

    /**
     * Envía un comando y devuelve la respuesta tipada del backend (async/await).
     * Es la vía que usa la UI nueva; re-sincroniza el sessionId si el servidor
     * generó/cambió el suyo. Ante error de red, devuelve una respuesta de error
     * coherente con el contrato para que el GameContext la pueda mostrar.
     */
    public async enviar(command: string): Promise<CommandResponse> {
        const sessionId = this.getSessionId();
        try {
            const { data } = await axios.get<CommandResponse>(
                `${this.host}/command?command=${encodeURIComponent(command)}&sessionId=${encodeURIComponent(sessionId)}`
            );
            this.sincronizarSessionId(data.sessionId);
            return data;
        } catch (error) {
            // axios 0.27 tipa `response.data` como `{}`; lo refinamos a la forma
            // de error del backend para leer el mensaje sin usar `any`.
            let mensaje = 'No se pudo contactar al servidor.';
            if (axios.isAxiosError(error) && error.response) {
                const cuerpo = error.response.data as ErrorResponse | undefined;
                if (cuerpo && typeof cuerpo.error === 'string') {
                    mensaje = cuerpo.error;
                }
            }
            return {
                command,
                sessionId,
                content: mensaje,
                ok: false,
                enHub: true,
                data: undefined,
                completions: {}
            };
        }
    }

    /**
     * Variante con callback (compat con la consola original). Reutiliza `enviar`.
     */
    public async getCommand(
        command: string,
        responseTrigger: (respuesta: CommandResponse) => void
    ): Promise<void> {
        const respuesta = await this.enviar(command);
        responseTrigger(respuesta);
    }
}
