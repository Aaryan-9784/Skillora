import React, { useState } from "react";
import { Star, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import marketplaceService from "../../services/marketplaceService";

export default function ReviewModal({ projectId, revieweeId, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [deadlineRating, setDeadlineRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment) {
      toast.error("Please enter a review feedback comment");
      return;
    }
    try {
      setLoading(true);
      await marketplaceService.createReview({
        projectId,
        revieweeId,
        rating,
        communicationRating,
        qualityRating,
        deadlineRating,
        comment,
      });
      toast.success("Review submitted! Rating score updated.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const RenderStarInput = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-300 font-medium">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 text-amber-400 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-4 h-4 ${star <= value ? "fill-amber-400 text-amber-400" : "text-gray-600"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0F1A] border border-white/10 p-6 rounded-2xl w-full max-w-md space-y-4 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Leave Project Review</h3>
            <p className="text-xs text-gray-400">Rate your experience and quality of work</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <RenderStarInput value={rating} onChange={setRating} label="Overall Rating" />
            <RenderStarInput value={communicationRating} onChange={setCommunicationRating} label="Communication" />
            <RenderStarInput value={qualityRating} onChange={setQualityRating} label="Work Quality" />
            <RenderStarInput value={deadlineRating} onChange={setDeadlineRating} label="Adherence to Deadline" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Feedback Comment</label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your collaboration, professionalism, and results..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-semibold text-sm text-black flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
