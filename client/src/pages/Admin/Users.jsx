import { useEffect, useState } from "react";
import { Search, Shield, Trash2 } from "lucide-react";
import useAdminStore from "../../store/adminStore";
import useConfirm from "../../hooks/useConfirm";

const AdminUsers = () => {
  const { users, total, fetchUsers, updateUser, deleteUser } = useAdminStore();
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const { confirm }         = useConfirm();

  useEffect(() => {
    fetchUsers({ search, page, limit: 20 });
  }, [search, page]);

  const handleRoleToggle = async (user) => {
    const newRole = user.role === "admin" ? "freelancer" : "admin";
    await updateUser(user._id, { role: newRole });
  };

  const handleDelete = async (user) => {
    const ok = await confirm(`Delete ${user.name}? This cannot be undone.`);
    if (ok) deleteUser(user._id);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Users ({total})</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..." className="input pl-9 w-64" />
        </div>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-dark-border">
            <tr className="text-left text-ink-secondary">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-dark-border last:border-0">
                <td className="px-4 py-3 font-medium text-slate-200">{user.name}</td>
                <td className="px-4 py-3 text-ink-secondary">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${user.role === "admin" ? "badge-brand" : "badge-neutral"}`}>{user.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${user.plan === "premium" ? "badge-brand" : user.plan === "pro" ? "badge-info" : "badge-neutral"}`}>{user.plan}</span>
                </td>
                <td className="px-4 py-3 text-ink-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button onClick={() => handleRoleToggle(user)} className="btn-ghost btn-sm" title="Toggle admin"><Shield size={14} /></button>
                  <button onClick={() => handleDelete(user)} className="btn-ghost btn-sm text-error hover:bg-error/10" title="Delete"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
