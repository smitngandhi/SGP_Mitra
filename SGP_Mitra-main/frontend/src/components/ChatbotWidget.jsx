import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I’m Mitra. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", text: input }]);
    setInput("");
    // Integrate Flask API call here for bot response
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating blob button */}
      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#965ec7] to-[#7a3fa9] shadow-xl flex items-center justify-center text-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle size={26} />
        </motion.button>
      )}

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-80 h-96 bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#965ec7] to-[#7a3fa9] text-white px-4 py-3 flex justify-between items-center">
              <h2 className="font-semibold text-white">Mitra Chat</h2>
              <button onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg max-w-[75%] ${
                    msg.sender === "user"
                      ? "bg-purple-100 text-purple-900 self-end ml-auto"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button
                onClick={sendMessage}
                className="px-3 py-2 bg-gradient-to-r from-[#965ec7] to-[#7a3fa9] text-white rounded-lg hover:opacity-90"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
