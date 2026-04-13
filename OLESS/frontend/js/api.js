class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    clearAuth();
                    window.location.href = '../pages/login.html';
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

const api = new ApiClient(API_BASE);

const AuthAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.post('/auth/change-password', data)
};

const AdminAPI = {
    getDashboardStats: () => api.get('/admin/dashboard-stats'),
    getUsers: (params) => api.get('/admin/users', params),
    createUser: (data) => api.post('/admin/users', data),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getActivityLogs: (params) => api.get('/admin/activity-logs', params),
    getPolicies: () => api.get('/admin/policies'),
    updatePolicy: (data) => api.put('/admin/policies', data)
};

const SubjectAPI = {
    getAll: (params) => api.get('/subjects', params),
    getById: (id) => api.get(`/subjects/${id}`),
    create: (data) => api.post('/subjects', data),
    update: (id, data) => api.put(`/subjects/${id}`, data),
    delete: (id) => api.delete(`/subjects/${id}`),
    getTopics: (params) => api.get('/subjects/topics/all', params),
    createTopic: (data) => api.post('/subjects/topics', data),
    updateTopic: (id, data) => api.put(`/subjects/topics/${id}`, data),
    deleteTopic: (id) => api.delete(`/subjects/topics/${id}`)
};

const QuestionAPI = {
    getAll: (params) => api.get('/questions', params),
    getById: (id) => api.get(`/questions/${id}`),
    create: (data) => api.post('/questions', data),
    bulkCreate: (data) => api.post('/questions/bulk', data),
    update: (id, data) => api.put(`/questions/${id}`, data),
    approve: (id, status) => api.patch(`/questions/${id}/approve`, { status }),
    delete: (id) => api.delete(`/questions/${id}`),
    getStats: () => api.get('/questions/stats')
};

const ExamAPI = {
    getAll: (params) => api.get('/exams', params),
    getById: (id) => api.get(`/exams/${id}`),
    create: (data) => api.post('/exams', data),
    update: (id, data) => api.put(`/exams/${id}`, data),
    delete: (id) => api.delete(`/exams/${id}`),
    start: (examId) => api.post('/exams/start', { examId }),
    getMySessions: (params) => api.get('/exams/my-sessions', params),
    getSession: (sessionId) => api.get(`/exams/session/${sessionId}`),
    saveAnswer: (sessionId, questionId, answer) => 
        api.post(`/exams/session/${sessionId}/answer/${questionId}/${answer}`),
    submit: (sessionId) => api.post(`/exams/session/${sessionId}/submit`)
};

const ResultAPI = {
    getMyResults: (params) => api.get('/results/my-results', params),
    getById: (id) => api.get(`/results/my-results/${id}`),
    getByCode: (code) => api.get(`/results/code/${code}`),
    getAll: (params) => api.get('/results', params),
    getExamStats: (examId) => api.get(`/results/statistics/exam/${examId}`),
    getUserStats: (userId) => api.get(`/results/statistics/user/${userId}`),
    generateCertificate: (resultId) => api.get(`/results/${resultId}/certificate`)
};
