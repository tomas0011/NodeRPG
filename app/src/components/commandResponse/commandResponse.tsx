// import './commandResponse.css';

function CommandResponse(params: { commandResponse: any }) {
    return (
        <div className="CommandResponse">
            <h1>{'> '}{params.commandResponse.content}</h1>
        </div>
    );
}

export default CommandResponse;
