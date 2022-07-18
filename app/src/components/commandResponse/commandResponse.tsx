// import './commandResponse.css';

function CommandResponse(params: { commandResponse: any }) {
    return (
        <div className="CommandResponse">
            <hr />
            <p>{params.commandResponse.command}</p>
            <p>{params.commandResponse.content}</p>
            <hr />
        </div>
    );
}

export default CommandResponse;
