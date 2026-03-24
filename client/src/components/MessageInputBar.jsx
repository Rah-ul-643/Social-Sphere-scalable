import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './css/MessageInputBar.css';

const MessageInputBar = ({ messageInput, setMessageInput, activeGroup, handleSendMsg }) => {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const pickerRef = useRef(null);
  const emojiToggleRef = useRef(null);
  const inputRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target) &&
        emojiToggleRef.current && !emojiToggleRef.current.contains(e.target)
      ) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    if (!activeGroup) return;
    const val = e.target.value;
    const len = val.length;
    const sentenceEnders = ['.', '?', '!'];

    setMessageInput(prev => {
      if (prev.length < len) {
        if (val.length === 1) return val.toUpperCase();
        if (sentenceEnders.includes(val[len - 2]) && val[len - 1] !== val[len - 2]) {
          return prev + ' ' + val[len - 1].toUpperCase();
        }
      }
      return val;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMsg(e);
      setEmojiOpen(false);
    }
    if (e.key === 'Escape') setEmojiOpen(false);
  };

  const onEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  return (
    <div className='Message-Input-Wrap'>
      {/* Emoji Picker */}
      {emojiOpen && (
        <div className='emoji-picker-container' ref={pickerRef}>
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme='dark'
            emojiStyle='google'
            skinTonesDisabled
            searchPlaceholder='Search emoji...'
            previewConfig={{ showPreview: false }}
            height={380}
            width='100%'
          />
        </div>
      )}

      <form className='Message-Input-Bar' onSubmit={(e) => { handleSendMsg(e); setEmojiOpen(false); }}>
        {/* Emoji toggle button */}
        <button
          type='button'
          ref={emojiToggleRef}
          className={`emoji-toggle-btn ${emojiOpen ? 'active' : ''}`}
          onClick={() => setEmojiOpen(p => !p)}
          disabled={!activeGroup}
          aria-label='Toggle emoji picker'
          title='Emoji'
        >
          <i className='fa-regular fa-face-smile' />
        </button>

        <input
          ref={inputRef}
          type='text'
          placeholder={activeGroup ? 'Write a message…' : 'Select a group to start chatting'}
          value={messageInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={!activeGroup ? 'no-cursor' : undefined}
          disabled={!activeGroup}
          autoComplete='off'
        />

        <button
          type='submit'
          className='send-btn'
          disabled={!activeGroup || !messageInput.trim()}
          aria-label='Send message'
        >
          <i className='fa-solid fa-paper-plane' />
        </button>
      </form>
    </div>
  );
};

export default MessageInputBar;