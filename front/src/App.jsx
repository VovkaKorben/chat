import { io } from 'socket.io-client';
import { useState, useEffect } from 'react'
import './assets/css/App.css'
import RoomCards from './components/RoomCards.jsx'
import ChatHistory from './components/ChatHistory.jsx'


const LS_USERNAME = 'userName';
const LS_ROOMNAME = 'roomName';

const API_PORT = 3000;
const socket = io(`http://localhost:${API_PORT}`);
const API_URL = `http://localhost:${API_PORT}/api/`;

function App() {
  const [newRoomName, setNewRoomName] = useState(localStorage.getItem(LS_ROOMNAME) || 'New Room');
  useEffect(() => { localStorage.setItem(LS_ROOMNAME, newRoomName); }, [newRoomName]);

  const [userName, setUserName] = useState(localStorage.getItem(LS_USERNAME) || 'anonymous');
  useEffect(() => { localStorage.setItem(LS_USERNAME, userName); }, [userName]);

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getRooms = async () => {
      const resp = await fetch(`${API_URL}rooms`);
      const result = await resp.json();
      setRooms(result);
    }
    getRooms();
  }, []);



  const sendMessage = async () => {

    if (activeRoom && message.trim()) {
      const messageData = {
        roomId: activeRoom,
        user: userName,
        message: message,
      };
      socket.emit('send_message', messageData);
      setMessage('');
    }
  }


  const readRoomMessages = async (roomId) => {

    const resp = await fetch(`${API_URL}chat/${roomId}`);
    return await resp.json();
  }

  useEffect(() => {
    if (!activeRoom) return;

    // 2. Создаем асинхронную обертку
    const loadData = async () => {
      try {
        const data = await readRoomMessages(activeRoom);
        setHistory(data); // Загружаем историю из базы [cite: 17]
      } catch (err) {
        console.error("Ошибка загрузки истории:", err);
      }
    };

    loadData();
    socket.emit('join_room', activeRoom);

    // Слушаем входящие сообщения
    socket.on('receive_message', (data) => {
      setHistory((prev) => [...prev, data]);
    });

    return () => socket.off('receive_message'); // Чистим слушатель при размонтировании
  }, [activeRoom]);


  const handleRoomDelete = async (roomId) => {
    const resp = await fetch(`${API_URL}rooms`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId: roomId })
    });
    const result = await resp.json();
    if (resp.status === 200) {
      setRooms(prev => prev.filter((e) => e.id !== result.id));
      if (result.id === activeRoom) {
        setActiveRoom(null);
        setHistory([]);
      }
    }
  }

  const handleRoomCreate = async () => {
    const resp = await fetch(`${API_URL}rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newRoomName })
    });
    const result = await resp.json();
    if (resp.status === 201) {
      setRooms(prev =>
        [...prev,
          result
        ]
      )

      setActiveRoom(result.id);
    }
  }
  const handleRoomChange = async (roomId) => {
    setActiveRoom(roomId);
  }

  return (
    <>
      <div className="create-room-input">
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}


        />
      </div>
      <div className="create-room-button">
        <button
          onClick={handleRoomCreate}
        >create room </button >
      </div>
      <div className="rooms">
        <RoomCards
          rooms={rooms}
          handleRoomDelete={handleRoomDelete}
          handleRoomChange={handleRoomChange}
          activeRoom={activeRoom}
        /></div>
      <div className="messages">
        <ChatHistory messages={history} />
      </div>
      <div className="user-name frrc">User name</div>
      <div className="user-name-input frlc">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div className="message-label frrc">
        Message
      </div>
      <div className="message-input frlc">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div className="message-send">
        <button
          onClick={sendMessage}
          disabled={!(activeRoom && message.trim())}
        >send</button >
      </div>

    </>
  )
}

export default App
