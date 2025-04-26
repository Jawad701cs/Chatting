import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './Messsage.css';
import { FaPaperclip } from "react-icons/fa";

const socket = io('http://localhost:4000');

function Message() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [roomId, setRoom] = useState("");
  const [bold, setBold] = useState(false);
  const [symbol, setsymbol] = useState("");
  const [isRecording, setisRecording] = useState(false);
  const [hasRoom, sethasRoom] = useState(false);
  const [play, setplay] = useState(false);
  const [image, setImage] = useState(null);
  const [image_name, setname] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sendMessage = () => {
    if (!hasRoom) {
      alert("First Create or Join a Room");
      setImage(null);
      setname("");
      setText("");
      return;
    }

    if (text.trim()) {
      socket.emit("chat_message", { message: text, sym: symbol });
      setMessages(prev => [...prev, { text, type: 'sent', sym: "you" }]);
      setText("");
    }

    if (image) {
      setname("");
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onloadend = () => {
        const base64Image = reader.result;
        socket.emit("image_message", { image: base64Image, sym: symbol });
        setMessages(prev => [
          ...prev,
          { image: base64Image, sym: "you", type: "sent" }
        ]);
        setImage(null); // Clear selected image
      };
    }
  };

  useEffect(() => {
    const handlePrivateMessage = (data) => {
      if (data.audio) {
        setMessages(prev => [...prev, { audio: data.audio, sym: data.sym, type: "received" }]);
      } else if (data.image) {
        setMessages(prev => [...prev, { image: data.image, sym: data.sym, type: "received" }]);
      } else {
        setMessages(prev => [...prev, { text: data.msg.message, sym: data.msg.sym, type: "received" }]);
      }
    };

    socket.on("private", handlePrivateMessage);
    return () => {
      socket.off("private", handlePrivateMessage);
    };
  }, []);

  const joinRoom = () => {
    if (roomId.trim() && !bold) {
      if (symbol.length >= 3 && roomId.length >= 5) {
        socket.emit("join_room", roomId);
        setBold(true);
        sethasRoom(true);
      }
      else {
        setsymbol("");
        setRoom("");
        alert("Name has minimum 3 lenght required, Room Id has minimum 5 lehthn required");

      }
    }
    
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result;
        socket.emit("voice_message", { audio: base64Audio, sym: symbol });
        setMessages(prev => [...prev, { audio: base64Audio, sym: "you", type: 'sent' }]);
      };
    };

    mediaRecorderRef.current.start();
    setisRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setisRecording(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const fileChange = (e) => {
    setImage(e.target.files[0]);
    setname(e.target.files[0].name);
  };

  return (
    <div className="container">
      <h2 className="title">Say GoodBye</h2>
      <div style={{ display: "flex" }}>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoom(e.target.value)}
          disabled={bold}
          className={`room-input ${bold ? "bold" : ""}`}
          required
        />

        <input
          type="text"
          placeholder="Enter Name"
          value={symbol}
          onChange={(e) => setsymbol(e.target.value)}
          disabled={bold}
          className={`room-input ${bold ? "bold" : ""}`}
          style={{ marginLeft: "3px" }}
          required
        />
      </div>

      <button className="button" onClick={joinRoom}>Join Room</button>
      <br /><br />

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.text && <p style={{
              background: msg.type === "received" ? "skyblue" : "blue",
              borderRadius: msg.type === "received" ? "5px" : "5px",
              color: msg.type === "received" ? "#333" : "white",
              borderBottomLeftRadius: msg.type === "received" ? "15px" : "15px",
              padding: msg.type === "received" ? "10px" : "10px"
            }}><b>{msg.sym}:</b> {msg.text}</p>}
            {msg.audio && (
              <p><b>{msg.sym}:</b> <audio style={{ background: msg.type === "sent" ? "blue" : "skyblue" }} controls src={msg.audio}></audio></p>
            )}
            {msg.image && (
              <p style={{ background: "white" }}><b>{msg.sym}:</b><br /><img src={msg.image} alt="sent" style={{ maxWidth: "100%", maxHeight: "", boxShadow: "inherit", border: "5px solid black" }} /></p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />

      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          type="file"
          accept="image/*"
          onChange={fileChange}
          style={{ display: "none" }}
          ref={fileInputRef}
        />
        <FaPaperclip
          size={22}
          style={{ marginRight: "5px", cursor: "pointer" }}
          onClick={handleClick}
        /> {image_name && <p>{image_name}</p>}
        <input
          type="text"
          placeholder="Type your message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input"
          style={{ marginLeft: image_name ? "5px" : "none" }}
        />
      </div>

      <div style={{ display: 'flex' }}>
        <button onClick={sendMessage} className="button">Send</button>
        <button className="button" style={{ marginLeft: "5px" }} onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
    </div>
  );
}

export default Message;
