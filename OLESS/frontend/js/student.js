if (!requireAuth(['student'])) {
    // Redirect already handled
} else {
    document.addEventListener('DOMContentLoaded', () => {
        loadStudentDashboard();
        loadAvailableExams();
        loadExamHistory();
        loadMyResults();
        loadProfile();
        updateUserDisplay();
        setupStudentEventListeners();
    });
}

let currentExamId = null;

async function loadStudentDashboard() {
    try {
        const response = await ResultAPI.getMyResults({ limit: 10 });
        if (response.success) {
            const stats = response.data.statistics;
            
            document.getElementById('totalExams').textContent = stats.total_exams || 0;
            document.getElementById('passedExams').textContent = stats.passed || 0;
            document.getElementById('avgScore').textContent = (stats.avg_percentage || 0).toFixed(1) + '%';
            document.getElementById('highestScore').textContent = (stats.highest_score || 0).toFixed(1) + '%';
            
            renderRecentPerformance(response.data.results || []);
        }
        
        const examsResponse = await ExamAPI.getAll();
        if (examsResponse.success) {
            renderUpcomingExams(examsResponse.data.slice(0, 3));
        }
    } catch (error) {
        console.error('Failed to load student dashboard:', error);
    }
}

function renderRecentPerformance(results) {
    const container = document.getElementById('recentPerformanceList');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>No Results Yet</h3>
                <p>Complete your first exam to see your performance</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = results.slice(0, 5).map(result => `
        <div class="performance-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div>
                <div style="font-weight: 500;">${escapeHtml(result.exam_name)}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${formatDate(result.generated_at)}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 600; font-size: 1.1rem;" class="${result.result_status === 'pass' ? 'text-success' : 'text-danger'}">
                    ${result.percentage.toFixed(1)}%
                </div>
                <span class="badge ${getStatusClass(result.result_status)}">${capitalize(result.result_status)}</span>
            </div>
        </div>
    `).join('');
}

function renderUpcomingExams(exams) {
    const container = document.getElementById('upcomingExamsList');
    if (!container) return;
    
    if (exams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No Exams Available</h3>
                <p>Check back later for new exams</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = exams.map(exam => `
        <div class="exam-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div>
                <div style="font-weight: 500;">${escapeHtml(exam.exam_name)}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(exam.subject_name)}</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="startExam(${exam.id})">
                <i class="fas fa-play"></i> Start
            </button>
        </div>
    `).join('');
}

async function loadAvailableExams() {
    try {
        const response = await ExamAPI.getAll();
        if (response.success) {
            renderAvailableExams(response.data);
            populateExamFilters(response.data);
        }
    } catch (error) {
        console.error('Failed to load available exams:', error);
    }
}

function populateExamFilters(exams) {
    const subjectSelect = document.getElementById('examSubjectFilter');
    if (!subjectSelect) return;
    
    const subjects = [...new Set(exams.map(e => JSON.stringify({ id: e.subject_id, name: e.subject_name })))];
    subjects.forEach(s => {
        const subject = JSON.parse(s);
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
    });
}

function renderAvailableExams(exams) {
    const grid = document.getElementById('availableExamsGrid');
    if (!grid) return;
    
    if (exams.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No Exams Available</h3>
                <p>Check back later for new exams</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = exams.map(exam => `
        <div class="exam-card">
            <div class="exam-card-header">
                <div>
                    <div class="exam-card-title">${escapeHtml(exam.exam_name)}</div>
                    <div class="exam-card-subject">${escapeHtml(exam.subject_name)}</div>
                </div>
                <span class="badge ${getDifficultyClass(exam.exam_level)}">${capitalize(exam.exam_level)}</span>
            </div>
            <div class="exam-card-meta">
                <span><i class="fas fa-clock"></i> ${exam.duration_minutes} min</span>
                <span><i class="fas fa-question-circle"></i> ${exam.total_questions} Qs</span>
                <span><i class="fas fa-star"></i> ${exam.total_marks} marks</span>
            </div>
            <div class="exam-card-footer">
                <span style="font-size: 0.85rem; color: var(--text-muted);">Pass: ${exam.passing_marks}%</span>
                <button class="btn btn-primary btn-sm" onclick="startExam(${exam.id})">
                    <i class="fas fa-play"></i> Start Exam
                </button>
            </div>
        </div>
    `).join('');
}

function startExam(examId) {
    currentExamId = examId;
    
    const exams = document.querySelectorAll('.exam-card');
    let examData = null;
    
    exams.forEach(card => {
        const btn = card.querySelector('button');
        if (btn && btn.onclick && btn.onclick.toString().includes(examId)) {
            examData = {
                name: card.querySelector('.exam-card-title')?.textContent,
                duration: card.querySelector('.exam-card-meta span:nth-child(1)')?.textContent?.replace(/\D/g, '') || '60',
                questions: card.querySelector('.exam-card-meta span:nth-child(2)')?.textContent?.replace(/\D/g, '') || '20',
                totalMarks: card.querySelector('.exam-card-meta span:nth-child(3)')?.textContent?.replace(/\D/g, '') || '100'
            };
        }
    });
    
    if (!examData) {
        ExamAPI.getById(examId).then(response => {
            if (response.success) {
                const exam = response.data;
                document.getElementById('modalExamName').textContent = exam.exam_name;
                document.getElementById('modalDuration').textContent = `${exam.duration_minutes} minutes`;
                document.getElementById('modalQuestions').textContent = `${exam.total_questions} Questions`;
                document.getElementById('modalTotalMarks').textContent = `${exam.total_marks} Marks`;
                showModal('startExamModal');
            }
        });
    } else {
        document.getElementById('modalExamName').textContent = examData.name;
        document.getElementById('modalDuration').textContent = `${examData.duration} minutes`;
        document.getElementById('modalQuestions').textContent = `${examData.questions} Questions`;
        document.getElementById('modalTotalMarks').textContent = `${examData.totalMarks} Marks`;
        showModal('startExamModal');
    }
}

async function confirmStartExam() {
    closeModal('startExamModal');
    
    try {
        showToast('Starting exam...', 'info');
        
        const response = await ExamAPI.start(currentExamId);
        
        if (response.success) {
            localStorage.setItem('examSession', JSON.stringify({
                sessionId: response.data.sessionId,
                examId: currentExamId,
                questions: response.data.questions,
                exam: response.data.exam
            }));
            
            window.location.href = 'exam.html';
        } else {
            showToast(response.message || 'Failed to start exam', 'error');
        }
    } catch (error) {
        showToast('Failed to start exam. Please try again.', 'error');
    }
}

async function loadExamHistory() {
    try {
        const response = await ExamAPI.getMySessions();
        if (response.success) {
            renderExamHistory(response.data);
        }
    } catch (error) {
        console.error('Failed to load exam history:', error);
    }
}

function renderExamHistory(sessions) {
    const tbody = document.getElementById('examHistoryTable');
    if (!tbody) return;
    
    if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No exam history</td></tr>';
        return;
    }
    
    tbody.innerHTML = sessions.map(session => `
        <tr>
            <td>${escapeHtml(session.exam_name)}</td>
            <td>${escapeHtml(session.subject_name)}</td>
            <td>${formatDateTime(session.start_time)}</td>
            <td>${session.score !== null ? `${session.score}/${session.total_marks}` : '-'}</td>
            <td><span class="badge ${getStatusClass(session.result_status || session.status)}">${capitalize(session.result_status || session.status)}</span></td>
            <td class="actions-cell">
                ${session.result_status ? `<button class="action-btn" onclick="viewExamResult('${session.session_id}')" title="View Result"><i class="fas fa-eye"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function loadMyResults() {
    try {
        const response = await ResultAPI.getMyResults();
        if (response.success) {
            renderMyResults(response.data.results || []);
        }
    } catch (error) {
        console.error('Failed to load results:', error);
    }
}

function renderMyResults(results) {
    const container = document.getElementById('resultsContainer');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar"></i>
                <h3>No Results Yet</h3>
                <p>Complete exams to see your results here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Exam</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(result => `
                        <tr>
                            <td>${escapeHtml(result.exam_name)}</td>
                            <td>${escapeHtml(result.subject_name)}</td>
                            <td>${formatDate(result.generated_at)}</td>
                            <td>${result.total_score}/${result.total_marks}</td>
                            <td><strong>${result.percentage.toFixed(1)}%</strong></td>
                            <td><span class="badge ${getStatusClass(result.result_status)}">${capitalize(result.result_status)}</span></td>
                            <td class="actions-cell">
                                <button class="action-btn" onclick="viewResultDetail(${result.id})" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function viewResultDetail(resultId) {
    try {
        const response = await ResultAPI.getById(resultId);
        if (response.success) {
            const result = response.data;
            
            const analysisHtml = result.topicAnalysis && result.topicAnalysis.length > 0 ? `
                <div class="analysis-section" style="margin-top: 1.5rem;">
                    <h4 style="margin-bottom: 1rem;">Topic-wise Analysis</h4>
                    ${result.topicAnalysis.map(topic => `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                            <span>${escapeHtml(topic.topic_name || 'General')}</span>
                            <span class="badge ${topic.accuracy >= 70 ? 'badge-success' : topic.accuracy >= 40 ? 'badge-warning' : 'badge-danger'}">
                                ${topic.accuracy || 0}%
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : '';
            
            const strengthWeaknessHtml = (result.strengthWeakness && Object.keys(result.strengthWeakness).length > 0) ? `
                <div class="strength-weakness" style="margin-top: 1.5rem;">
                    <div style="margin-bottom: 1rem;">
                        <strong>Strengths:</strong>
                        <div class="topic-list" style="margin-top: 0.5rem;">
                            ${(result.strengthWeakness.strongest || []).map(t => `<span class="topic-tag strength">${escapeHtml(t)}</span>`).join('') || '<span style="color: var(--text-muted);">None</span>'}
                        </div>
                    </div>
                    <div>
                        <strong>Weaknesses:</strong>
                        <div class="topic-list" style="margin-top: 0.5rem;">
                            ${(result.strengthWeakness.weakest || []).map(t => `<span class="topic-tag weakness">${escapeHtml(t)}</span>`).join('') || '<span style="color: var(--text-muted);">None</span>'}
                        </div>
                    </div>
                </div>
            ` : '';
            
            document.getElementById('resultDetails').innerHTML = `
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 3rem; font-weight: 800;" class="${result.result_status === 'pass' ? 'text-success' : 'text-danger'}">
                        ${result.percentage.toFixed(1)}%
                    </div>
                    <span class="badge ${getStatusClass(result.result_status)}" style="font-size: 1rem;">
                        ${capitalize(result.result_status)} ${result.result_status === 'pass' ? '🎉' : '📚'}
                    </span>
                </div>
                
                <div class="result-details" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    <div class="result-detail">
                        <div class="result-detail-label">Exam</div>
                        <div class="result-detail-value">${escapeHtml(result.exam_name)}</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-label">Subject</div>
                        <div class="result-detail-value">${escapeHtml(result.subject_name)}</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-label">Score</div>
                        <div class="result-detail-value">${result.total_score}/${result.total_marks}</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-label">Correct</div>
                        <div class="result-detail-value">${result.correct_answers}</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-label">Wrong</div>
                        <div class="result-detail-value">${result.wrong_answers}</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-label">Unattempted</div>
                        <div class="result-detail-value">${result.unattempted}</div>
                    </div>
                </div>
                
                ${strengthWeaknessHtml}
            `;
            
            showModal('viewResultModal');
        }
    } catch (error) {
        showToast('Failed to load result details', 'error');
    }
}

async function viewExamResult(sessionId) {
    console.log('View exam result:', sessionId);
}

function loadProfile() {
    const user = getUser();
    if (!user) return;
    
    document.getElementById('profileUserId').textContent = user.userId || '-';
    document.getElementById('profileName').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('profileEmail').textContent = user.email || '-';
    document.getElementById('profileRole').textContent = capitalize(user.role) || '-';
    document.getElementById('profileDepartment').textContent = '-';
    document.getElementById('profileCreatedAt').textContent = '-';
    
    document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName)}+${encodeURIComponent(user.lastName)}&background=10b981&color=fff&size=120`;
}

function showEditProfile() {
    showToast('Profile editing coming soon', 'info');
}

function setupStudentEventListeners() {
    document.getElementById('examSubjectFilter')?.addEventListener('change', () => {
        filterAvailableExams();
    });
    
    document.getElementById('examLevelFilter')?.addEventListener('change', () => {
        filterAvailableExams();
    });
    
    document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        if (data.newPassword !== data.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        try {
            const response = await AuthAPI.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            
            if (response.success) {
                showToast('Password changed successfully', 'success');
                e.target.reset();
            } else {
                showToast(response.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            showToast('Failed to change password', 'error');
        }
    });
}

async function filterAvailableExams() {
    const subjectId = document.getElementById('examSubjectFilter')?.value || '';
    const level = document.getElementById('examLevelFilter')?.value || '';
    
    try {
        const response = await ExamAPI.getAll();
        if (response.success) {
            let filtered = response.data;
            
            if (subjectId) {
                filtered = filtered.filter(e => e.subject_id === parseInt(subjectId));
            }
            if (level) {
                filtered = filtered.filter(e => e.exam_level === level);
            }
            
            renderAvailableExams(filtered);
        }
    } catch (error) {
        console.error('Failed to filter exams:', error);
    }
}
