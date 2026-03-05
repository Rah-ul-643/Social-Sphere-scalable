import React from 'react';
import './css/ChatList.css';

const ChatList = ({
  conversations,
  activeGroup,
  setActiveGroup,
  fetchChatHistory,
  setChatSectionOpen,
  setConversationSectionOpen,
  isSmallScreen,
}) => {
  const handleClick = (group) => {
    setActiveGroup(group);
    fetchChatHistory(group);
    if (isSmallScreen) {
      setConversationSectionOpen(false);
      setChatSectionOpen(true);
    }
  };

  return (
    <>
      <p className='chat-list-header'>Conversations</p>
      <ul className='Chat-List'>
        {conversations.length === 0 ? (
          <div className='chat-list-empty'>
            <i className='fa-solid fa-comment-slash' />
            No conversations yet.<br />
            Create or join a group to get started.
          </div>
        ) : (
          conversations.map((group) => (
            <li
              key={group.group_id}
              onClick={() => handleClick(group)}
              className={activeGroup === group ? 'active' : ''}
            >
              <div className='group-avatar'>
                <i className='fa-solid fa-users' />
              </div>
              <div className='chat-list-info'>
                <p className='chat-list-name'>{group.group_name}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </>
  );
};

export default ChatList;
