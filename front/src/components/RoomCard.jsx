import React from 'react';


const RoomCard = ({ text, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="control-button">
            {text}
        </div>
    );
}

const Controls = ({ rooms }) => {
    return (
        <React.Fragment>

            {buttonsCodes.map((e) => {
                return <ControlButton
                    key={e.id}
                    text={e.caption}
                    ico={e.ico}
                    onClick={() => onAction(e.id)}

                />

            })


            }
        </React.Fragment>



    );
};
export default RoomCard;
