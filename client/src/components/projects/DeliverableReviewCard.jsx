import React, { useState, useEffect } from "react";
import { FileCheck, CheckCircle2, RotateCcw, ExternalLink, Clock, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import marketplaceService from "../../services/marketplaceService";

export default function DeliverableReviewCard({ projectId, userRole, onApproved }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await marketplaceService.getProjectSubmissions(projectId);
      setSubmissions(res.data?.submissions || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchSubmissions();
  }, [projectId]);

  const handleApprove = async (submissionId) => {
    if (!window.confirm("Approve this deliverable submission?")) return;
    try {
      setActionLoading(true);
      await marketplaceService.approveSubmission(submissionId, {
        clientFeedback: "Deliverables approved by client",
      });
      toast.success("Submission approved!");
      fetchSubmissions();
      if (onApproved) onApproved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve submission");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (submissionId) => {
    if (!revisionNotes) {
      toast.error("Please enter revision requirements/notes");
      return;
    }
    try {
      setActionLoading(true);
      await marketplaceService.requestRevision(submissionId, {
        clientFeedback: revisionNotes,
      });
      toast.success("Revision requested from freelancer");
      setActiveSubmissionId(null);
      setRevisionNotes("");
      fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request revision");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return null;
  if (!submissions.length) return null;

  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-[#0B0F1A] text-white space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <FileCheck className="w-5 h-5 text-indigo-400" />
        <h4 className="font-bold text-base">Project Deliverables & Submissions ({submissions.length})</h4>
      </div>

      <div className="space-y-3">
        {submissions.map((sub) => (
          <div
            key={sub._id}
            className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-3 relative"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Version {sub.version}
                </span>
                <h5 className="font-semibold text-base mt-1">{sub.title}</h5>
                <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{sub.description}</p>
              </div>
              <div>
                {sub.status === "submitted" && (
                  <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Pending Review
                  </span>
                )}
                {sub.status === "approved" && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Approved
                  </span>
                )}
                {sub.status === "revision_requested" && (
                  <span className="text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                    Revision Requested
                  </span>
                )}
              </div>
            </div>

            {sub.attachments?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {sub.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> {att.name || "Attachment"}
                  </a>
                ))}
              </div>
            )}

            {sub.clientFeedback && (
              <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs text-gray-300 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-200">Client Feedback:</span> {sub.clientFeedback}
                </div>
              </div>
            )}

            {userRole === "client" && sub.status === "submitted" && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => handleApprove(sub._id)}
                  disabled={actionLoading}
                  className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Deliverable
                </button>
                <button
                  onClick={() => setActiveSubmissionId(activeSubmissionId === sub._id ? null : sub._id)}
                  className="py-1.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 border border-rose-500/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Request Revision
                </button>
              </div>
            )}

            {activeSubmissionId === sub._id && (
              <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <textarea
                  rows={3}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Detail exact changes required for revision..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActiveSubmissionId(null)}
                    className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRequestRevision(sub._id)}
                    disabled={actionLoading}
                    className="px-4 py-1 rounded-lg bg-rose-600 text-xs font-semibold text-white"
                  >
                    Submit Revision Request
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
