// import './consoleOutput.css';

import { useState } from "react";
import CommandResponse from "../commandResponse/commandResponse";

function ConsoleOutput() {
    const [commandResponses, setCommandResponses] = useState([{
        content: '1'
    },{
        content: '2'
    },{
        content: '3'
    },{
        content: '4'
    },{
        content: '5'
    },{
        content: '6'
    },{
        content: '7'
    }])

    return (
      <div className="ConsoleOutput">
        {commandResponses.map((commandResponse) => {
            return <CommandResponse commandResponse={commandResponse}/>
        })}
      </div>
    );
}

export default ConsoleOutput;
  