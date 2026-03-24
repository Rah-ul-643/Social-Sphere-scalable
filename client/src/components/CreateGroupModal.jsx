import React, { useState } from 'react';
import './css/Modals.css';
import toast from 'react-hot-toast';
import { chatApi } from '../apis';

const CreateGroupModal = ({ setCreateGroupModalOpen, setConversations, setActiveGroup }) => {
  const [groupName, setGroupName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await chatApi.post('create-group', { groupName });
      const data = response.data;
      if (data.success) {
        setActiveGroup(data.group);
        setConversations(prev => [...prev, data.group]);
        toast.success('Group created!');
        setCreateGroupModalOpen(false);
      }
    } catch {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <div className='Modal' onClick={() => setCreateGroupModalOpen(false)} />
      <div className='overlay-container'>
        <div className='modal-header'>
          <h2 className='modal-title'>Create Group</h2>
          <button className='modal-close' onClick={() => setCreateGroupModalOpen(false)} aria-label='Close'>
            <i className='fa-solid fa-xmark' />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='new-group'>Group Name</label>
            <input
              type='text'
              id='new-group'
              placeholder='e.g. Study Squad, Project Alpha...'
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button type='submit' className='btn-modal'>
            <i className='fa-solid fa-plus' style={{ marginRight: '0.4rem' }} />
            Create Group
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateGroupModal;
