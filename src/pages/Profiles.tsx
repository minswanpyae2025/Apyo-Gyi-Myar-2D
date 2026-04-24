import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Search, User, Phone, Hash, ArrowUpDown, Loader2 } from "lucide-react";
import { useToast } from "../components/Toast";
import { Profile } from "../types";

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { addToast } = useToast();
  
  // New profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Profile>("name");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*");
    if (data) setProfiles(data);
    setLoading(false);
  }

  async function handleAddProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone) { addToast("အမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ရန်လိုအပ်ပါသည်။", "error"); return; }
    
    setIsAdding(true);
    const { data: user } = await supabase.auth.getUser();

    const newProfile = { name, phone_number: phone, created_by: user?.user?.id };
    
    const { data, error } = await supabase.from("profiles").insert([newProfile]).select().single();
    
    if (data) {
      setProfiles([data, ...profiles]);
      // Log Action
      await supabase.from("audit_logs").insert([{
        action: "Create Profile",
        details: { profile_name: name, profile_id: data.id },
        admin_id: user?.user?.id
      }]);
      
      setName("");
      setPhone("");
      addToast("ပရိုဖိုင်အသစ် ထည့်သွင်းပြီးပါပြီ။", "success");
    } else {
      addToast("အမှားအယွင်းဖြစ်ပေါ်နေပါသည်။", "error");
    }
    setIsAdding(false);
  }

  const handleSort = (field: keyof Profile) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = profiles.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone_number.includes(search) ||
    p.id.includes(search)
  ).sort((a, b) => {
    const aVal = String(a[sortField]);
    const bVal = String(b[sortField]);
    return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">ဖောက်သည် ပရိုဖိုင်များ</h2>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            ပရိုဖိုင်အသစ်ထည့်ရန်
          </h3>
          <form onSubmit={handleAddProfile} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="အမည်အပြည့်အစုံ"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="ဖုန်းနံပါတ်"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isAdding}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
              {isAdding ? "ထည့်နေသည်..." : "ပရိုဖိုင်ထည့်ရန်"}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="အမည်၊ ID (သို့) ဖုန်းဖြင့် ရှာဖွေရန်..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort("id")}>
                  <div className="flex items-center gap-2"><Hash className="w-4 h-4"/> ID <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-2"><User className="w-4 h-4"/> အမည် <ArrowUpDown className="w-3 h-3"/></div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort("phone_number")}>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4"/> ဖုန်း <ArrowUpDown className="w-3 h-3"/></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500">ပရိုဖိုင်များ ရယူနေသည်...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500">ပရိုဖိုင်များ မတွေ့ပါ။</td></tr>
              ) : (
                filtered.map(profile => (
                  <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-gray-500">{profile.id.substring(0, 8)}</td>
                    <td className="p-4 font-medium text-gray-900">{profile.name}</td>
                    <td className="p-4 text-gray-600">{profile.phone_number}</td>
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
