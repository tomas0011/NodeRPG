// import './commandResponse.css';
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
        <div className="CommandResponse">
            <hr />
            <p onClick={handlerOnClick}>{params.commandResponse.command}</p>
            <p>{params.commandResponse.content}</p>
            <hr />
        </div>
    );
}

export default CommandResponse;
