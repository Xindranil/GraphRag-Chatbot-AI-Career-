import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Chat } from '../types';

interface ChatHistoryProps {
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ chats, currentChat, setCurrentChat }) => {
  return (
    <div className="overflow-y-auto h-full">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`flex items-center p-3 cursor-pointer hover:bg-gray-700 ${
            currentChat?.id === chat.id ? 'bg-gray-700' : ''
          }`}
          onClick={() => setCurrentChat(chat)}
        >
          <MessageCircle size={20} className="mr-2" />
          <span className="truncate">
            {chat.messages.length > 0
              ? chat.messages[0].content.substring(0, 30) + '...'
              : 'New Chat'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory;