import React, { useState } from 'react';
import './css/Modals.css';
import { chatApi } from '../apis';
import toast from 'react-hot-toast';

const AddParticipantModal = ({ setAddParticipantModalOpen, activeGroup }) => {
  const [inputUserName, setInputUserName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await chatApi.post('/add-participant', {
        username: inputUserName,
        groupId: activeGroup.group_id,
      });
      const data = response.data;
      if (data.success) {
        toast.success('User added to group.');
        setAddParticipantModalOpen(false);
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
      <div className='Modal' onClick={() => setAddParticipantModalOpen(false)} />
      <div className='overlay-container'>
        <div className='modal-header'>
          <h2 className='modal-title'>Add Participant</h2>
          <button className='modal-close' onClick={() => setAddParticipantModalOpen(false)} aria-label='Close'>
            <i className='fa-solid fa-xmark' />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='add-participant'>Username</label>
            <input
              type='text'
              id='add-participant'
              placeholder='Enter their username'
              value={inputUserName}
              onChange={(e) => setInputUserName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button type='submit' className='btn-modal'>
            <i className='fa-solid fa-user-plus' style={{ marginRight: '0.4rem' }} />
            Add to Group
          </button>
        </form>
      </div>
    </>
  );
};

export default AddParticipantModal;
