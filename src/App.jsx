import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const generateSessionId = () => Math.random().toString(36).substring(7);

function App() {
  const [sessionId] = useState(generateSessionId());
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setUploadStatus("📄 Ready to upload: " + selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("⚠️ Please select a PDF file first");
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);

    setUploadStatus("⏳ Uploading & Processing PDF...");
    try {
      await axios.post(`http://localhost:8000/upload?session_id=${sessionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus("✅ PDF processed successfully! You can now ask questions.");
    } catch (error) {
      console.error(error);
      setUploadStatus("❌ Upload failed. Please try again.");
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: 'user', content: question };
    setChatHistory(prev => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/chat", {
        question: userMessage.content,
        session_id: sessionId
      });

      const botMessage = { 
        role: 'bot', 
        content: response.data.answer, 
        sources: response.data.sources 
      };
      setChatHistory(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { 
        role: 'bot', 
        content: "I apologize, but I encountered an error. Please ensure a PDF is uploaded first and try again." 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = () => {
    if (uploadStatus.includes("✅")) return "success";
    if (uploadStatus.includes("❌") || uploadStatus.includes("⚠️")) return "error";
    if (uploadStatus.includes("⏳")) return "uploading";
    return "";
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Cognitive RAG Assistant</h1>
        <div className="session-badge">
          Session ID: {sessionId}
        </div>
      </header>

      <div className="upload-section">
        <div className="file-input-wrapper">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange}
          />
        </div>
        <button 
          className="upload-button"
          onClick={handleUpload} 
          disabled={!file}
        >
          Process Document
        </button>
        {uploadStatus && (
          <div className={`status-indicator ${getStatusClass()}`}>
            {uploadStatus}
          </div>
        )}
      </div>

      <div className="chat-window">
        <div className="messages">
          {chatHistory.length === 0 && !isLoading ? (
            <div className="welcome-message">
              <div className="bubble">
                <h3>👋 Welcome to Smart RAG Assistant!</h3>
                <p>Upload a PDF document to start asking questions about its content.</p>
                <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                  <li>📄 Upload any PDF document</li>
                  <li>❓ Ask questions about its content</li>
                  <li>🔍 Get AI-powered answers with source references</li>
                </ul>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="bubble">
                  <p>{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <small className="sources">
                      📚 Sources: {msg.sources.join(", ")}
                    </small>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message bot">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleChat} className="input-area">
          <div className="input-wrapper">
            <input 
              type="text" 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              placeholder="Ask a question about your document..." 
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            className="send-button"
            disabled={isLoading || !question.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;