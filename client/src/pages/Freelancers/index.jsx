import React, { useState, useEffect } from "react";
import { Search, Star, DollarSign, Award, CheckCircle, ExternalLink, UserCheck } from "lucide-react";
import marketplaceService from "../../services/marketplaceService";

export default function FreelancersDirectoryPage() {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      const res = await marketplaceService.getFreelancers({ search });
      setFreelancers(res.data?.freelancers || []);
    } catch (err) {
      console.error("Failed to load freelancers directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, [search]);

  return (
    <div className="space-y-6 text-white p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900 border border-white/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Top Talent Directory
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Hire Verified Freelancers</h1>
          <p className="text-gray-300 text-sm">
            Browse top-rated talent, view verified ratings, portfolios, and hire directly.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search freelancers by name or title..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-2xl bg-white/5 animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/5 rounded-2xl space-y-2">
          <UserCheck className="w-10 h-10 text-gray-500 mx-auto mb-2" />
          <h3 className="font-bold text-lg">No freelancers found</h3>
          <p className="text-xs text-gray-400">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((free) => (
            <div
              key={free._id}
              className="p-6 rounded-2xl border border-white/10 bg-[#0B0F1A] hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 border border-white/20 shadow-lg">
                    {free.avatar ? (
                      <img src={free.avatar} alt={free.name} className="w-full h-full object-cover" />
                    ) : (
                      free.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg line-clamp-1">{free.name}</h3>
                    <p className="text-xs text-purple-400 font-medium">{free.title || "Freelance Specialist"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center text-amber-400 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                        {free.averageRating || "5.0"}
                      </span>
                      <span className="text-[10px] text-gray-400">({free.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 line-clamp-3">{free.bio || "No bio provided."}</p>

                {free.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {free.skills.slice(0, 4).map((sk, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                        {sk.name || sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Hourly Rate</span>
                  <span className="font-bold text-sm text-emerald-400">${free.hourlyRate || 45}/hr</span>
                </div>
                <button
                  onClick={() => alert(`Hire request sent to ${free.name}`)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20"
                >
                  Hire Freelancer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
