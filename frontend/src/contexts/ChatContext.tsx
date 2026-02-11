import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  receiver: string;
  message: string;
  messageType: 'text' | 'file' | 'image';
  createdAt: string;
  isRead?: boolean;
}

interface Conversation {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

interface ChatState {
  conversations: Conversation[];
  currentMessages: Message[];
  selectedUser: any;
  chatUsers: any[];
  loading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_SELECTED_USER'; payload: any }
  | { type: 'SET_CHAT_USERS'; payload: any[] }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'MARK_MESSAGES_READ'; payload: string };

const initialState: ChatState = {
  conversations: [],
  currentMessages: [],
  selectedUser: null,
  chatUsers: [],
  loading: false,
  error: null,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_CHAT_USERS':
      return { ...state, chatUsers: action.payload };
    case 'SET_MESSAGES':
      return { ...state, currentMessages: action.payload };
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        currentMessages: [action.payload, ...state.currentMessages] 
      };
    case 'SET_SELECTED_USER':
      return { ...state, selectedUser: action.payload };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv._id === action.payload._id ? action.payload : conv
        )
      };
    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        currentMessages: state.currentMessages.map(msg =>
          msg.sender._id === action.payload ? { ...msg, isRead: true } : msg
        )
      };
    default:
      return state;
  }
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (receiverId: string, message: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (userId: string) => Promise<void>;
  loadChatUsers: () => Promise<void>;
  markAsRead: (userId: string) => Promise<void>;
  selectUser: (user: any) => void;
} | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socket = useSocket();

  // Load conversations on mount and when auth state changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadConversations();
    }
  }, []);

  // Listen for new messages
  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message: Message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
        
        // Update conversations if message is from current selected user
        if (state.selectedUser && message.sender._id === state.selectedUser._id) {
          // Mark as read if we're in the chat
          markAsRead(message.sender._id);
        } else {
          // Update conversation list to show new message - but only if it's a new conversation
          const conversationExists = state.conversations.some(conv => conv.user._id === message.sender._id);
          if (!conversationExists) {
            loadConversations();
          }
        }
      });

      return () => {
        socket.off('newMessage');
      };
    }
  }, [socket, state.selectedUser, state.conversations]);

  // Remove automatic refresh on message changes - let socket handle updates

  const sendMessage = async (receiverId: string, message: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('http://localhost:5000/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ receiverId, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('Message sent:', data);
      
      // Refresh conversations after sending message
      loadConversations();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadConversations = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token available, skipping conversations load');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.log('Token expired, clearing localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      console.log('Conversations API response:', data);
      console.log('Conversations array:', data.conversations);
      console.log('Conversations length:', data.conversations?.length || 0);
      dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`http://localhost:5000/api/chat/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      dispatch({ type: 'SET_MESSAGES', payload: data.messages });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const markAsRead = async (userId: string) => {
    try {
      await fetch(`http://localhost:5000/api/chat/read/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      dispatch({ type: 'MARK_MESSAGES_READ', payload: userId });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const selectUser = (user: any) => {
    dispatch({ type: 'SET_SELECTED_USER', payload: user });
    if (user) {
      loadMessages(user._id);
      markAsRead(user._id);
      // Don't refresh conversations on user selection to avoid unnecessary API calls
    }
  };

  const loadChatUsers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/users/chat-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load chat users: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      dispatch({ type: 'SET_CHAT_USERS', payload: data.users });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        sendMessage,
        loadConversations,
        loadMessages,
        loadChatUsers,
        markAsRead,
        selectUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
