import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import * as clientPortalService from "../../services/clientPortalService";

const ClientProjects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    clientPortalService.getProjects().then(r => setProjects(r.data.data.projects));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Your Projects</h1>
      {projects.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <FolderOpen size={40} className="text-slate-600 mb-3" />
          <p className="text-slate-400">No projects yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((p) => (
            <div key={p._id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{p.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{p.description}</p>
                </div>
                <span className={`badge ${p.status === "completed" ? "badge-success" : "badge-brand"}`}>
                  {p.status}
                </span>
              </div>
              {p.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span><span>{p.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-muted rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientProjects;
