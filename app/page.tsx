'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  MessageCircle,
  User,
  Bot,
  RotateCcw,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  FolderOpen,
  History,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status: 'sending' | 'sent' | 'failed';
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isTyping: boolean;
  userScrolledUp: boolean;
}

export default function ChatInterface() {
  const [state, setState] = useState<ChatState>({
    sessions: [],
    currentSessionId: null,
    isTyping: false,
    userScrolledUp: false,
  });
  const [inputValue, setInputValue] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 640);
    }
  }, []);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Load sessions and chat history on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    const savedCurrentSessionId = localStorage.getItem('currentSessionId');

    if (savedSessions) {
      const sessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        lastActivity: new Date(session.lastActivity),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));

      setState((prev) => ({
        ...prev,
        sessions,
        currentSessionId:
          savedCurrentSessionId &&
          sessions.find((s: ChatSession) => s.id === savedCurrentSessionId)
            ? savedCurrentSessionId
            : sessions.length > 0
            ? sessions[0].id
            : null,
      }));
    } else {
      // Create default session if none exist
      createNewSession('General Chat', true);
    }

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (state.sessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(state.sessions));
    }
  }, [state.sessions]);

  // Save current session ID
  useEffect(() => {
    if (state.currentSessionId) {
      localStorage.setItem('currentSessionId', state.currentSessionId);
    }
  }, [state.currentSessionId]);

  // Calculate current session directly
  const currentSession = state.sessions.find(
    (session) => session.id === state.currentSessionId
  );

  // Auto-scroll to bottom when new messages arrive (unless user scrolled up)
  useEffect(() => {
    if (!state.userScrolledUp && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, state.userScrolledUp]);

  const createNewSession = useCallback(
    (name: string, setAsCurrent: boolean = false) => {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        name: name || `Chat ${state.sessions.length + 1}`,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      setState((prev) => ({
        ...prev,
        sessions: [...prev.sessions, newSession],
        currentSessionId: setAsCurrent ? newSession.id : prev.currentSessionId,
      }));

      return newSession.id;
    },
    [state.sessions.length]
  );

  const switchSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      currentSessionId: sessionId,
      userScrolledUp: false,
    }));
    setSidebarOpen(false); // Close sidebar on mobile after selecting session
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setState((prev) => {
      const newSessions = prev.sessions.filter(
        (session) => session.id !== sessionId
      );
      const newCurrentSessionId =
        prev.currentSessionId === sessionId
          ? newSessions.length > 0
            ? newSessions[0].id
            : null
          : prev.currentSessionId;

      return {
        ...prev,
        sessions: newSessions,
        currentSessionId: newCurrentSessionId,
      };
    });

    toast.success('Session deleted');
  }, []);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === sessionId
          ? { ...session, name: newName.trim() || session.name }
          : session
      ),
    }));

    setEditingSessionId(null);
    setEditingSessionName('');
    toast.success('Session renamed');
  }, []);

  const updateSessionActivity = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === sessionId
          ? { ...session, lastActivity: new Date() }
          : session
      ),
    }));
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      setState((prev) => ({
        ...prev,
        userScrolledUp: !isAtBottom,
      }));

      // Reset scroll detection after a delay
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        setState((prev) => ({ ...prev, userScrolledUp: false }));
      }, 3000);
    }
  }, []);

  const simulateBotResponse = useCallback(
    async (userMessage: string, sessionId: string) => {
      setState((prev) => ({ ...prev, isTyping: true }));

      // Simulate network delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      // Fetch response from Gemini API
      async function fetchGeminiResponse(userMessage: string): Promise<string> {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          console.error(
            'Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env file'
          );
          return 'Error: API key not configured';
        }
        const apiUrl =
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        try {
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userMessage }] }],
            }),
          });
          if (!res.ok) throw new Error('Failed to fetch from Gemini API');
          const data = await res.json();
          // Gemini API returns response in data.candidates[0].content.parts[0].text
          return (
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't generate a response."
          );
        } catch (error) {
          return 'Sorry, there was an error contacting the Gemini API.';
        }
      }

      const response = await fetchGeminiResponse(userMessage);

      const botMessage: Message = {
        id: Date.now().toString() + '-bot',
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
      };

      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, botMessage],
                lastActivity: new Date(),
              }
            : session
        ),
        isTyping: false,
      }));
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string, retryMessageId?: string) => {
      if (!text.trim() || !state.currentSessionId) return;

      const sessionId = state.currentSessionId;
      const messageId = retryMessageId || Date.now().toString();
      const userMessage: Message = {
        id: messageId,
        text: text.trim(),
        sender: 'user',
        timestamp: new Date(),
        status: 'sending',
      };

      if (retryMessageId) {
        // Update existing failed message
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map((msg) =>
                    msg.id === retryMessageId ? userMessage : msg
                  ),
                  lastActivity: new Date(),
                }
              : session
          ),
        }));
      } else {
        // Add new message
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [...session.messages, userMessage],
                  lastActivity: new Date(),
                }
              : session
          ),
        }));
        setInputValue('');
      }

      updateSessionActivity(sessionId);

      try {
        // Simulate message sending
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.1 || !isOnline) {
              // 90% success rate when online
              resolve(true);
            } else {
              reject(new Error('Network error'));
            }
          }, 500);
        });

        // Mark as sent
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, status: 'sent' } : msg
                  ),
                }
              : session
          ),
        }));

        // Generate bot response
        simulateBotResponse(text, sessionId);
      } catch (error) {
        // Mark as failed
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, status: 'failed' } : msg
                  ),
                }
              : session
          ),
        }));

        toast.error('Failed to send message. Click retry to try again.');
      }
    },
    [
      state.currentSessionId,
      isOnline,
      simulateBotResponse,
      updateSessionActivity,
    ]
  );

  const handleSend = useCallback(() => {
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const retryMessage = useCallback(
    (message: Message) => {
      sendMessage(message.text, message.id);
    },
    [sendMessage]
  );

  const clearCurrentSession = useCallback(() => {
    if (!state.currentSessionId) return;

    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === state.currentSessionId
          ? { ...session, messages: [] }
          : session
      ),
    }));

    toast.success('Session cleared');
  }, [state.currentSessionId]);

  const handleCreateSession = useCallback(() => {
    if (!newSessionName.trim()) return;

    const sessionId = createNewSession(newSessionName.trim(), true);
    setNewSessionName('');
    setShowSessionDialog(false);
    toast.success('New session created');
  }, [newSessionName, createNewSession]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDetailedTimestamp = (date: Date) => {
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatSessionDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Sessions sidebar content component
  const SessionsSidebar = () => (
    <div className="w-full h-full bg-white dark:bg-slate-800 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
            <History className="w-5 h-5 mr-2" />
            Chat Sessions
          </h2>
          <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateSession();
                }}
                className="space-y-4"
              >
                <Input
                  placeholder="Enter session name..."
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSessionDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!newSessionName.trim()}>
                    Create Session
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {state.sessions.length} session
          {state.sessions.length !== 1 ? 's' : ''}
        </p>
      </div>
      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedSessions.map((session) => (
            <div
              key={session.id}
              className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                session.id === state.currentSessionId
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              onClick={() => switchSession(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {editingSessionId === session.id ? (
                    <Input
                      value={editingSessionName}
                      onChange={(e) => setEditingSessionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameSession(session.id, editingSessionName);
                        } else if (e.key === 'Escape') {
                          setEditingSessionId(null);
                          setEditingSessionName('');
                        }
                      }}
                      onBlur={() =>
                        renameSession(session.id, editingSessionName)
                      }
                      className="h-6 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {session.name}
                    </h3>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {session.messages.length} message
                      {session.messages.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatSessionDate(session.lastActivity)}
                    </p>
                  </div>
                  {session.messages.length > 0 && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                      {session.messages[session.messages.length - 1].text}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(session.id);
                      setEditingSessionName(session.name);
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  {state.sessions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const sortedSessions = [...state.sessions].sort(
    (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 border-r border-slate-200 dark:border-slate-700">
        <SessionsSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2"
                    aria-label="Toggle sidebar"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SessionsSidebar />
                </SheetContent>
              </Sheet>

              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {currentSession?.name || 'Chat Assistant'}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                  {state.isTyping && (
                    <span className="text-blue-600 dark:text-blue-400 hidden sm:inline">
                      • Assistant is typing...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={clearCurrentSession}
              className="text-slate-600 dark:text-slate-400 hidden sm:inline-flex"
              disabled={!currentSession?.messages.length}
            >
              Clear Chat
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea
            className="h-full px-2 sm:px-4 py-4 sm:py-6"
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
            <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
              {!currentSession?.messages.length ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    Send a message to begin chatting with the assistant in "
                    {currentSession?.name}".
                  </p>
                </div>
              ) : (
                currentSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.sender === 'user'
                        ? 'flex-row-reverse space-x-reverse'
                        : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`flex-1 max-w-xs sm:max-w-lg ${
                        message.sender === 'user' ? 'text-right' : ''
                      }`}
                    >
                      <Card
                        className={`p-3 ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {message.sender === 'bot' ? (
  <ReactMarkdown>
    {message.text}
  </ReactMarkdown>
) : (
  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
    {message.text}
  </p>
)}
                      </Card>

                      {/* Timestamp and Status */}
                      <div
                        className={`flex items-center mt-1 space-x-2 ${
                          message.sender === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <span
                          className="text-xs text-slate-500 dark:text-slate-400 cursor-help"
                          title={formatDetailedTimestamp(message.timestamp)}
                        >
                          {formatTimestamp(message.timestamp)}
                        </span>

                        {message.sender === 'user' && (
                          <div className="flex items-center space-x-1">
                            {message.status === 'sending' && (
                              <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                            )}
                            {message.status === 'sent' && (
                              <Check className="w-3 h-3 text-green-500" />
                            )}
                            {message.status === 'failed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-red-500 hover:text-red-600"
                                onClick={() => retryMessage(message)}
                                aria-label="Retry sending message"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {state.isTyping && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <Card className="p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isMobile
                      ? 'Type your message...'
                      : 'Type your message... (Press Enter to send, Shift+Enter for new line)'
                  }
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                  disabled={!isOnline || !currentSession}
                  aria-label="Message input"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || !isOnline || !currentSession}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 h-11"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {!isOnline && (
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                <X className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">
                  You're offline. Messages will be sent when connection is
                  restored.
                </span>
                <span className="sm:hidden">You're offline</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
