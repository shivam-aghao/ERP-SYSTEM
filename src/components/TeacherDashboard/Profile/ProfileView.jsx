import React, { useState, useEffect, useRef } from 'react';
import { FacultyInfoProvider, useFacultyInfo } from '../../../context/FacultyInfoContext';
import Avatar from './Avatar';
import ProfileImageModal from './ProfileImageModal';

/**
 * ProfileViewInner
 * Minimal, glanceable Faculty Profile identity view.
 * Strictly separates basic profile details from comprehensive portfolio.
 */
function ProfileViewInner({ onNavigateToInformation, onLogout }) {
  const {
    profile,
    updateProfile,
    uploadProfilePhoto,
    deleteProfilePhoto,
    profileCompletion,
    toast,
    showToast
  } = useFacultyInfo();

  // Dynamic Profile Photo Modal & Hover State
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);
  const [photoModalState, setPhotoModalState] = useState({
    isOpen: false,
    mode: 'view', // 'view' | 'upload_preview' | 'delete_confirm'
    previewUrl: null,
    selectedFile: null
  });
  const fileInputRef = useRef(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    email: '',
    phone: '',
    dateOfJoining: '',
    shortBio: '',
    profilePhoto: ''
  });

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Logout Confirm Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Sync formData with profile whenever profile updates
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        designation: profile.designation || '',
        department: profile.department || '',
        email: profile.email || '',
        phone: profile.phone || '',
        dateOfJoining: profile.dateOfJoining || '',
        shortBio: profile.shortBio || profile.bio || '',
        profilePhoto: profile.profilePhoto || ''
      });
    }
  }, [profile]);

  // Handle Edit Profile Form Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Email is required', 'error');
      return;
    }

    const success = updateProfile(formData);
    if (success) {
      setIsEditModalOpen(false);
    }
  };

  // Dynamic Profile Image Operations
  const currentPhotoUrl = profile?.profileImageUrl || profile?.profilePhoto || null;

  const handleOpenViewPhoto = () => {
    setPhotoModalState({
      isOpen: true,
      mode: 'view',
      previewUrl: null,
      selectedFile: null
    });
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file format (JPG, PNG, JPEG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Please select a valid image format (JPG, PNG, JPEG, WEBP)', 'error');
      return;
    }

    // Read image as Data URL for preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoModalState({
        isOpen: true,
        mode: 'upload_preview',
        previewUrl: reader.result,
        selectedFile: file
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhotoUpload = () => {
    if (!photoModalState.previewUrl) return;
    if (photoModalState.selectedFile && photoModalState.selectedFile.size > 2 * 1024 * 1024) {
      showToast('File size exceeds 2MB limit. Please choose a smaller image.', 'error');
      return;
    }

    const success = uploadProfilePhoto
      ? uploadProfilePhoto(photoModalState.previewUrl)
      : updateProfile({
          profileImageUrl: photoModalState.previewUrl,
          profilePhoto: photoModalState.previewUrl
        });

    if (success !== false) {
      setPhotoModalState({ isOpen: false, mode: 'view', previewUrl: null, selectedFile: null });
    }
  };

  const handleOpenDeleteConfirm = () => {
    setPhotoModalState({
      isOpen: true,
      mode: 'delete_confirm',
      previewUrl: null,
      selectedFile: null
    });
  };

  const handleConfirmDeletePhoto = () => {
    const success = deleteProfilePhoto
      ? deleteProfilePhoto()
      : updateProfile({
          profileImageUrl: null,
          profilePhoto: null
        });

    if (success !== false) {
      setPhotoModalState({ isOpen: false, mode: 'view', previewUrl: null, selectedFile: null });
    }
  };

  // Handle Password Change
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    // Successfully updated password simulation
    setPasswordSuccess('Password changed successfully!');
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('');
      showToast('Password updated securely!', 'success');
    }, 1200);
  };

  // Handle Logout
  const handleConfirmLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      localStorage.removeItem('ssgmce_user');
      localStorage.removeItem('ssgmce_token');
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('ssgmce_active_teacher');
      localStorage.removeItem('ssgmce_logged_in_teacher');
    } catch (_) {}
    window.location.href = 'login.html';
  };

  const completionPct = profileCompletion?.percentage || 0;
  const getProgressColor = () => {
    if (completionPct >= 80) return '#10B981';
    if (completionPct >= 50) return '#0B5CAD';
    return '#F59E0B';
  };

  // Fallback initial
  const initials = (profile?.name || 'Faculty')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1E293B' }}>
      
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'error' ? '#EF4444' : '#0B5CAD',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '13px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
          zIndex: 10000
        }}>
          {toast.text}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
          Faculty Profile
        </h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>
          Quick glanceable identity, institutional designation, and personal contact details.
        </p>
      </div>

      {/* Profile Completion Card (Links directly to Information Module) */}
      <div style={{
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
        border: '1px solid #DBEAFE',
        borderRadius: '14px',
        padding: '18px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(11, 92, 173, 0.05)'
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Profile Completion Status
            </span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: getProgressColor() }}>
              {completionPct}% Complete
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${completionPct}%`,
              height: '100%',
              backgroundColor: getProgressColor(),
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            {completionPct >= 100 
              ? 'Your faculty profile & portfolio are fully completed!'
              : 'Add qualifications, experience, awards & certificates in the Information module to reach 100%.'}
          </div>
        </div>

        <button
          onClick={() => {
            if (onNavigateToInformation) {
              onNavigateToInformation();
            } else if (window.TeacherApp && typeof window.TeacherApp.switchView === 'function') {
              window.TeacherApp.switchView('information');
            }
          }}
          style={{
            background: '#0B5CAD',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(11, 92, 173, 0.2)',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#094B8F'}
          onMouseOut={(e) => e.currentTarget.style.background = '#0B5CAD'}
        >
          <span>Open Detailed Information Module</span>
          <span>→</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        {/* Cover strip */}
        <div style={{
          height: '100px',
          background: 'linear-gradient(135deg, #0B5CAD 0%, #1E3A8A 60%, #0369A1 100%)',
          position: 'relative'
        }} />

        {/* Profile Header Content */}
        <div style={{ padding: '0 28px 24px 28px', marginTop: '-48px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Avatar & Key Titles */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '22px', flexWrap: 'wrap' }}>
              
              {/* Dynamic 120x120px Circular Frame with Hover Overlay & Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  onMouseEnter={() => setIsPhotoHovered(true)}
                  onMouseLeave={() => setIsPhotoHovered(false)}
                  style={{
                    position: 'relative',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 6px 18px rgba(11, 31, 58, 0.18)',
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Profile Photo Options"
                >
                  <Avatar
                    imageUrl={currentPhotoUrl}
                    name={profile?.name || 'Faculty Member'}
                    size={112}
                    fontSize="38px"
                  />

                  {/* Hover Overlay with Three Action Buttons: View, Upload/Change, Delete */}
                  {isPhotoHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(11, 31, 58, 0.72)',
                        backdropFilter: 'blur(2px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '50%',
                        zIndex: 2
                      }}
                    >
                      {/* View Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenViewPhoto();
                        }}
                        title="View Photo"
                        style={{
                          background: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          transition: 'transform 0.1s'
                        }}
                      >
                        👁️
                      </button>

                      {/* Upload/Change Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerUpload();
                        }}
                        title="Upload New Photo"
                        style={{
                          background: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          transition: 'transform 0.1s'
                        }}
                      >
                        ✏️
                      </button>

                      {/* Delete Button (if image exists) */}
                      {currentPhotoUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteConfirm();
                          }}
                          title="Remove Photo"
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '13px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            transition: 'transform 0.1s'
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Below Image: Three Clean Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleOpenViewPhoto}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#334155',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="View Photo"
                  >
                    <span>👁️</span> View
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerUpload}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#1D4ED8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Upload New Photo"
                  >
                    <span>📷</span> Upload
                  </button>

                  {currentPhotoUrl && (
                    <button
                      type="button"
                      onClick={handleOpenDeleteConfirm}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Remove Photo"
                    >
                      <span>🗑️</span> Remove
                    </button>
                  )}
                </div>

                {/* Hidden File Picker Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFilePicked}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Names and badges */}
              <div style={{ paddingBottom: '4px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: '#0F172A' }}>
                  {profile?.name || 'Faculty Member'}
                </h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: '1px solid #BFDBFE'
                  }}>
                    {profile?.designation || 'Faculty'}
                  </span>
                  <span style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {profile?.department || 'Engineering'}
                  </span>
                  <span style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>ID: {profile?.facultyId || 'EMP-1001'}</span>
                    <span style={{ fontSize: '11px', color: '#B45309' }}>🔒</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setFormData({
                    name: profile?.name || '',
                    designation: profile?.designation || '',
                    department: profile?.department || '',
                    email: profile?.email || '',
                    phone: profile?.phone || '',
                    dateOfJoining: profile?.dateOfJoining || '',
                    shortBio: profile?.shortBio || profile?.bio || '',
                    profilePhoto: profile?.profilePhoto || ''
                  });
                  setIsEditModalOpen(true);
                }}
                style={{
                  background: '#0B5CAD',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(11, 92, 173, 0.2)'
                }}
              >
                <span>✏️</span> Edit Profile
              </button>

              <button
                onClick={() => {
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                  setIsPasswordModalOpen(true);
                }}
                style={{
                  background: '#F8FAFC',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '9px 15px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🔑</span> Change Password
              </button>

              <button
                onClick={() => setIsLogoutModalOpen(true)}
                style={{
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  padding: '9px 15px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </div>

          {/* Short Bio (1-2 lines) */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '14px 18px',
            marginTop: '12px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              Short Bio
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.55 }}>
              {profile?.shortBio || profile?.bio || 'No bio added yet. Click "Edit Profile" to add a 1-2 line summary.'}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Identity & Contact Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Card 1: Official Institutional Information */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏛️</span> Institutional Details
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Faculty / Employee ID</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {profile?.facultyId || '—'}
                <span style={{ fontSize: '11px', color: '#94A3B8' }} title="Assigned by Administrator (Read-Only)">🔒</span>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Designation</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                {profile?.designation || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Department</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                {profile?.department || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Date of Joining</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                {profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Contact Information */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📞</span> Contact Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Official Email</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B5CAD' }}>
                {profile?.email || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Phone / Mobile</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                {profile?.phone || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Institution</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                SSGMCE Shegaon
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Account Status</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#15803D',
                background: '#DCFCE7',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                Active Faculty
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Helpful Direction Notice (Strict Separation between Profile & Information) */}
      <div style={{
        background: '#F1F5F9',
        border: '1px dashed #CBD5E1',
        borderRadius: '12px',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '26px' }}>📚</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>
              Looking for your Qualifications, Experience, or Uploaded Certificates?
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Detailed academic portfolio, research publications, workshop records, documents vault, and yearly reports are managed in the <strong>Information</strong> module.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (onNavigateToInformation) {
              onNavigateToInformation();
            } else if (window.TeacherApp && typeof window.TeacherApp.switchView === 'function') {
              window.TeacherApp.switchView('information');
            }
          }}
          style={{
            background: '#ffffff',
            color: '#0B5CAD',
            border: '1px solid #0B5CAD',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          View Full Portfolio →
        </button>
      </div>

      {/* MODAL 1: Edit Basic Profile */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC'
            }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0F172A' }}>
                Edit Basic Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Faculty ID (Read-only) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Faculty ID (Read-Only)
                </label>
                <input
                  type="text"
                  value={profile?.facultyId || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#F1F5F9',
                    color: '#64748B',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', display: 'block' }}>
                  Faculty ID is assigned by the college administration and cannot be changed.
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Designation & Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Date of Joining */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Date of Joining
                </label>
                <input
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Short Bio */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Short Bio (1-2 lines)
                </label>
                <textarea
                  rows={2}
                  value={formData.shortBio}
                  onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
                  placeholder="Assistant Professor in CSE specializing in..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#0B5CAD',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Password */}
      {isPasswordModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                Change Password
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {passwordError && (
                <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '600' }}>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div style={{ background: '#DCFCE7', color: '#15803D', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '600' }}>
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#0B5CAD',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Logout Confirmation */}
      {isLogoutModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚪</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
              Confirm Sign Out
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#64748B' }}>
              Are you sure you want to end your current faculty session?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                style={{
                  background: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Profile Image Modal (View, Upload Preview, Delete Confirmation) */}
      <ProfileImageModal
        isOpen={photoModalState.isOpen}
        mode={photoModalState.mode}
        imageUrl={currentPhotoUrl}
        previewUrl={photoModalState.previewUrl}
        selectedFile={photoModalState.selectedFile}
        facultyName={profile?.name || 'Faculty Member'}
        onClose={() => setPhotoModalState({ isOpen: false, mode: 'view', previewUrl: null, selectedFile: null })}
        onSaveUpload={handleSavePhotoUpload}
        onConfirmDelete={handleConfirmDeletePhoto}
        onTriggerUpload={handleTriggerUpload}
        onSwitchToDelete={handleOpenDeleteConfirm}
      />

    </div>
  );
}

/**
 * ProfileView
 * Wrapper providing FacultyInfoProvider context if needed.
 */
export default function ProfileView({ facultyId, onNavigateToInformation, onLogout }) {
  return (
    <FacultyInfoProvider facultyId={facultyId}>
      <ProfileViewInner onNavigateToInformation={onNavigateToInformation} onLogout={onLogout} />
    </FacultyInfoProvider>
  );
}

