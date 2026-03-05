import React, { useEffect, useRef } from 'react';
import './css/ChatContent.css';

const ChatContent = ({ userName, activeGroup, chats }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chats]);

  if (!activeGroup) {
    return (
      <ul className='Chat-Content'>
        <div className='Empty-Chats'>
          <div className='empty-chats-icon'><i className='fa-regular fa-comments' /></div>
          <h1>Welcome.</h1>
          <p>Select a conversation from the left, or create a new group to get started.</p>
        </div>
      </ul>
    );
  }

  if (!chats.length) {
    return (
      <ul className='Chat-Content'>
        <div className='Empty-Chats'>
          <div className='empty-chats-icon'><i className='fa-solid fa-feather' /></div>
          <p>No messages yet. Be the first to say something.</p>
        </div>
      </ul>
    );
  }

  return (
    <ul className='Chat-Content' ref={containerRef}>
      {chats.map((item, index) => (
        <li key={index} className={item.sender === userName ? 'sender-message' : 'receiver-message'}>
          {item.sender !== userName && <h3>{item.sender}</h3>}
          <p>{item.message}</p>
        </li>
      ))}
    </ul>
  );
};

export default ChatContent;
