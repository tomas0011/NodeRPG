import React from 'react';
import './commandResponse.css';

function CommandResponse(params: { commandResponse: any }) {
    return (
        <div className='CommandResponse'>
            <p>{params.commandResponse.command}</p>
            <p>{params.commandResponse.content}</p>
        </div>        
    );
}

export default CommandResponse;
