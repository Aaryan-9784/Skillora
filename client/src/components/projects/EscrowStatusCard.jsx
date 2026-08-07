import React, { useState, useEffect } from "react";
import { ShieldCheck, DollarSign, ArrowUpRight, Lock, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import marketplaceService from "../../services/marketplaceService";

export default function EscrowStatusCard({ projectId, userRole, onRefresh }) {
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEscrow = async () => {
    try {
      setLoading(true);
      const res = await marketplaceService.getProjectEscrow(projectId);
      setEscrow(res.data?.escrow || null);
    } catch (err) {
      console.error("Failed to load escrow:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchEscrow();
  }, [projectId]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }
    try {
      setActionLoading(true);
      await marketplaceService.depositEscrow({
        projectId,
        amount: Number(depositAmount),
      });
      toast.success("Escrow funded successfully! Funds locked in vault.");
      setShowDepositModal(false);
      fetchEscrow();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fund escrow");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!window.confirm("Are you sure you want to release escrow funds to the freelancer?")) return;
    try {
      setActionLoading(true);
      await marketplaceService.releaseEscrow(escrow._id);
      toast.success("Funds successfully released from Escrow!");
      fetchEscrow();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to release escrow");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "funded":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-3.5 h-3.5" /> Funded & Locked
          </span>
        );
      case "released":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Funds Released
          </span>
        );
      case "disputed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Under Dispute
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Pending Deposit
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-white/10 bg-white/5 animate-pulse flex items-center justify-between">
        <div className="h-4 bg-white/10 rounded w-1/3"></div>
        <div className="h-6 bg-white/10 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1322] to-[#0B0F1A] shadow-xl text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-base flex items-center gap-2">
              Escrow Vault Protection
            </h4>
            <p className="text-xs text-gray-400">Secure payment holding mechanism</p>
          </div>
        </div>
        <div>{getStatusBadge(escrow?.status)}</div>
      </div>

      {escrow ? (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-gray-400 block mb-1">Total Escrow</span>
              <span className="font-semibold text-base text-emerald-400">${escrow.amount}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-gray-400 block mb-1">Platform Fee ({escrow.commissionPercentage}%)</span>
              <span className="font-semibold text-base text-gray-300">${escrow.commissionAmount}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-gray-400 block mb-1">Freelancer Payout</span>
              <span className="font-semibold text-base text-indigo-400">${escrow.netAmount}</span>
            </div>
          </div>

          {escrow.status === "funded" && (userRole === "client" || userRole === "admin") && (
            <button
              onClick={handleRelease}
              disabled={actionLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <ArrowUpRight className="w-4 h-4" /> Release Escrow Payout
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-gray-400">No funds deposited into escrow yet for this project.</p>
          {userRole === "client" && (
            <button
              onClick={() => setShowDepositModal(true)}
              className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-sm inline-flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" /> Deposit Escrow Funds
            </button>
          )}
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F1A] border border-white/10 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">Deposit Funds into Escrow</h3>
            <p className="text-xs text-gray-400">
              Funds are held securely by Skillora until deliverables are reviewed and approved.
            </p>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Deposit Amount ($)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
