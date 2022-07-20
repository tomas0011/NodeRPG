import './consoleOutput.css';

import { useEffect, useState } from "react";
import CommandResponse from "../commandResponse/commandResponse";

function ConsoleOutput(params: { commandResponseAction: any }) {
    const [commandResponses, setCommandResponses] = useState([{
        command: 'Bienvenido',
        content: 'a NodeRPG'
    }])

    useEffect(() => {
        console.log(params.commandResponseAction)
        if(params.commandResponseAction) {
            if (params.commandResponseAction.command === 'clear') {
                setCommandResponses([])
            } else {
                setCommandResponses([
                    ...commandResponses,
                    params.commandResponseAction
                ])
            }
        }
    }, [params.commandResponseAction])

    function handlerOnChange(e: any){
        console.log(e.target)
    }

    return (
      <div className="ConsoleOutput" onChange={handlerOnChange} >
        {commandResponses.map((commandResponse) => {
            return <CommandResponse commandResponse={commandResponse}/>
        })}
      </div>
    );
}

export default ConsoleOutput;
