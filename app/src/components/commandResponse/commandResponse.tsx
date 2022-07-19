import React from 'react';
import './commandResponse.css';

function CommandResponse(params: { commandResponse: any }) {
    return (
        <React.Fragment>
            <div className='CommandResponse'>
                <p>{params.commandResponse.command}</p>
                <p>{params.commandResponse.content}</p>
            </div>
        </React.Fragment>
        
    );
}

export default CommandResponse;
