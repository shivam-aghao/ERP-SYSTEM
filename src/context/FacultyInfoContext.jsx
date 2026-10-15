import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getProfileData,
  updateProfileData,
  getFacultyInfo,
  updateFacultyPersonalDetails,
  addFacultySectionItem,
  updateFacultySectionItem,
  deleteFacultySectionItem,
  addFacultyDocument,
  deleteFacultyDocument,
  generateYearlyReport,
  calculateProfileCompletion,
  updateProfileImage,
  deleteProfileImage
} from '../data/mockTeacherData';

const FacultyInfoContext = createContext(null);

export function FacultyInfoProvider({ children, facultyId }) {
  // Resolve active logged-in faculty ID with session fallback
  const resolveInitialId = () => {
    if (facultyId) return facultyId;
    try {
      const stored = JSON.parse(
        localStorage.getItem('ssgmce_user') ||
        localStorage.getItem('ssgmce_active_teacher') ||
        localStorage.getItem('ssgmce_logged_in_teacher') ||
        '{}'
      );
      if (stored.emp_code) return stored.emp_code;
      if (stored.facultyId) return stored.facultyId;
      if (stored.id) return stored.id;
    } catch (_) {}
    return "EMP-CSE-1001";
  };

  const [activeFacultyId, setActiveFacultyId] = useState(resolveInitialId);
  const [profile, setProfile] = useState(null);
  const [facultyInfo, setFacultyInfo] = useState(null);
  const [toast, setToast] = useState(null);

  // Sync prop changes
  useEffect(() => {
    if (facultyId && facultyId !== activeFacultyId) {
      setActiveFacultyId(facultyId);
    }
  }, [facultyId, activeFacultyId]);

  // Load both basic profile and detailed portfolio records with strict isolation
  const refreshFacultyData = useCallback(() => {
    const prof = getProfileData(activeFacultyId);
    const info = getFacultyInfo(activeFacultyId);
    setProfile(prof);
    setFacultyInfo(info);
  }, [activeFacultyId]);

  useEffect(() => {
    refreshFacultyData();
  }, [refreshFacultyData]);

  // Toast notification helper
  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Compute profile completion score
  const profileCompletion = useMemo(() => {
    return calculateProfileCompletion(facultyInfo);
  }, [facultyInfo]);

  // Basic Profile Operations (Minimal Glanceable Identity)
  const handleUpdateProfile = useCallback((basicInfo) => {
    const updated = updateProfileData(activeFacultyId, basicInfo);
    if (updated) {
      refreshFacultyData();
      showToast('Profile updated successfully!', 'success');
      return true;
    }
    showToast('Failed to update profile', 'error');
    return false;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  const handleUploadProfilePhoto = useCallback((imageUrl) => {
    const updated = updateProfileImage(activeFacultyId, imageUrl);
    if (updated) {
      refreshFacultyData();
      showToast('Profile photo updated successfully.', 'success');
      return true;
    }
    showToast('Failed to update profile photo', 'error');
    return false;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  const handleDeleteProfilePhoto = useCallback(() => {
    const updated = deleteProfileImage(activeFacultyId);
    if (updated) {
      refreshFacultyData();
      showToast('Profile photo removed successfully.', 'success');
      return true;
    }
    showToast('Failed to remove profile photo', 'error');
    return false;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  // Operations for Detailed Portfolio
  const handleUpdatePersonalDetails = useCallback((details) => {
    const updated = updateFacultyPersonalDetails(activeFacultyId, details);
    if (updated) {
      refreshFacultyData();
      showToast('Personal details updated successfully!', 'success');
      return true;
    }
    showToast('Failed to update personal details', 'error');
    return false;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  const handleAddItem = useCallback((sectionKey, item) => {
    const res = addFacultySectionItem(activeFacultyId, sectionKey, item);
    if (res && res.updatedFaculty) {
      refreshFacultyData();
      showToast(`New ${sectionKey.replace(/([A-Z])/g, ' $1').toLowerCase()} entry added!`, 'success');
      return true;
    }
    showToast('Failed to add entry', 'error');
    return false;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  const handleUpdateItem = useCallback((sectionKey, itemId, updatedItem) => {
    const updated = updateFacultySectionItem(activeFacultyId, sectionKey, itemId, updatedItem);
    if (updated) {
      refreshFacultyData();
      showToast('Record updated successfully!', 'success');
      return true;
    }
    showToast('Failed to update record', 'error');
    return false;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  const handleDeleteItem = useCallback((sectionKey, itemId) => {
    const updated = deleteFacultySectionItem(activeFacultyId, sectionKey, itemId);
    if (updated) {
      refreshFacultyData();
      showToast('Record deleted.', 'info');
      return true;
    }
    showToast('Failed to delete record', 'error');
    return false;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  const handleAddDocument = useCallback((doc) => {
    const newDoc = addFacultyDocument(activeFacultyId, doc);
    if (newDoc) {
      refreshFacultyData();
      showToast('Document uploaded to vault!', 'success');
      return newDoc;
    }
    showToast('Failed to upload document', 'error');
    return null;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  const handleDeleteDocument = useCallback((docId) => {
    const updated = deleteFacultyDocument(activeFacultyId, docId);
    if (updated) {
      refreshFacultyData();
      showToast('Document removed from vault.', 'info');
      return true;
    }
    showToast('Failed to delete document', 'error');
    return false;
  }, [activeFacultyId, refreshFacultyData, showToast]);

  const handleGenerateReport = useCallback((year) => {
    return generateYearlyReport(activeFacultyId, year);
  }, [activeFacultyId]);

  const value = {
    activeFacultyId,
    setActiveFacultyId,
    // Separate State Slices
    profile,
    facultyInfo,
    profileCompletion,
    toast,
    showToast,
    refreshFacultyData,
    refreshFacultyInfo: refreshFacultyData,
    // Profile Actions
    updateProfile: handleUpdateProfile,
    uploadProfilePhoto: handleUploadProfilePhoto,
    deleteProfilePhoto: handleDeleteProfilePhoto,
    // Portfolio Actions
    updatePersonalDetails: handleUpdatePersonalDetails,
    addItem: handleAddItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
    addDocument: handleAddDocument,
    deleteDocument: handleDeleteDocument,
    generateReport: handleGenerateReport
  };

  return (
    <FacultyInfoContext.Provider value={value}>
      {children}
    </FacultyInfoContext.Provider>
  );
}

export function useFacultyInfo() {
  const context = useContext(FacultyInfoContext);
  if (!context) {
    throw new Error('useFacultyInfo must be used within a FacultyInfoProvider');
  }
  return context;
}

export default FacultyInfoContext;

