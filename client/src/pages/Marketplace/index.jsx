import React, { useState, useEffect } from "react";
import { Search, Filter, Briefcase, DollarSign, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function MarketplacePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Web Development", "Mobile Apps", "UI/UX Design", "AI & Data", "Writing & Content"];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects/explore");
      setProjects(res.data?.data?.projects || res.data?.projects || []);
    } catch (err) {
      console.error("Failed to load marketplace projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-white p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-white/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Open Job Marketplace
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Explore Freelance Projects</h1>
          <p className="text-gray-300 text-sm">
            Discover open client projects, submit competitive proposals, and secure escrow funding.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or skills..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/5 rounded-2xl space-y-2">
          <Briefcase className="w-10 h-10 text-gray-500 mx-auto mb-2" />
          <h3 className="font-bold text-lg">No open projects found</h3>
          <p className="text-xs text-gray-400">Check back soon or adjust your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <div
              key={project._id}
              className="p-6 rounded-2xl border border-white/10 bg-[#0B0F1A] hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {project.category || "General"}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> ${project.budget}
                  </span>
                </div>

                <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-3">{project.description || "No description provided."}</p>

                {project.requiredSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.requiredSkills.slice(0, 4).map((sk, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Flexible"}
                </span>
                <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Submit Proposal <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
