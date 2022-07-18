export class RequestManager {
    private static requestManager: RequestManager | null = null
    private host = 'http://localhost:3001';

    public static getInstance(): RequestManager {
        if (!RequestManager.requestManager) {
            RequestManager.requestManager = new RequestManager();
        }
        return RequestManager.requestManager
    }

    public get(path: string, responseTrigger: any): void {
        responseTrigger({
            command: path,
            content: 'respuesta del server'
        })
    }
}
