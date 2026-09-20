import { useState, useEffect } from "react";
import { Users, Activity, Image as ImageIcon, ShieldCheck, Mail, Calendar, MapPin, Search, User, Trash2 } from "lucide-react";
import { getAdminUsers, getAdminScans, adminDeleteUser, adminDeleteScan } from "../services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [usersData, scansData] = await Promise.all([
          getAdminUsers(),
          getAdminScans()
        ]);
        setUsers(usersData.users || []);
        setScans(scansData.scans || []);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user ${userName} and all their scans? This action cannot be undone.`)) {
      return;
    }
    try {
      await adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      // Also manually remove their scans from the UI to reflect backend cascade
      setScans(prev => prev.filter(s => s.user_id !== userId));
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan?")) {
      return;
    }
    try {
      await adminDeleteScan(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
    } catch (err) {
      alert("Failed to delete scan: " + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-emerald-600" },
    { label: "Total Scans", value: scans.length, icon: Activity, color: "text-blue-600" },
    { label: "Active Nodes", value: 4, icon: ShieldCheck, color: "text-purple-600" },
  ];

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-emerald-700 font-medium animate-pulse">Loading Admin Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50 text-gray-800">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border-b border-green-100 bg-white shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-green-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Nexus Command
          </h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and user analytics</p>
        </div>
        
        {/* Admin Tabs */}
        <div className="flex bg-green-50/60 p-1 rounded-xl border border-green-200 shadow-inner">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "overview" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-green-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "users" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-green-900"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("scans")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "scans" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-green-900"
            }`}
          >
            Scans Platform
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl border border-green-100 bg-white shadow-sm">
                  <div className={`p-3 rounded-xl bg-green-50 border border-green-200 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">{stat.label}</p>
                    <p className="text-3xl font-black text-green-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users Mini */}
              <div className="rounded-2xl border border-green-100 bg-white shadow-sm p-5">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" /> New Users
                </h3>
                <div className="flex flex-col gap-3">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-green-50/50 border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Scans Mini */}
              <div className="rounded-2xl border border-green-100 bg-white shadow-sm p-5">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" /> Latest Scans
                </h3>
                <div className="flex flex-col gap-3">
                  {scans.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-green-50/50 border border-green-100">
                      <div className="flex items-center gap-3">
                        {s.image_url ? (
                          <img src={s.image_url} alt="scan" className="h-10 w-10 rounded-lg object-cover border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-green-900">{s.crop || (s.vision_diagnosis ? s.vision_diagnosis.split(' ')[0] : "Field Scan")}</p>
                          <p className={`text-xs font-semibold ${s.is_spray_safe ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {s.is_spray_safe ? "Safe" : "Warning"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2 p-2 rounded-xl border border-green-200 bg-white w-full max-w-md shadow-sm">
              <Search className="h-5 w-5 text-gray-400 ml-2" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-gray-800 w-full placeholder-gray-400 p-1"
              />
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-green-50 text-xs font-bold text-green-800 uppercase tracking-wider border-b border-green-200">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-green-50/50 transition">
                      <td className="px-6 py-4 font-bold text-green-900 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs border border-emerald-200">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2 font-medium">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">{u.id}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCANS TAB */}
        {activeTab === "scans" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scans.map((scan) => (
              <div key={scan.id} className="flex flex-col rounded-2xl border border-green-100 bg-white overflow-hidden shadow-md hover:border-emerald-300 transition-colors">
                <div className="relative h-48 w-full bg-gray-100 border-b border-green-100 flex items-center justify-center overflow-hidden">
                  {scan.image_url ? (
                    <img src={scan.image_url} alt={scan.crop} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  )}
                  {scan.weather_data && scan.weather_data.temperature_c && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-gray-800 border border-gray-200 shadow-sm">
                      {scan.weather_data.temperature_c}°C
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-green-900">{scan.crop || (scan.vision_diagnosis ? scan.vision_diagnosis.split(' ')[0] : "Field Scan")}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                        <User className="h-3 w-3" />
                        {users.find(u => u.id === scan.user_id)?.name || <span className="font-mono">{scan.user_id.slice(-6)}</span>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        scan.is_spray_safe ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {scan.is_spray_safe ? "Safe" : "Warning"}
                      </span>
                      <button 
                        onClick={() => handleDeleteScan(scan.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Delete Scan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {scan.vision_diagnosis && (
                    <div className="mt-2 text-sm text-gray-700 bg-green-50/80 p-2.5 rounded-lg border border-green-100">
                      <p className="line-clamp-3 leading-snug">{scan.vision_diagnosis}</p>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>{new Date(scan.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {scans.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No scans found on the platform yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
