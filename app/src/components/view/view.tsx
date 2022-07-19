// import './view.css';

import ConsoleOutput from "../consoleOutput/consoleOuput";
import ConsoleInput from "../consoleInput/consoleInput";
import { useState } from "react";

function View() {
    const [commandResponseAction, setCommandResponseAction] = useState(null)

    return (
        <div className="View">
            <ConsoleOutput commandResponseAction={commandResponseAction} setCommandResponseAction={setCommandResponseAction}/>
            <ConsoleInput setCommandResponseAction={setCommandResponseAction}/>
        </div>
    );
}

export default View;
