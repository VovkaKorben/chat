import React from 'react';



const RoomCards = ({ rooms, activeRoom, handleRoomDelete, handleRoomChange }) => {
    return (

        rooms.map((r) => {
            return <div
                key={r.id}
                onClick={() => handleRoomChange(r.id)}
                className={`room-card ${activeRoom === r.id ? 'selected' : ''}`}
            >
                {r.name}
                <div onClick={() => { handleRoomDelete(r.id) }}
                    className='room-delete'>X</div>
            </div>

        })

    );
};
export default RoomCards;
