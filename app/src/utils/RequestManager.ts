import axios from 'axios';

export class RequestManager {
    private static requestManager: RequestManager | null = null
    private host = 'http://localhost:3001';

    public static getInstance(): RequestManager {
        if (!RequestManager.requestManager) {
            RequestManager.requestManager = new RequestManager();
        }
        return RequestManager.requestManager
    }

    public async getCommand(command: string, responseTrigger: any): Promise<void> {
        try {
            const { data } = await axios.get(`${this.host}/command?command=${command}`)
            responseTrigger(data)
        } catch (error) {
            responseTrigger({
                command,
                content: 'Comando no encontrado'
            })
        }
    }
}
