# Real-Time Chat Application

A simple web application for real-time messaging in different rooms.

## Technologies
* **Frontend**: React (Vite) with `socket.io-client`.
* **Backend**: Node.js and Express.
* **Database**: MongoDB with Mongoose.
* **Real-time**: Socket.io for instant data synchronization.

## Prerequisites
You need a `.env` file in your server directory with the following variables:
* `MONGODB_URI`: Your MongoDB connection string.
* `API_PORT`: The port for your server (default is 3000).

## Installation and Setup

1. **Install dependencies**:
   Run this command in both frontend and backend folders:
   ```bash
   npm install
   ```
2. **Create .env file**
    MONGODB_URI=mongodb+srv://<user>:<password>@skynet.plmo5hs.mongodb.net/?appName=Skynet

3. **Start the Server**:
   Ensure MongoDB is running, then start the API:
   ```bash
   node api.js
   ```

4. **Start the Frontend**:
   ```bash
   npm run dev
   ```

## How to Use

1. **Identity**: Enter your name in the **User name** field. It is automatically saved to `localStorage`.
2. **Rooms**:
   * Create a new room by typing its name and clicking **"create room"**.
   * Click on a room card to switch between active chats.
   * Use the **"X"** button on a room card to delete it.
3. **Messaging**:
   * Selecting a room loads the history from the database.
   * Type your message in the text area and click **"send"**.
   * Messages are displayed in a table with the sender's name and time.

## Database Structure
* **Rooms**: Stores the room name and last update time.
* **Messages**: Stores the room reference, user name, message content, and formatted timestamp.