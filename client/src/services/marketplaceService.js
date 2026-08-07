import api from "./api";

export const marketplaceService = {
  // Escrow
  depositEscrow: (data) => api.post("/escrow/deposit", data),
  releaseEscrow: (escrowId) => api.post(`/escrow/${escrowId}/release`),
  refundEscrow: (escrowId) => api.post(`/escrow/${escrowId}/refund`),
  getProjectEscrow: (projectId) => api.get(`/escrow/project/${projectId}`),

  // Reviews
  createReview: (data) => api.post("/reviews", data),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
  getProjectReviews: (projectId) => api.get(`/reviews/project/${projectId}`),

  // Work Submissions & Revisions
  createSubmission: (data) => api.post("/submissions", data),
  requestRevision: (submissionId, data) => api.patch(`/submissions/${submissionId}/revision`, data),
  approveSubmission: (submissionId, data) => api.patch(`/submissions/${submissionId}/approve`, data),
  getProjectSubmissions: (projectId) => api.get(`/submissions/project/${projectId}`),

  // Disputes
  createDispute: (data) => api.post("/disputes", data),
  getAllDisputes: () => api.get("/disputes"),
  resolveDispute: (disputeId, data) => api.patch(`/disputes/${disputeId}/resolve`, data),
  seedSampleDisputes: () => api.post("/disputes/seed"),

  // Public Freelancer Directory
  getFreelancers: (params) => api.get("/users/freelancers", { params }),
  getFreelancerProfile: (userId) => api.get(`/users/${userId}`),
};

export default marketplaceService;
