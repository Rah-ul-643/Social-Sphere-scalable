import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

import './css/home.css';

import SideBar from '../components/SideBar';
import SearchBar from '../components/SearchBar';
import ChatList from '../components/ChatList';
import ChatHeader from '../components/ChatHeader';
import ChatContent from '../components/ChatContent';
import MessageInputBar from '../components/MessageInputBar';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';
import AddParticipantModal from '../components/AddParticipantModal';
import ViewGroupModal from '../components/ViewGroupModal';
import ProfileModal from '../components/ProfileModal';
import Loader from '../components/Loader';

import { chatApi } from '../apis';
import componentLoaderImage from '../static/componentLoader.gif';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;

const Home = ({ setIsLoggedIn }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [socket, setSocket] = useState(null);
  const [userName, setUserName] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [chats, setChats] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [globalLoading, setGlobalLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  const [isSmallScreen] = useState(window.innerWidth <= 768);
  const [conversationSectionOpen, setConversationSectionOpen] = useState(true);
  const [chatSectionOpen, setChatSectionOpen] = useState(!isSmallScreen);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);
  const [addParticipantModalOpen, setAddParticipantModalOpen] = useState(false);
  const [viewGroupModalOpen, setViewGroupModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // ── helpers ──────────────────────────────────────────────

  const bumpToTop = useCallback((groupId) => {
    setConversations(prev => {
      const idx = prev.findIndex(g => g.group_id === groupId);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [group] = updated.splice(idx, 1);
      return [group, ...updated];
    });
  }, []);

  // ── socket setup ─────────────────────────────────────────

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('token'));

    const newSocket = io(SOCKET_SERVER_URL, {
      auth: { token },
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);



  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await chatApi.get('/conversations');
        if (data.success) setConversations(data.conversations);
      } catch (err) {
        console.error('[API] Failed to load conversations:', err.message);
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // ── socket event listeners ───────────────────────────────

  useEffect(() => {
    if (!socket) return;

    // Presence snapshot sent immediately after connection
    const handleOnlineUsers = (userList) => setOnlineUsers(userList);

    // Incremental presence updates broadcast by the WS server
    const handleUserOnline = (userId) => setOnlineUsers(prev => [...new Set([...prev, userId])]);
    const handleUserOffline = (userId) => setOnlineUsers(prev => prev.filter(id => id !== userId));

    // message object { messageId, groupId, sender, message, timestamp }
    // emitted by the Redis subscriber in ws-server.js
    const handleReceiveMsg = (msg) => {
      if (msg.groupId === activeGroup?.group_id) {
        setChats(prev => [...prev, msg]);
      }
      bumpToTop(msg.groupId);
    };

    const handleDisconnect = () => {
      setActiveGroup(null);
      setChats([]);
    };

    socket.on('set-username', (username) => setUserName(username));
    socket.on('online-users', handleOnlineUsers);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('receive-msg', handleReceiveMsg);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', () => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
    });

    return () => {
      socket.off('set-username');
      socket.off('online-users', handleOnlineUsers);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('receive-msg', handleReceiveMsg);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error');
    };
  }, [socket, activeGroup, bumpToTop, setIsLoggedIn]);



  const fetchChatHistory = useCallback(async (group) => {
    if (!socket) return;
    setChatLoading(true);

    try {
      // 1: fetch history from API
      const { data } = await chatApi.get('/messages', {
        params: { groupId: group.group_id, page: 1, limit: 50 },
      });

      if (data.success) {
        setChats(data.messages);
      }

      // 2: join the Socket.IO room for real-time delivery
      socket.emit('join-chat-room', { groupId: group.group_id }, ({ success, error }) => {
        if (!success) console.error('[WS] Room join failed:', error);
      });

      if (!conversations.find(g => g.group_id === group.group_id)) {
        setConversations(prev => [...prev, { group_name: group.group_name, group_id: group.group_id }]);
      }
    } catch (err) {
      console.error('[API] Failed to load chat history:', err.message);
    } finally {
      setChatLoading(false);
    }
  }, [socket, conversations]);

  // ── send message ─────────────────────────────────────────

  const handleSendMsg = (e) => {
    e.preventDefault();
    if (!socket || !messageInput || !activeGroup) return;

    socket.emit('send-msg', {
      groupId: activeGroup.group_id,
      content: messageInput,
    });

    setMessageInput('');
    bumpToTop(activeGroup.group_id);
  };

  // ── render ───────────────────────────────────────────────

  if (globalLoading) {
    return <Loader divClasses="Loader Home GlobalLoader" content="Connecting..." />;
  }

  return (
    <div className='Home'>

      {joinGroupModalOpen && (
        <JoinGroupModal
          setJoinGroupModalOpen={setJoinGroupModalOpen}
          conversations={conversations}
        />
      )}
      {createGroupModalOpen && (
        <CreateGroupModal
          setCreateGroupModalOpen={setCreateGroupModalOpen}
          setActiveGroup={setActiveGroup}
          setConversations={setConversations}
        />
      )}
      {addParticipantModalOpen && (
        <AddParticipantModal
          setAddParticipantModalOpen={setAddParticipantModalOpen}
          activeGroup={activeGroup}
        />
      )}
      {viewGroupModalOpen && (
        <ViewGroupModal
          setViewGroupModalOpen={setViewGroupModalOpen}
          activeGroup={activeGroup}
          userName={userName}
          onlineUsers={onlineUsers}
        />
      )}
      {profileModalOpen && (
        <ProfileModal
          setProfileModalOpen={setProfileModalOpen}
          userName={userName}
          onlineUsers={onlineUsers}
        />
      )}

      <SideBar
        setIsLoggedIn={setIsLoggedIn}
        setConversationSectionOpen={setConversationSectionOpen}
        setJoinGroupModalOpen={setJoinGroupModalOpen}
        setCreateGroupModalOpen={setCreateGroupModalOpen}
        setProfileModalOpen={setProfileModalOpen}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <section className={`Conversation-Section ${conversationSectionOpen ? 'slide-in' : 'slide-out'}`}>
        <SearchBar />
        <ChatList
          conversations={conversations}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          fetchChatHistory={fetchChatHistory}
          setChatSectionOpen={setChatSectionOpen}
          setConversationSectionOpen={setConversationSectionOpen}
          isSmallScreen={isSmallScreen}
        />
      </section>

      {(!isSmallScreen || chatSectionOpen) && (
        <section className='Chat-Section'>
          <ChatHeader
            activeGroup={activeGroup}
            setAddParticipantModalOpen={setAddParticipantModalOpen}
            setViewGroupModalOpen={setViewGroupModalOpen}
            setConversationSectionOpen={setConversationSectionOpen}
            setChatSectionOpen={setChatSectionOpen}
            isSmallScreen={isSmallScreen}
          />
          {chatLoading ? (
            <Loader
              divClasses="Chat-Content Loader"
              loaderImage={componentLoaderImage}
              imageClasses="ChatLoaderImg"
              content="Loading messages..."
            />
          ) : (
            <ChatContent userName={userName} activeGroup={activeGroup} chats={chats} />
          )}
          <MessageInputBar
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            activeGroup={activeGroup}
            handleSendMsg={handleSendMsg}
          />
        </section>
      )}
    </div>
  );
};

export default Home;
