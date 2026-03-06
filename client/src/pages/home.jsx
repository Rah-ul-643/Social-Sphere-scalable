import { useEffect, useState } from 'react';
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
  const [onlineUsers, setOnlineUsers] = useState('');

  // Loader states
  const [globalLoading, setGlobalLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  // Panel / modal states
  const [isSmallScreen] = useState(window.innerWidth <= 768);
  const [conversationSectionOpen, setConversationSectionOpen] = useState(true);
  const [chatSectionOpen, setChatSectionOpen] = useState(!isSmallScreen);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);
  const [addParticipantModalOpen, setAddParticipantModalOpen] = useState(false);
  const [viewGroupModalOpen, setViewGroupModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Socket setup
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      query: { token: JSON.parse(localStorage.getItem('token')) }
    });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      socket.emit('retrieve-conversations', (groupList) => {
        setConversations(groupList);
        setGlobalLoading(false);
      });
    };

    const handleOnlineUsers = (userList) => setOnlineUsers(userList);

    const bumpToTop = (groupId) => {
      setConversations(prev => {
        const idx = prev.findIndex(g => g.group_id === groupId);
        if (idx <= 0) return prev;
        const updated = [...prev];
        const [group] = updated.splice(idx, 1);
        return [group, ...updated];
      });
    };

    const handleReceiveMsg = (msg, sender, groupId) => {
      if (groupId === activeGroup?.group_id) {
        setChats(prev => [...prev, { sender, message: msg }]);
      }
      bumpToTop(groupId);
    };

    const handleDisconnect = () => {
      setActiveGroup('');
      setChats([]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive-msg', handleReceiveMsg);
    socket.on('online-users', handleOnlineUsers);
    socket.on('connect_error', () => { localStorage.removeItem('token'); setIsLoggedIn(false); });
    socket.on('set-username', (username) => setUserName(username));

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receive-msg', handleReceiveMsg);
      socket.off('online-users', handleOnlineUsers);
      socket.off('disconnect', handleDisconnect);
    };
  }, [activeGroup, setIsLoggedIn, socket]);

  const fetchChatHistory = (group) => {
    if (!socket) return;
    setChatLoading(true);
    socket.emit('chat-history', group.group_id, (history) => {
      setChats(history);
      setChatLoading(false);
      if (!conversations.find(g => g.group_id === group.group_id)) {
        setConversations(prev => [...prev, { group_name: group.group_name, group_id: group.group_id }]);
      }
    });
  };

  const bumpGroupToTop = (groupId) => {
    setConversations(prev => {
      const idx = prev.findIndex(g => g.group_id === groupId);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [group] = updated.splice(idx, 1);
      return [group, ...updated];
    });
  };

  const handleSendMsg = (e) => {
    e.preventDefault();
    if (socket && messageInput && activeGroup) {
      socket.emit('send-msg', messageInput, activeGroup.group_id);
      setMessageInput('');
      bumpGroupToTop(activeGroup.group_id);
    }
  };

  if (globalLoading) {
    return (
      <Loader
        divClasses="Loader Home GlobalLoader"
        content="Connecting..."
      />
    );
  }

  return (
    <div className='Home'>

      {/* Modals */}
      {joinGroupModalOpen && (
        <JoinGroupModal setJoinGroupModalOpen={setJoinGroupModalOpen} conversations={conversations} />
      )}
      {createGroupModalOpen && (
        <CreateGroupModal
          setCreateGroupModalOpen={setCreateGroupModalOpen}
          setActiveGroup={setActiveGroup}
          setConversations={setConversations}
        />
      )}
      {addParticipantModalOpen && (
        <AddParticipantModal setAddParticipantModalOpen={setAddParticipantModalOpen} activeGroup={activeGroup} />
      )}
      {viewGroupModalOpen && (
        <ViewGroupModal
          setViewGroupModalOpen={setViewGroupModalOpen}
          activeGroup={activeGroup}
          userName={userName}
          onlineUsers={onlineUsers}
        />
      )}
      {profileModalOpen &&
        <ProfileModal
            setProfileModalOpen={setProfileModalOpen}
            userName={userName}
            onlineUsers={onlineUsers}
        />
      }

      {/* Sidebar */}
      <SideBar
        setIsLoggedIn={setIsLoggedIn}
        setConversationSectionOpen={setConversationSectionOpen}
        setJoinGroupModalOpen={setJoinGroupModalOpen}
        setCreateGroupModalOpen={setCreateGroupModalOpen}
        setProfileModalOpen={setProfileModalOpen}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Conversation List Panel */}
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

      {/* Chat Panel — always visible on desktop, conditional on mobile */}
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