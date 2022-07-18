// import './consoleOutput.css';

import { useEffect, useState } from "react";
import CommandResponse from "../commandResponse/commandResponse";

function ConsoleOutput(params: { commandResponseAction: any }) {
    const [commandResponses, setCommandResponses] = useState([{
        content: 'burned example'
    },{
        content: 'burned example 2'
    }])

    useEffect(() => {
        console.log(params.commandResponseAction)
        if(params.commandResponseAction) {
            setCommandResponses([
                ...commandResponses,
                params.commandResponseAction
            ])
        }
    }, [params.commandResponseAction])

    return (
      <div className="ConsoleOutput">
        {commandResponses.map((commandResponse) => {
            return <CommandResponse commandResponse={commandResponse}/>
        })}
      </div>
    );
}

export default ConsoleOutput;
