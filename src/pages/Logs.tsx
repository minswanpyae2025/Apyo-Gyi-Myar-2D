import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { Search, Clock, ArrowUpDown, Filter, ShieldAlert, User } from "lucide-react";
import { AuditLog, Profile } from "../types";

export default function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterAction, setFilterAction] = useState("");
  const [filterAdminId, setFilterAdminId] = useState("");
  const [filterProfileUser, setFilterProfileUser] = useState("");

  const actionTypes = ["Create Profile", "Log Bet", "Check Results", "Create Admin"];

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const [logsRes, profilesRes] = await Promise.all([
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*")
    ]);
    if (logsRes.data) setLogs(logsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  }

  const handleSort = () => setSortAsc(!sortAsc);

  const getAdminName = (adminId: string) => {
    const profile = profiles.find(p => p.id === adminId);
    return profile ? profile.name : adminId;
  };

  const getProfileNameFromDetails = (details: any) => {
    if (!details) return "";
    let profileId = "";
    if (details.profile_id) profileId = details.profile_id;
    if (details.profile_name) return details.profile_name;
    if (profileId) {
      const profile = profiles.find(p => p.id === profileId);
      return profile ? profile.name : profileId;
    }
    return "";
  };

  const uniqueAdmins = Array.from(new Set(logs.map(l => l.admin_id)));

  const filtered = logs.filter(l => {
    const adminName = getAdminName(l.admin_id);
    const detailProfileName = getProfileNameFromDetails(l.details);
    const detailsString = JSON.stringify(l.details) || "";

    const matchesAction = filterAction ? l.action === filterAction : true;
    const matchesAdmin = filterAdminId ? l.admin_id === filterAdminId : true;
    const matchesProfileUser = filterProfileUser
      ? detailProfileName.toLowerCase().includes(filterProfileUser.toLowerCase())
      : true;

    const searchLower = search.toLowerCase();
    const matchesSearch = search === "" ||
      l.admin_id.toLowerCase().includes(searchLower) ||
      adminName.toLowerCase().includes(searchLower) ||
      detailsString.toLowerCase().includes(searchLower) ||
      detailProfileName.toLowerCase().includes(searchLower);

    return matchesAction && matchesAdmin && matchesProfileUser && matchesSearch;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortAsc ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">မှတ်တမ်းများ</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 bg-gray-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="အသေးစိတ် ရှာဖွေရန်..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              className="pl-9 pr-8 py-2 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500"
              value={filterAction as string}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="">လုပ်ဆောင်ချက်အားလုံး</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div className="relative">
             <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <select
              className="pl-9 pr-8 py-2 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500"
              value={filterAdminId}
              onChange={e => setFilterAdminId(e.target.value)}
            >
              <option value="">အက်ဒမင်အားလုံး</option>
              {uniqueAdmins.map(adminId => (
                <option key={adminId} value={adminId as string}>{String(getAdminName(adminId as string)).substring(0, 15)}</option>
              ))}
            </select>
          </div>
          <div className="relative">
             <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input
              type="text"
              placeholder="ဖောက်သည်အမည်..."
              className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              value={filterProfileUser}
              onChange={e => setFilterProfileUser(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleSort}>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> Timestamp <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="p-4">လုပ်ဆောင်ချက်</th>
                <th className="p-4">အက်ဒမင် အမည်</th>
                <th className="p-4 w-full">အသေးစိတ်</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">မှတ်တမ်းများ ရယူနေသည်...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">မှတ်တမ်းများ မတွေ့ပါ။</td></tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-xs font-mono text-gray-500">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <ShieldAlert className="w-3 h-3" />
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-blue-600 font-medium" title={log.admin_id}>
                      {getAdminName(log.admin_id).length > 20 ? getAdminName(log.admin_id).substring(0, 20) + '...' : getAdminName(log.admin_id)}
                    </td>
                    <td className="p-4 text-gray-600 scrollbar-hide max-w-[200px] truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
