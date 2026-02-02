import { useState } from 'react'
import './assets/css/App.css'

function App() {
  const [rooms, setRooms] = useState([])

  return (
    <>
      <div className="rooms"></div>
      <div className="messages"></div>
      <div className="user-name">1</div>
      <div className="user-name-input">2</div>
      <div className="message-label"></div>
      <div className="message-input"></div>

    </>
  )
}

export default App
