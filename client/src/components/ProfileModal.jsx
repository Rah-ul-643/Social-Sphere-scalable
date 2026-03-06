import React, { useEffect, useState, useRef } from 'react';
import './css/ProfileModal.css';
import { userApi } from '../apis';
import toast from 'react-hot-toast';

const ProfileModal = ({ setProfileModalOpen, userName, onlineUsers }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.get('/profile');
        if (response.data.success) {
          setProfile(response.data.user);
        } else {
          toast.error('Could not load profile.');
        }
      } catch {
        toast.error('Could not load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Auto-focus & select input when edit mode opens
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const handleEditName = () => {
    setNameInput(profile.name);
    setEditingName(true);
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNameInput('');
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === profile.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const response = await userApi.put('/profile', { name: trimmed });
      if (response.data.success) {
        setProfile(prev => ({ ...prev, name: trimmed }));
        toast.success('Name updated!');
        setEditingName(false);
      } else {
        toast.error(response.data.message || 'Failed to update name.');
      }
    } catch {
      toast.error('Failed to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const isOnline = onlineUsers?.includes(userName);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <div className='Modal' onClick={() => setProfileModalOpen(false)} />
      <div className='profile-modal overlay-container'>

        <div className='modal-header'>
          <h2 className='modal-title'>My Profile</h2>
          <button className='modal-close' onClick={() => setProfileModalOpen(false)} aria-label='Close'>
            <i className='fa-solid fa-xmark' />
          </button>
        </div>

        {loading ? (
          <div className='profile-loading'>
            <div className='profile-skeleton avatar-skeleton' />
            <div className='profile-skeleton line-skeleton wide' />
            <div className='profile-skeleton line-skeleton narrow' />
          </div>
        ) : profile ? (
          <>
            {/* Avatar */}
            <div className='profile-avatar-wrap'>
              <div className='profile-avatar'>
                <span>{getInitials(profile.name)}</span>
              </div>
              <div className={`profile-status-badge ${isOnline ? 'online' : 'offline'}`}>
                <i className='fa-solid fa-circle' />
              </div>
            </div>

            {/* Name & username */}
            <div className='profile-identity'>
              <h3 className='profile-name'>{profile.name}</h3>
              <p className='profile-username'>@{profile.username}</p>
              <span className={`profile-status-label ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Info rows */}
            <div className='profile-info-grid'>

              {/* Full Name — editable */}
              <div className='profile-info-row editable-row'>
                <div className='profile-info-icon'>
                  <i className='fa-solid fa-user' />
                </div>
                <div className='profile-info-content'>
                  <span className='profile-info-label'>Full Name</span>
                  {editingName ? (
                    <div className='name-edit-wrap'>
                      <input
                        ref={nameInputRef}
                        className='name-edit-input'
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        maxLength={60}
                        disabled={savingName}
                      />
                      <div className='name-edit-actions'>
                        <button className='name-action-btn confirm' onClick={handleSaveName} disabled={savingName} title='Save'>
                          {savingName ? <i className='fa-solid fa-spinner fa-spin' /> : <i className='fa-solid fa-check' />}
                        </button>
                        <button className='name-action-btn cancel' onClick={handleCancelEdit} disabled={savingName} title='Cancel'>
                          <i className='fa-solid fa-xmark' />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className='name-display-wrap'>
                      <span className='profile-info-value'>{profile.name}</span>
                      <button className='name-edit-btn' onClick={handleEditName} title='Edit name'>
                        <i className='fa-solid fa-pen' />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className='profile-info-row'>
                <div className='profile-info-icon'>
                  <i className='fa-solid fa-at' />
                </div>
                <div className='profile-info-content'>
                  <span className='profile-info-label'>Username</span>
                  <span className='profile-info-value'>{profile.username}</span>
                </div>
              </div>

              {profile.email && (
                <div className='profile-info-row'>
                  <div className='profile-info-icon'>
                    <i className='fa-solid fa-envelope' />
                  </div>
                  <div className='profile-info-content'>
                    <span className='profile-info-label'>Email</span>
                    <span className='profile-info-value'>{profile.email}</span>
                  </div>
                </div>
              )}

              {profile.joined_at && (
                <div className='profile-info-row'>
                  <div className='profile-info-icon'>
                    <i className='fa-solid fa-calendar' />
                  </div>
                  <div className='profile-info-content'>
                    <span className='profile-info-label'>Member Since</span>
                    <span className='profile-info-value'>
                      {new Date(profile.joined_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {profile.groups_count !== undefined && (
                <div className='profile-info-row'>
                  <div className='profile-info-icon'>
                    <i className='fa-solid fa-users' />
                  </div>
                  <div className='profile-info-content'>
                    <span className='profile-info-label'>Groups</span>
                    <span className='profile-info-value'>{profile.groups_count}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className='profile-error'>Failed to load profile data.</p>
        )}
      </div>
    </>
  );
};

export default ProfileModal;