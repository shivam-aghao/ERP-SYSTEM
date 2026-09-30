/**
 * SSGMCE Autonomous College ERP - Student Profile Module Script (profile.js)
 * Shri Sant Gajanan Maharaj College of Engineering, Shegaon
 */

document.addEventListener('DOMContentLoaded', () => {
    initProfileAuth();
    initMobileDrawer();
    initPhotoUpload();
    initEditProfileModal();
    initDocumentModal();
    initHeaderDropdowns();
    initGlobalSearch();
    loadSavedProfileData();
});

/* ==========================================================================
   1. AUTHENTICATION & HEADER HYDRATION
   ========================================================================== */
function initProfileAuth() {
    if (window.ERPAuth) {
        const session = window.ERPAuth.guard('student');
        if (session && typeof window.ERPAuth.hydrateHeader === 'function') {
            window.ERPAuth.hydrateHeader();
        }
    }
}

/* ==========================================================================
   2. MOBILE DRAWER & NAVIGATION
   ========================================================================== */
function initMobileDrawer() {
    const toggleBtn = document.getElementById('mobileMenuToggle') || document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('dashboardSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (!toggleBtn || !sidebar) return;

    function openDrawer() {
        sidebar.classList.add('mobile-open');
        if (backdrop) backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        sidebar.classList.remove('mobile-open');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('mobile-open')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    });

    if (backdrop) {
        backdrop.addEventListener('click', closeDrawer);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeDrawer();
        }
    });
}

/* ==========================================================================
   3. PROFILE PHOTO UPLOAD & CACHING
   ========================================================================== */
function initPhotoUpload() {
    const photoUpload = document.getElementById('photoUpload');
    const studentPhoto = document.getElementById('studentPhoto');

    // Restore cached avatar if present
    const savedAvatar = localStorage.getItem('ssgmce_student_avatar');
    if (savedAvatar && studentPhoto) {
        studentPhoto.src = savedAvatar;
    }

    if (!photoUpload || !studentPhoto) return;

    photoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file (PNG, JPG, WEBP).', 'warning');
            photoUpload.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('Image size should be less than 2 MB.', 'warning');
            photoUpload.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            studentPhoto.src = dataUrl;
            try {
                localStorage.setItem('ssgmce_student_avatar', dataUrl);
            } catch (err) {
                console.warn('Avatar could not be stored in localStorage:', err);
            }
            showToast('Profile photo updated successfully!', 'success');
        };
        reader.readAsDataURL(file);
    });
}

/* ==========================================================================
   4. EDIT PROFILE MODAL & LOCAL PERSISTENCE
   ========================================================================== */
function initEditProfileModal() {
    const editBtn = document.querySelector('.edit-profile-btn') || document.getElementById('btnEditProfile');
    const modal = document.getElementById('editProfileModal');
    const form = document.getElementById('editProfileForm');

    if (editBtn) {
        editBtn.addEventListener('click', () => openEditProfileModal());
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileChanges();
        });
    }
}

function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (!modal) {
        showToast('Profile editor is currently ready.', 'info');
        return;
    }

    // Pre-populate modal form with current values
    const mobileField = document.getElementById('inputMobile');
    const emailField = document.getElementById('inputEmail');
    const bloodField = document.getElementById('inputBloodGroup');
    const emergencyField = document.getElementById('inputEmergency');
    const addressField = document.getElementById('inputAddress');

    const valMobile = document.getElementById('valMobile') || document.getElementById('valCardMobile');
    const valEmail = document.getElementById('valEmail') || document.getElementById('valCardEmail');
    const valBlood = document.getElementById('valBloodGroup');
    const valEmerg = document.getElementById('valEmergency');
    const valAddr = document.getElementById('valAddress');

    if (mobileField && valMobile) mobileField.value = valMobile.textContent.trim();
    if (emailField && valEmail) emailField.value = valEmail.textContent.trim();
    if (bloodField && valBlood) bloodField.value = valBlood.textContent.trim();
    if (emergencyField && valEmerg) emergencyField.value = valEmerg.textContent.trim();
    if (addressField && valAddr) addressField.value = valAddr.textContent.trim();

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function saveProfileChanges() {
    const mobile = document.getElementById('inputMobile')?.value.trim();
    const email = document.getElementById('inputEmail')?.value.trim();
    const blood = document.getElementById('inputBloodGroup')?.value.trim();
    const emergency = document.getElementById('inputEmergency')?.value.trim();
    const address = document.getElementById('inputAddress')?.value.trim();

    const data = { mobile, email, blood, emergency, address };

    // Update UI elements
    if (mobile) {
        const el1 = document.getElementById('valMobile');
        const el2 = document.getElementById('valCardMobile');
        if (el1) el1.textContent = mobile;
        if (el2) el2.textContent = mobile;
    }
    if (email) {
        const el1 = document.getElementById('valEmail');
        const el2 = document.getElementById('valCardEmail');
        if (el1) el1.textContent = email;
        if (el2) el2.textContent = email;
    }
    if (blood) {
        const el = document.getElementById('valBloodGroup');
        if (el) el.textContent = blood;
    }
    if (emergency) {
        const el = document.getElementById('valEmergency');
        if (el) el.textContent = emergency;
    }
    if (address) {
        const el = document.getElementById('valAddress');
        if (el) el.textContent = address;
    }

    try {
        localStorage.setItem('ssgmce_student_profile_data', JSON.stringify(data));
    } catch (e) {
        console.warn('Profile data could not be saved to localStorage:', e);
    }

    closeEditProfileModal();
    showToast('Profile information updated successfully!', 'success');
}

function loadSavedProfileData() {
    try {
        const raw = localStorage.getItem('ssgmce_student_profile_data');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.mobile) {
            const el1 = document.getElementById('valMobile');
            const el2 = document.getElementById('valCardMobile');
            if (el1) el1.textContent = data.mobile;
            if (el2) el2.textContent = data.mobile;
        }
        if (data.email) {
            const el1 = document.getElementById('valEmail');
            const el2 = document.getElementById('valCardEmail');
            if (el1) el1.textContent = data.email;
            if (el2) el2.textContent = data.email;
        }
        if (data.blood) {
            const el = document.getElementById('valBloodGroup');
            if (el) el.textContent = data.blood;
        }
        if (data.emergency) {
            const el = document.getElementById('valEmergency');
            if (el) el.textContent = data.emergency;
        }
        if (data.address) {
            const el = document.getElementById('valAddress');
            if (el) el.textContent = data.address;
        }
    } catch (e) {
        console.warn('Error reading saved profile data:', e);
    }
}

/* ==========================================================================
   5. DOCUMENT MODAL & VERIFICATION
   ========================================================================== */
let activeDocumentType = null;

function initDocumentModal() {
    document.querySelectorAll('.profile-document-card').forEach((card, index) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const types = ['id-card', 'grade-cards', 'bonafide'];
            viewDocument(types[index] || 'id-card');
        });
    });
}

function viewDocument(docType) {
    activeDocumentType = docType;
    const modal = document.getElementById('documentModal');
    const titleEl = document.getElementById('docModalTitle');
    const bodyEl = document.getElementById('docModalBody');

    if (!modal) {
        showToast('Document verification preview is loaded.', 'info');
        return;
    }

    const docDetails = {
        'id-card': {
            title: 'SSGMCE Smart RFID Identity Card',
            html: `
                <div style="border:2px solid var(--primary); border-radius:12px; padding:20px; background:#F8FAFC; text-align:center;">
                    <div style="font-weight:800; color:var(--navy); font-size:1.1rem;">SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING</div>
                    <div style="font-size:0.8rem; color:var(--primary); font-weight:600; margin-bottom:14px;">An Autonomous Institute • Shegaon - 444503</div>
                    <div style="display:flex; justify-content:center; margin-bottom:12px;">
                        <div style="width:75px; height:85px; border-radius:8px; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:800;">SA</div>
                    </div>
                    <div style="font-size:1.05rem; font-weight:700; color:var(--navy);">SHIVAM SANJAY AGHAO</div>
                    <div style="font-size:0.85rem; color:var(--muted);">Roll No: 21 • PRN: 202401088219</div>
                    <div style="font-size:0.85rem; color:var(--text); font-weight:600; margin-top:6px;">B.Tech Computer Science &amp; Engineering</div>
                    <div style="margin-top:14px; padding:6px 12px; background:rgba(16,185,129,0.12); color:#10B981; font-weight:700; font-size:0.75rem; border-radius:999px; display:inline-block;">
                        ✓ ACTIVE INSTITUTIONAL RFID • VALID THRU 2028
                    </div>
                </div>
            `
        },
        'grade-cards': {
            title: 'Autonomous Semester Grade Cards (Sem I - IV)',
            html: `
                <table class="attendance-data-table" style="width:100%; font-size:0.85rem;">
                    <thead>
                        <tr>
                            <th>Semester</th>
                            <th>Credits Earned</th>
                            <th>SGPA</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Semester I</td><td>22 / 22</td><td><strong>8.42</strong></td><td><span class="status-badge" style="background:#ECFDF5; color:#059669;">PASSED</span></td></tr>
                        <tr><td>Semester II</td><td>22 / 22</td><td><strong>8.58</strong></td><td><span class="status-badge" style="background:#ECFDF5; color:#059669;">PASSED</span></td></tr>
                        <tr><td>Semester III</td><td>21 / 21</td><td><strong>8.64</strong></td><td><span class="status-badge" style="background:#ECFDF5; color:#059669;">PASSED</span></td></tr>
                        <tr><td>Semester IV</td><td>21 / 21</td><td><strong>8.84</strong></td><td><span class="status-badge" style="background:#ECFDF5; color:#059669;">PASSED</span></td></tr>
                    </tbody>
                </table>
                <div style="margin-top:14px; text-align:right; font-weight:700; color:var(--navy);">
                    Cumulative CGPA: <span style="color:var(--primary); font-size:1.1rem;">8.64</span>
                </div>
            `
        },
        'bonafide': {
            title: 'Bonafide Certificate & Library Clearance',
            html: `
                <div style="border:1px dashed var(--border-color); padding:20px; border-radius:10px; background:#FFF;">
                    <div style="text-align:center; margin-bottom:12px;">
                        <strong style="color:var(--navy); font-size:1rem;">INSTITUTIONAL BONAFIDE CERTIFICATE</strong>
                        <div style="font-size:0.75rem; color:var(--muted);">Ref: SSGMCE/ACAD/2026/BONA-88219</div>
                    </div>
                    <p style="font-size:0.85rem; line-height:1.6; color:var(--text);">
                        This is to certify that <strong>Mr. Shivam Sanjay Aghao</strong> (Roll No: 21, PRN: 202401088219) is a bonafide student of <strong>Second Year B.Tech (Computer Science &amp; Engineering)</strong> at Shri Sant Gajanan Maharaj College of Engineering, Shegaon for the academic year 2025-2026.
                    </p>
                    <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:flex-end;">
                        <span style="font-size:0.75rem; color:var(--muted);">Issue Date: 15 Jan 2026</span>
                        <span style="font-size:0.8rem; font-weight:700; color:var(--primary);">Dean (Academics) Seal ✓</span>
                    </div>
                </div>
            `
        }
    };

    const doc = docDetails[docType] || docDetails['id-card'];
    if (titleEl) titleEl.textContent = doc.title;
    if (bodyEl) bodyEl.innerHTML = doc.html;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDocumentModal() {
    const modal = document.getElementById('documentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function downloadCurrentDocument() {
    showToast('Generating official digitally signed PDF...', 'info');
    setTimeout(() => {
        showToast('Document downloaded successfully!', 'success');
    }, 1000);
}

/* ==========================================================================
   6. HEADER DROPDOWNS & NAVIGATION SHORTCUTS
   ========================================================================== */
function initHeaderDropdowns() {
    const profileBtn = document.getElementById('profileBtn');
    const profilePanel = document.getElementById('profilePanel');
    const notifBtn = document.getElementById('notifBtn');
    const notifPanel = document.getElementById('notifPanel');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileBtn && profilePanel) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (notifPanel) notifPanel.classList.remove('active', 'open');
            profilePanel.classList.toggle('active');
            profilePanel.classList.toggle('open');
        });
    }

    if (notifBtn && notifPanel) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profilePanel) profilePanel.classList.remove('active', 'open');
            notifPanel.classList.toggle('active');
            notifPanel.classList.toggle('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (profilePanel && !profilePanel.contains(e.target) && profileBtn && !profileBtn.contains(e.target)) {
            profilePanel.classList.remove('active', 'open');
        }
        if (notifPanel && !notifPanel.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
            notifPanel.classList.remove('active', 'open');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.ERPAuth && typeof window.ERPAuth.logout === 'function') {
                window.ERPAuth.logout();
            } else {
                localStorage.removeItem('ssgmce_user_session');
                window.location.href = '../../../login page/frontend/login.html';
            }
        });
    }
}

/* ==========================================================================
   7. GLOBAL SEARCH FILTER (Ctrl+K)
   ========================================================================== */
function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if (!searchInput) return;

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const items = document.querySelectorAll('.profile-info-item, .profile-contact-card, .profile-document-card');

        items.forEach((item) => {
            if (!query) {
                item.style.display = '';
                item.style.opacity = '1';
                return;
            }
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = '';
                item.style.opacity = '1';
                item.style.background = '#FEF9C3';
                setTimeout(() => { item.style.background = ''; }, 1200);
            } else {
                item.style.opacity = '0.3';
            }
        });
    });
}

/* ==========================================================================
   8. TOAST NOTIFICATION UTILITY
   ========================================================================== */
function showToast(message, type = 'info') {
    let stack = document.getElementById('toastStack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'toastStack';
        stack.className = 'toast-stack';
        document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.style.cssText = `
        background: #0B1F3A;
        color: #FFFFFF;
        padding: 12px 18px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: toastSlideIn 0.3s ease;
        margin-top: 8px;
        border-left: 4px solid ${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : type === 'error' ? '#EF4444' : '#00A6D6'};
    `;

    toast.innerHTML = `<span>${message}</span>`;
    stack.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}
