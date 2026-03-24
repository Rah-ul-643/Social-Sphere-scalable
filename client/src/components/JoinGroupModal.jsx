import React, { useState } from 'react';
import './css/Modals.css';
import { chatApi } from '../apis';
import toast from 'react-hot-toast';

const JoinGroupModal = ({ setJoinGroupModalOpen, conversations }) => {
  const [groupId, setGroupId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (conversations.find(g => g.group_id === groupId)) {
      toast.error('You are already a member of this group.');
      return;
    }
    try {
      const response = await chatApi.post('join-group', { groupId });
      const data = response.data;
      if (data.success) {
        toast.success('Join request sent!');
        setJoinGroupModalOpen(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <div className='Modal' onClick={() => setJoinGroupModalOpen(false)} />
      <div className='overlay-container'>
        <div className='modal-header'>
          <h2 className='modal-title'>Join Group</h2>
          <button className='modal-close' onClick={() => setJoinGroupModalOpen(false)} aria-label='Close'>
            <i className='fa-solid fa-xmark' />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='join-group'>Group ID</label>
            <input
              type='text'
              id='join-group'
              placeholder='Paste the group ID here'
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button type='submit' className='btn-modal'>
            <i className='fa-solid fa-right-to-bracket' style={{ marginRight: '0.4rem' }} />
            Request to Join
          </button>
        </form>
      </div>
    </>
  );
};

export default JoinGroupModal;
