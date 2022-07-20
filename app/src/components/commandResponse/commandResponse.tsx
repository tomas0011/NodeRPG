import './commandResponse.css';
import { RequestManager } from "../../utils/RequestManager";

function CommandResponse(params: { commandResponse: any, setCommandResponseAction: any }) {
    function responseTrigger(response: any) {
        params.setCommandResponseAction({
            command: response.command,
            content: response.content
        })
    }

    function handlerOnClick(e: any) {
        RequestManager.getInstance().getCommand(e.target.innerHTML, responseTrigger)
    }

    return (
        <div className='CommandResponse'>
            <p>{params.commandResponse.command}</p>
            <p>{params.commandResponse.content}</p>
        </div>        
    );
}

export default CommandResponse;
