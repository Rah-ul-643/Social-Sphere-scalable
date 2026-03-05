import React, { useEffect, useState } from 'react';
import './css/Modals.css';
import { chatApi } from '../apis';
import toast from 'react-hot-toast';

const ViewGroupModal = ({ setViewGroupModalOpen, userName, activeGroup, onlineUsers }) => {
  const [groupData, setGroupData] = useState(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await chatApi.get('/group', { params: { group_id: activeGroup.group_id } });
        if (response.data.success) setGroupData(response.data.groupDetails);
      } catch {
        localStorage.clear();
        window.location.reload();
      }
    };
    fetchGroupData();
  }, [activeGroup]);

  const handleRequest = async (acceptStatus, username) => {
    try {
      const params = { acceptStatus: acceptStatus.toString(), group_id: activeGroup.group_id, username };
      const response = await chatApi.put('/join-request-response', null, { params });
      if (response.data.success) {
        toast.success(acceptStatus ? 'Request accepted' : 'Request rejected');
        setGroupData(response.data.groupList);
      }
    } catch {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLeave = async () => {
    try {
      const response = await chatApi.delete('/leave-group', { params: { group_id: activeGroup.group_id } });
      if (response.data.success) {
        toast.success('Left group');
        window.location.reload();
      } else {
        toast.error('Admin cannot leave first!');
      }
    } catch {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <div className='Modal' onClick={() => setViewGroupModalOpen(false)} />
      <div className='overlay-container view-group-modal'>
        <div className='modal-header'>
          <h2 className='modal-title'>Group Details</h2>
          <button className='modal-close' onClick={() => setViewGroupModalOpen(false)} aria-label='Close'>
            <i className='fa-solid fa-xmark' />
          </button>
        </div>

        {!groupData ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</p>
        ) : (
          <>
            <section>
              <p className='view-group-section-title'>Participants · {groupData.participants.length}</p>
              <ul className='participants-list'>
                {groupData.participants.map((username) => (
                  <li key={username}>
                    <div className='participant-info'>
                      <div className='participant-avatar'><i className='fa-solid fa-user' /></div>
                      <span className='participant-name'>{username}</span>
                      {groupData.admin === username && <span className='admin-badge'>admin</span>}
                    </div>
                    <div className={onlineUsers.includes(username) ? 'online-dot' : 'offline-dot'} />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className='view-group-section-title'>Join Requests · {groupData.join_requests.length}</p>
              {groupData.join_requests.length === 0 ? (
                <p className='no-requests'>No pending requests.</p>
              ) : (
                <ul className='join-requests-list'>
                  {groupData.join_requests.map((username) => (
                    <li key={username}>
                      <div className='participant-info'>
                        <div className='participant-avatar'><i className='fa-solid fa-user' /></div>
                        <span className='participant-name'>{username}</span>
                      </div>
                      {groupData.admin === userName && (
                        <div className='request-button-tab'>
                          <button className='accept' onClick={() => handleRequest(true, username)} title='Accept'>
                            <i className='fa-regular fa-circle-check' />
                          </button>
                          <button className='reject' onClick={() => handleRequest(false, username)} title='Reject'>
                            <i className='fa-regular fa-circle-xmark' />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <button className='leave-group-btn' onClick={handleLeave}>
              <i className='fa-solid fa-right-from-bracket' /> Leave Group
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default ViewGroupModal;
