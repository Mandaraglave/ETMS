import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  ListItemButton,
  Divider
} from '@mui/material';
import {
  Send,
  ArrowBack,
  Person
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const Chat: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { state, sendMessage, selectUser, loadChatUsers, loadConversations } = useChat();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.currentMessages, scrollToBottom]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      loadChatUsers();
    }
  }, [isAuthenticated]); // Load conversations and users only when authenticated

  // Remove automatic refresh - conversations will be updated via socket events

  useEffect(() => {
    // Console logging removed for cleaner UI
  }, [state]);

  const handleSendMessage = async () => {
    if (message.trim() && state.selectedUser) {
      setIsTyping(true);
      await sendMessage(state.selectedUser._id, message.trim());
      setMessage('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        Chat
      </Typography>

      {state.error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {state.error}
        </Alert>
      )}

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversations List */}
        <Paper
          sx={{
            width: 300,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            Conversations
            <Button 
              size="small" 
              onClick={() => loadConversations()}
              sx={{ ml: 2 }}
            >
              Refresh
            </Button>
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Person />}
            onClick={() => setShowNewConversation(!showNewConversation)}
            sx={{ m: 2, mb: 1 }}
          >
            {showNewConversation ? 'Hide' : 'New Conversation'}
          </Button>

          {showNewConversation && (
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Available Users:
              </Typography>
              <List dense>
                {state.chatUsers && state.chatUsers.length > 0 ? (
                  state.chatUsers.map((chatUser) => (
                    <ListItemButton
                      key={chatUser._id}
                      onClick={() => {
                        selectUser(chatUser);
                        setShowNewConversation(false);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={chatUser.profilePicture}
                          alt={chatUser.name}
                          sx={{ width: 32, height: 32 }}
                        >
                          {chatUser.name?.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={chatUser.name}
                        secondary={chatUser.role}
                      />
                    </ListItemButton>
                  ))
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No users available for chat
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Debug: Check console for details
                    </Typography>
                  </Box>
                )}
              </List>
              <Divider sx={{ my: 1 }} />
            </Box>
          )}
          
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {state.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (state.conversations?.length || 0) === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  No conversations yet
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Start a conversation by clicking "New Conversation"
                </Typography>
              </Box>
            ) : (
              state.conversations?.map((conversation, index) => {
                return (
                <ListItemButton
                  key={conversation._id}
                  selected={state.selectedUser?._id === conversation.user._id}
                  onClick={() => selectUser(conversation.user)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={conversation.user.profilePicture}
                      alt={conversation.user.name}
                    >
                      {conversation.user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" noWrap>
                          {conversation.user.name}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Chip
                            label={conversation.unreadCount}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }} component="span">
                          {conversation.lastMessage?.message || 'No messages yet'}
                        </Typography>
                        <Typography variant="caption" component="span">
                          {conversation.lastMessage?.createdAt ? formatTime(conversation.lastMessage.createdAt) : ''}
                        </Typography>
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
                })
            )}
          </List>
        </Paper>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {state.selectedUser ? (
            <>
              {/* Chat Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton onClick={() => selectUser(null)} sx={{ mr: 1 }}>
                    <ArrowBack />
                  </IconButton>
                  <Avatar
                    src={state.selectedUser.profilePicture}
                    alt={state.selectedUser.name}
                    sx={{ mr: 2 }}
                  >
                    {state.selectedUser.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {state.selectedUser.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {state.selectedUser.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {state.currentMessages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                      Start a conversation with {state.selectedUser.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {state.currentMessages.map((msg, index) => {
                      const isOwn = msg.sender._id === user?.id;
                      const showDate = index === 0 || 
                        formatDate(msg.createdAt) !== formatDate(state.currentMessages[index - 1].createdAt);
                      
                      return (
                        <Box key={msg._id}>
                          {showDate && (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ display: 'block', textAlign: 'center', my: 1 }}
                            >
                              {formatDate(msg.createdAt)}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              mb: 1
                            }}
                          >
                            <Box
                              sx={{
                                maxWidth: '70%',
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: isOwn ? 'primary.main' : 'grey.200',
                                color: isOwn ? 'white' : 'text.primary'
                              }}
                            >
                              {!isOwn && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    mb: 0.5,
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {msg.sender.name}
                                </Typography>
                              )}
                              <Typography variant="body2">
                                {msg.message}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  opacity: 0.7
                                }}
                              >
                                {formatTime(msg.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isTyping}
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isTyping}
                    sx={{ alignSelf: 'flex-end' }}
                  >
                    {isTyping ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Send />
                    )}
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                Select a conversation to start chatting
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Choose from your existing conversations or start a new one
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;
