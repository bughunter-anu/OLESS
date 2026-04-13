if (!requireAuth(['admin'])) {
    // Redirect already handled in requireAuth
} else {
    document.addEventListener('DOMContentLoaded', () => {
        loadDashboardStats();
        loadUsers();
        loadSubjects();
        loadQuestions();
        loadExams();
        loadResults();
        updateUserDisplay();
        setupEventListeners();
        loadSubjectSelects();
    });
}

async function loadDashboardStats() {
    try {
        const response = await AdminAPI.getDashboardStats();
        if (response.success) {
            const data = response.data;
            
            document.getElementById('totalUsers').textContent = data.totalUsers || 0;
            document.getElementById('totalStudents').textContent = data.totalStudents || 0;
            document.getElementById('totalSubjects').textContent = data.totalSubjects || 0;
            document.getElementById('totalQuestions').textContent = data.totalQuestions || 0;
            
            renderRecentResults(data.recentResults || []);
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

function renderRecentResults(results) {
    const tbody = document.getElementById('recentResultsTable');
    if (!tbody) return;
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No recent results</td></tr>';
        return;
    }
    
    tbody.innerHTML = results.map(result => `
        <tr>
            <td>${escapeHtml(result.first_name)} ${escapeHtml(result.last_name)}</td>
            <td>${escapeHtml(result.exam_name)}</td>
            <td>${result.total_score}/${result.total_marks}</td>
            <td><span class="badge ${getStatusClass(result.result_status)}">${capitalize(result.result_status)}</span></td>
        </tr>
    `).join('');
}

async function loadUsers(page = 1) {
    const search = document.getElementById('userSearch')?.value || '';
    const role = document.getElementById('roleFilter')?.value || '';
    
    try {
        const response = await AdminAPI.getUsers({ page, search, role });
        if (response.success) {
            renderUsers(response.data.users);
            renderUsersPagination(response.data.pagination);
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td><code>${escapeHtml(user.user_id)}</code></td>
            <td>${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-danger' : user.role === 'operator' ? 'badge-warning' : 'badge-primary'}">${capitalize(user.role)}</span></td>
            <td><span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>${user.last_login ? formatDateTime(user.last_login) : 'Never'}</td>
            <td class="actions-cell">
                <button class="action-btn" onclick="editUser(${user.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn danger" onclick="deleteUser(${user.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderUsersPagination(pagination) {
    const container = document.getElementById('usersPagination');
    if (!container) return;
    
    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = '';
    container.appendChild(createPagination(pagination.page, pagination.pages, loadUsers));
}

async function loadSubjects() {
    try {
        const response = await SubjectAPI.getAll();
        if (response.success) {
            renderSubjects(response.data.subjects);
        }
    } catch (error) {
        console.error('Failed to load subjects:', error);
    }
}

function renderSubjects(subjects) {
    const tbody = document.getElementById('subjectsTable');
    if (!tbody) return;
    
    if (subjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No subjects found</td></tr>';
        return;
    }
    
    tbody.innerHTML = subjects.map(subject => `
        <tr>
            <td><code>${escapeHtml(subject.subject_code)}</code></td>
            <td>${escapeHtml(subject.subject_name)}</td>
            <td>${truncate(subject.description || 'No description', 40)}</td>
            <td>${subject.credit_hours || 3}</td>
            <td><span class="badge badge-info">0</span></td>
            <td class="actions-cell">
                <button class="action-btn" onclick="editSubject(${subject.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn danger" onclick="deleteSubject(${subject.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadQuestions(page = 1) {
    const subjectId = document.getElementById('questionSubjectFilter')?.value || '';
    const questionType = document.getElementById('questionTypeFilter')?.value || '';
    const difficulty = document.getElementById('questionDifficultyFilter')?.value || '';
    const search = document.getElementById('questionSearch')?.value || '';
    
    try {
        const response = await QuestionAPI.getAll({ page, subjectId, questionType, difficulty, search });
        if (response.success) {
            renderQuestions(response.data.questions);
        }
    } catch (error) {
        console.error('Failed to load questions:', error);
    }
}

function renderQuestions(questions) {
    const tbody = document.getElementById('questionsTable');
    if (!tbody) return;
    
    if (questions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No questions found</td></tr>';
        return;
    }
    
    tbody.innerHTML = questions.map(q => `
        <tr>
            <td><code>${escapeHtml(q.question_code)}</code></td>
            <td>${truncate(escapeHtml(q.question_text), 60)}</td>
            <td>${escapeHtml(q.subject_name)}</td>
            <td><span class="badge badge-info">${q.question_type === 'mcq' ? 'MCQ' : 'T/F'}</span></td>
            <td><span class="badge ${getDifficultyClass(q.difficulty_level)}">${capitalize(q.difficulty_level)}</span></td>
            <td>${q.marks}</td>
            <td><span class="badge ${getStatusClass(q.approval_status)}">${capitalize(q.approval_status)}</span></td>
            <td class="actions-cell">
                <button class="action-btn" onclick="viewQuestion(${q.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editQuestion(${q.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn danger" onclick="deleteQuestion(${q.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadExams() {
    try {
        const response = await ExamAPI.getAll();
        if (response.success) {
            renderExams(response.data);
        }
    } catch (error) {
        console.error('Failed to load exams:', error);
    }
}

function renderExams(exams) {
    const tbody = document.getElementById('examsTable');
    if (!tbody) return;
    
    if (exams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No exams found</td></tr>';
        return;
    }
    
    tbody.innerHTML = exams.map(exam => `
        <tr>
            <td><code>${escapeHtml(exam.exam_code)}</code></td>
            <td>${escapeHtml(exam.exam_name)}</td>
            <td>${escapeHtml(exam.subject_name)}</td>
            <td>${exam.duration_minutes} min</td>
            <td>${exam.total_questions}</td>
            <td><span class="badge ${getDifficultyClass(exam.exam_level)}">${capitalize(exam.exam_level)}</span></td>
            <td><span class="badge ${exam.is_active ? 'badge-success' : 'badge-danger'}">${exam.is_active ? 'Active' : 'Inactive'}</span></td>
            <td class="actions-cell">
                <button class="action-btn" onclick="viewExam(${exam.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editExam(${exam.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn danger" onclick="deleteExam(${exam.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadResults() {
    try {
        const response = await ResultAPI.getAll({ limit: 50 });
        if (response.success) {
            renderResults(response.data.results || []);
        }
    } catch (error) {
        console.error('Failed to load results:', error);
    }
}

function renderResults(results) {
    const tbody = document.getElementById('resultsTable');
    if (!tbody) return;
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No results found</td></tr>';
        return;
    }
    
    tbody.innerHTML = results.map(result => `
        <tr>
            <td><code>${escapeHtml(result.result_code)}</code></td>
            <td>${escapeHtml(result.first_name)} ${escapeHtml(result.last_name)}</td>
            <td>${escapeHtml(result.exam_name)}</td>
            <td>${result.total_score}/${result.total_marks}</td>
            <td>${result.percentage.toFixed(1)}%</td>
            <td><span class="badge ${getStatusClass(result.result_status)}">${capitalize(result.result_status)}</span></td>
            <td class="actions-cell">
                <button class="action-btn" onclick="viewResult(${result.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadSubjectSelects() {
    try {
        const response = await SubjectAPI.getAll();
        if (response.success) {
            const subjects = response.data.subjects;
            
            const selects = [
                'questionSubjectSelect',
                'examSubjectSelect',
                'questionSubjectFilter',
                'examSubjectFilter'
            ];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select && selectId !== 'questionSubjectFilter' && selectId !== 'examSubjectFilter') {
                    const currentOptions = select.querySelectorAll('option:not(:first-child)');
                    currentOptions.forEach(opt => opt.remove());
                    
                    subjects.forEach(subject => {
                        const option = document.createElement('option');
                        option.value = subject.id;
                        option.textContent = subject.subject_name;
                        select.appendChild(option);
                    });
                } else if (select) {
                    const currentOptions = select.querySelectorAll('option:not(:first-child)');
                    currentOptions.forEach(opt => opt.remove());
                    
                    subjects.forEach(subject => {
                        const option = document.createElement('option');
                        option.value = subject.id;
                        option.textContent = subject.subject_name;
                        select.appendChild(option);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Failed to load subjects for selects:', error);
    }
}

function setupEventListeners() {
    document.getElementById('userSearch')?.addEventListener('input', debounce(() => loadUsers(), 500));
    document.getElementById('roleFilter')?.addEventListener('change', () => loadUsers());
    
    document.getElementById('questionSearch')?.addEventListener('input', debounce(() => loadQuestions(), 500));
    document.getElementById('questionSubjectFilter')?.addEventListener('change', () => loadQuestions());
    document.getElementById('questionTypeFilter')?.addEventListener('change', () => loadQuestions());
    document.getElementById('questionDifficultyFilter')?.addEventListener('change', () => loadQuestions());
    
    document.getElementById('questionType')?.addEventListener('change', (e) => {
        const mcqOptions = document.getElementById('mcqOptions');
        if (mcqOptions) {
            mcqOptions.style.display = e.target.value === 'mcq' ? 'block' : 'none';
        }
    });
    
    document.getElementById('questionSubjectSelect')?.addEventListener('change', async (e) => {
        if (e.target.value) {
            try {
                const response = await SubjectAPI.getTopics({ subjectId: e.target.value });
                if (response.success) {
                    const topicSelect = document.getElementById('questionTopicSelect');
                    if (topicSelect) {
                        topicSelect.innerHTML = '<option value="">Select Topic (Optional)</option>';
                        response.data.forEach(topic => {
                            const option = document.createElement('option');
                            option.value = topic.id;
                            option.textContent = topic.topic_name;
                            topicSelect.appendChild(option);
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to load topics:', error);
            }
        }
    });
    
    document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await AdminAPI.createUser(data);
            if (response.success) {
                showToast('User created successfully', 'success');
                closeModal('addUserModal');
                e.target.reset();
                loadUsers();
                loadDashboardStats();
            } else {
                showToast(response.message || 'Failed to create user', 'error');
            }
        } catch (error) {
            showToast('Failed to create user', 'error');
        }
    });
    
    document.getElementById('addSubjectForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.creditHours = parseInt(data.creditHours);
        
        try {
            const response = await SubjectAPI.create(data);
            if (response.success) {
                showToast('Subject created successfully', 'success');
                closeModal('addSubjectModal');
                e.target.reset();
                loadSubjects();
                loadDashboardStats();
                loadSubjectSelects();
            } else {
                showToast(response.message || 'Failed to create subject', 'error');
            }
        } catch (error) {
            showToast('Failed to create subject', 'error');
        }
    });
    
    document.getElementById('addQuestionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.subjectId = parseInt(data.subjectId);
        data.topicId = data.topicId ? parseInt(data.topicId) : null;
        data.marks = parseInt(data.marks) || 1;
        data.negativeMarks = parseFloat(data.negativeMarks) || 0;
        
        try {
            const response = await QuestionAPI.create(data);
            if (response.success) {
                showToast('Question created successfully', 'success');
                closeModal('addQuestionModal');
                e.target.reset();
                loadQuestions();
                loadDashboardStats();
            } else {
                showToast(response.message || 'Failed to create question', 'error');
            }
        } catch (error) {
            showToast('Failed to create question', 'error');
        }
    });
    
    document.getElementById('addExamForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.subjectId = parseInt(data.subjectId);
        data.durationMinutes = parseInt(data.durationMinutes) || 60;
        data.totalQuestions = parseInt(data.totalQuestions) || 20;
        data.totalMarks = parseInt(data.totalMarks) || 100;
        data.passingMarks = parseInt(data.passingMarks) || 40;
        
        try {
            const response = await ExamAPI.create(data);
            if (response.success) {
                showToast('Exam created successfully', 'success');
                closeModal('addExamModal');
                e.target.reset();
                loadExams();
                loadDashboardStats();
            } else {
                showToast(response.message || 'Failed to create exam', 'error');
            }
        } catch (error) {
            showToast('Failed to create exam', 'error');
        }
    });
    
    document.getElementById('policiesForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const policies = {
            default_duration: document.getElementById('defaultDuration').value,
            default_questions: document.getElementById('defaultQuestions').value,
            passing_percentage: document.getElementById('passingPercentage').value,
            max_login_attempts: document.getElementById('maxLoginAttempts').value,
            prevent_copy_paste: document.getElementById('preventCopyPaste').checked.toString(),
            detect_tab_switch: document.getElementById('detectTabSwitch').checked.toString()
        };
        
        try {
            for (const [key, value] of Object.entries(policies)) {
                await AdminAPI.updatePolicy({ policyKey: key, policyValue: value });
            }
            showToast('Policies saved successfully', 'success');
        } catch (error) {
            showToast('Failed to save policies', 'error');
        }
    });
}

function viewQuestion(id) {
    console.log('View question:', id);
}

function editQuestion(id) {
    console.log('Edit question:', id);
}

async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
        const response = await QuestionAPI.delete(id);
        if (response.success) {
            showToast('Question deleted successfully', 'success');
            loadQuestions();
            loadDashboardStats();
        }
    } catch (error) {
        showToast('Failed to delete question', 'error');
    }
}

function viewExam(id) {
    console.log('View exam:', id);
}

function editExam(id) {
    console.log('Edit exam:', id);
}

async function deleteExam(id) {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    
    try {
        const response = await ExamAPI.delete(id);
        if (response.success) {
            showToast('Exam deleted successfully', 'success');
            loadExams();
            loadDashboardStats();
        }
    } catch (error) {
        showToast('Failed to delete exam', 'error');
    }
}

function viewResult(id) {
    console.log('View result:', id);
}

function editUser(id) {
    console.log('Edit user:', id);
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await AdminAPI.deleteUser(id);
        if (response.success) {
            showToast('User deleted successfully', 'success');
            loadUsers();
            loadDashboardStats();
        }
    } catch (error) {
        showToast('Failed to delete user', 'error');
    }
}

function editSubject(id) {
    console.log('Edit subject:', id);
}

async function deleteSubject(id) {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    try {
        const response = await SubjectAPI.delete(id);
        if (response.success) {
            showToast('Subject deleted successfully', 'success');
            loadSubjects();
            loadDashboardStats();
            loadSubjectSelects();
        }
    } catch (error) {
        showToast('Failed to delete subject', 'error');
    }
}
