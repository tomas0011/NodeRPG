import axios from 'axios';

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

    public async getCommand(command: string, responseTrigger: any): Promise<void> {
        try {
            const sessionId = this.getSessionId();
            const { data } = await axios.get(
                `${this.host}/command?command=${command}&sessionId=${encodeURIComponent(sessionId)}`
            )
            responseTrigger(data)
        } catch (error) {
            responseTrigger({
                command,
                content: 'Comando no encontrado'
            })
        }
    }
}
