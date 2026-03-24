import React, { useState } from 'react';
import './css/ChatHeader.css';
import toast from 'react-hot-toast';

const ChatHeader = ({
  activeGroup,
  setAddParticipantModalOpen,
  setViewGroupModalOpen,
  setConversationSectionOpen,
  setChatSectionOpen,
  isSmallScreen,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeGroup.group_id);
    toast.success('Group ID copied!');
    setDropdownOpen(false);
  };

  const handleBack = () => {
    setConversationSectionOpen(true);
    setChatSectionOpen(false);
  };

  return (
    <div className='chat-header'>
      {activeGroup ? (
        <>
          {isSmallScreen && (
            <button className='chat-header-back' onClick={handleBack} aria-label='Back'>
              <i className='fa-solid fa-arrow-left' />
            </button>
          )}

          <div className='header-group-avatar'>
            <i className='fa-solid fa-users' />
          </div>

          <div className='header-group-info'>
            <p className='header-group-name'>{activeGroup.group_name}</p>
            <p className='header-group-id'>{activeGroup.group_id}</p>
          </div>

          {/* Desktop action buttons */}
          <div className='chat-header-actions'>
            <button className='header-action-btn' onClick={() => setViewGroupModalOpen(p => !p)}>
              <i className='fa-solid fa-eye' /><span>View Group</span>
            </button>
            <button className='header-action-btn' onClick={() => setAddParticipantModalOpen(p => !p)}>
              <i className='fa-solid fa-user-plus' /><span>Add</span>
            </button>
            <button className='header-action-btn icon-only' onClick={handleCopy} title='Copy Group ID'>
              <i className='fa-regular fa-copy' />
            </button>
          </div>

          {/* Mobile overflow */}
          <button className='header-overflow-btn' onClick={() => setDropdownOpen(p => !p)}>
            <i className='fa-solid fa-ellipsis-vertical' />
          </button>
          {dropdownOpen && (
            <div className='header-dropdown'>
              <button onClick={() => { setViewGroupModalOpen(p => !p); setDropdownOpen(false); }}>
                <i className='fa-solid fa-eye' /> View Group
              </button>
              <button onClick={() => { setAddParticipantModalOpen(p => !p); setDropdownOpen(false); }}>
                <i className='fa-solid fa-user-plus' /> Add Participant
              </button>
              <button onClick={handleCopy}>
                <i className='fa-regular fa-copy' /> Copy Group ID
              </button>
            </div>
          )}
        </>
      ) : (
        <h2 className='header-app-title'>Social <span>Sphere</span></h2>
      )}
    </div>
  );
};

export default ChatHeader;
