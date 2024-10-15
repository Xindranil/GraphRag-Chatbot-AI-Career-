import React, { useState, useEffect } from 'react';
import { PlusCircle, Menu, Send, X } from 'lucide-react';
import ChatHistory from './components/ChatHistory';
import ChatWindow from './components/ChatWindow';
import { Chat } from './types';
import { initializeNeo4j, createKnowledgeGraph, getRelevantKnowledge } from './utils/neo4jUtils';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    initializeNeo4j();
  }, []);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      messages: [],
    };
    setChats([...chats, newChat]);
    setCurrentChat(newChat);
  };

  const formatResponse = (response: string): string => {
    // Add line breaks for bullet points and numbered lists
    response = response.replace(/•/g, '\n•');
    response = response.replace(/(\d+\.)/g, '\n$1');

    // Add line breaks for paragraphs
    response = response.replace(/\.\s+(?=[A-Z])/g, '.\n\n');

    return response.trim();
  };

  const sendMessage = async (message: string) => {
    if (!currentChat) return;

    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, { role: 'user', content: message }],
    };

    setCurrentChat(updatedChat);
    setChats(chats.map(chat => chat.id === updatedChat.id ? updatedChat : chat));

    try {
      const relevantKnowledge = await getRelevantKnowledge(message);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: `You are an intelligent, friendly, superhuman career counselor specializing in data and AI careers. You have access to all the information in the world and are fine-tuned to the Indian job market, with a focus on frugality but always aiming for finesse and quality. You offer short, concise, yet actionable advice in a soft tone. Be approachable, but demonstrate your vast knowledge and expertise with every answer. Guide users with practical, implementable suggestions that are relevant to their career growth. Use the following relevant knowledge to enhance your response:\n\n${relevantKnowledge}`,
            },
            ...updatedChat.messages,
          ],
        }),
      });

      const data = await response.json();
      const aiResponse = formatResponse(data.choices[0].message.content);

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, { role: 'assistant', content: aiResponse }],
      };

      setCurrentChat(finalChat);
      setChats(chats.map(chat => chat.id === finalChat.id ? finalChat : chat));

      // Update knowledge graph
      await createKnowledgeGraph(message, aiResponse);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Chat History</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>
        <ChatHistory chats={chats} currentChat={currentChat} setCurrentChat={setCurrentChat} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 p-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-bold">AI Career Advisor</h1>
          <button onClick={createNewChat} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2">
            <PlusCircle size={24} />
          </button>
        </header>
        <ChatWindow currentChat={currentChat} sendMessage={sendMessage} />
      </div>
    </div>
  );
}

export default App;