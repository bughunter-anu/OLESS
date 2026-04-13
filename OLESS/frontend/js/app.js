const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
};

const toggleTheme = () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    saveTheme(newTheme);
};

const showModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

const closeAllModals = () => {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
};

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeAllModals();
    }
    
    if (e.target.classList.contains('sidebar-overlay')) {
        toggleSidebar();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

const showSection = (sectionId) => {
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    const link = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
    if (link) {
        link.classList.add('active');
    }
    
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        const titles = {
            dashboard: 'Dashboard',
            users: 'User Management',
            subjects: 'Subjects',
            questions: 'Question Bank',
            exams: 'Exams',
            results: 'Results & Reports',
            settings: 'Settings',
            history: 'Exam History',
            profile: 'My Profile'
        };
        pageTitle.textContent = titles[sectionId] || 'Dashboard';
    }
    
    toggleSidebar();
};

document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });
    
    document.getElementById('sidebarOverlay')?.addEventListener('click', toggleSidebar);
    
    document.querySelector('.sidebar-close')?.addEventListener('click', toggleSidebar);
    
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
});

const updateUserDisplay = () => {
    const user = getUser();
    if (user) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        const userAvatarEl = document.getElementById('userAvatar');
        if (userAvatarEl) {
            userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName)}+${encodeURIComponent(user.lastName)}&background=10b981&color=fff`;
        }
    }
};

const getDifficultyClass = (level) => {
    const classes = {
        beginner: 'badge-success',
        intermediate: 'badge-info',
        advanced: 'badge-warning',
        expert: 'badge-danger',
        guru: 'badge-danger'
    };
    return classes[level] || 'badge-primary';
};

const getStatusClass = (status) => {
    const classes = {
        active: 'badge-success',
        inactive: 'badge-danger',
        pass: 'badge-success',
        fail: 'badge-danger',
        pending: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-danger'
    };
    return classes[status] || 'badge-primary';
};

const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
};

const truncate = (str, length = 50) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
};

const createPagination = (currentPage, totalPages, onPageChange) => {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    pagination.appendChild(prevBtn);
    
    if (start > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.textContent = '1';
        firstBtn.onclick = () => onPageChange(1);
        if (currentPage === 1) firstBtn.classList.add('active');
        pagination.appendChild(firstBtn);
        
        if (start > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '0 0.5rem';
            pagination.appendChild(dots);
        }
    }
    
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.onclick = () => onPageChange(i);
        if (i === currentPage) btn.classList.add('active');
        pagination.appendChild(btn);
    }
    
    if (end < totalPages) {
        if (end < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '0 0.5rem';
            pagination.appendChild(dots);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => onPageChange(totalPages);
        if (currentPage === totalPages) lastBtn.classList.add('active');
        pagination.appendChild(lastBtn);
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    pagination.appendChild(nextBtn);
    
    return pagination;
};

window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.showModal = showModal;
window.closeModal = closeModal;
window.showSection = showSection;
window.updateUserDisplay = updateUserDisplay;
window.getDifficultyClass = getDifficultyClass;
window.getStatusClass = getStatusClass;
window.capitalize = capitalize;
window.truncate = truncate;
window.createPagination = createPagination;
