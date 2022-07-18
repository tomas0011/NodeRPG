// import './ConsoleInput.css';

import { useState } from "react";
import { RequestManager } from "../../utils/RequestManager";

export function ConsoleInput(params: { setCommandResponseAction: any }) {
    const [inputValue, setInputValue] = useState('')

    function handlerOnChange(event: any) {
        setInputValue(event.target.value)
    }

    function responseTrigger(response: any) {
        params.setCommandResponseAction({
            command: response.command,
            content: response.content
        })
    }

    function handlerOnSubmit(event: any) {
        event.preventDefault()
        if (inputValue === 'clear') {
            responseTrigger({
                command: 'clear',
                content: ''
            })
        } else {
            RequestManager.getInstance().get(`/command?command=${inputValue}`, responseTrigger)
        }
        setInputValue('')
    }

    return (
      <form className="consoleInput" onSubmit={handlerOnSubmit}>
        <input type="text" value={inputValue} onChange={handlerOnChange} />
      </form>
    );
}

export default ConsoleInput;
