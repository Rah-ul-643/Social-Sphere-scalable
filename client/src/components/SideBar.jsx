import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import './css/SideBar.css';

const SideBar = ({
  setIsLoggedIn,
  setChatSectionOpen,
  setConversationSectionOpen,
  setJoinGroupModalOpen,
  setCreateGroupModalOpen,
  isDarkMode,
  setIsDarkMode,
}) => {

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  const handleLogOut = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    toast.success('Logged out');
  };

  const handleTogglePanel = () => {
    setConversationSectionOpen(prev => !prev);
  };

  const handleJoinGroup = () => {
    setCreateGroupModalOpen(prev => prev ? !prev : prev);
    setJoinGroupModalOpen(prev => !prev);
  };

  const handleCreateGroup = () => {
    setJoinGroupModalOpen(prev => prev ? !prev : prev);
    setCreateGroupModalOpen(prev => !prev);
  };

  return (
    <div className='Side-bar'>
      <div className='sidebar-top'>
        {/* Logo mark */}
        <div className='sidebar-logo'>
          <div className='sidebar-logo-inner' />
        </div>

        <button className='sidebar-btn' title='Toggle chat list' onClick={handleTogglePanel}>
          <i className='fa-solid fa-list' />
        </button>
        <button className='sidebar-btn' title='Join a group' onClick={handleJoinGroup}>
          <i className='fa-solid fa-users-gear' />
        </button>
        <button className='sidebar-btn' title='Create new group' onClick={handleCreateGroup}>
          <i className='fa-solid fa-plus' />
        </button>

        <div className='sidebar-divider' />

        <button className='sidebar-btn' title='View profile'>
          <i className='fa-solid fa-user' />
        </button>
      </div>

      <div className='sidebar-bottom'>
        <button className='sidebar-btn' title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setIsDarkMode(p => !p)}>
          <i className={isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} />
        </button>
        <button className='sidebar-btn logout' title='Log out' onClick={handleLogOut}>
          <i className='fa-solid fa-right-from-bracket' />
        </button>
      </div>
    </div>
  );
};

export default SideBar;