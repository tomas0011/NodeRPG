export class RequestManager {
    private static requestManager: RequestManager | null = null

    public static getInstance(): RequestManager {
        if (!RequestManager.requestManager) {
            RequestManager.requestManager = new RequestManager();
        }
        return RequestManager.requestManager
    }
}
