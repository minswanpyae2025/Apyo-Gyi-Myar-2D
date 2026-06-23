import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { UserPlus, Shield, Mail, Lock, User, Loader2 } from "lucide-react";
import { useToast } from "../components/Toast";

export default function Admins() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);


    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      addToast("အက်ဒမင်အကောင့် ဖန်တီးပြီးပါပြီ။", "success");
      
      const { data: user } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert([{
        action: "Create Admin",
        details: { admin_email: email },
        admin_id: user?.user?.id
      }]);

      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      addToast(err.message, "error");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">အက်ဒမင် စီမံခန့်ခွဲမှု</h2>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto sm:mx-0">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-bold text-xl text-gray-800">အက်ဒမင်အသစ် ဖန်တီးရန်</h3>
          <p className="text-sm text-gray-500 mt-1">ပရိုဖိုင်များနှင့် ထီများကို စီမံရန် အက်ဒမင်အသစ် ထည့်ပါ။</p>
        </div>



        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">အမည်အပြည့်အစုံ</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="အက်ဒမင် အမည်"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">အီးမေးလ် လိပ်စာ</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="admin@example.com"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">စကားဝှက်</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? "ဖန်တီးနေသည်..." : "အက်ဒမင်အကောင့် ဖန်တီးရန်"}
          </button>
        </form>
      </div>
    </div>
  );
}
