import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { Trophy, Calendar, Clock, DollarSign, Search, ArrowUpDown, Loader2 } from "lucide-react";
import { useToast } from "../components/Toast";
import { Profile, Bet } from "../types";

const PAYOUT_MULTIPLIER = 80;

type WinnerRow = {
  bet_id: string;
  profile_name: string;
  phone: string;
  number: string;
  amount: number;
  payout: number;
  time: string;
};

export default function Results() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [session, setSession] = useState<"12:00 PM" | "4:30 PM">("12:00 PM");
  const [winningNumber, setWinningNumber] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState<WinnerRow[]>([]);
  const [searched, setSearched] = useState(false);

  const [sortAsc, setSortAsc] = useState(true);
  const { addToast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winningNumber || winningNumber.length !== 2) { addToast("ပေါက်ဂဏန်းသည် ၂ လုံး ဖြစ်ရမည်။", "error"); return; }

    setLoading(true);
    setSearched(true);
    
    // Fetch bets matching criteria
    const { data: bets } = await supabase
      .from("bets")
      .select("*")
      .eq("draw_date", date)
      .eq("session", session)
      .eq("number", winningNumber);

    if (bets && bets.length > 0) {
      // Fetch profiles for these bets
      const profileIds = [...new Set(bets.map(b => b.profile_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", profileIds);

      const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, Profile>);

      const winnerData: WinnerRow[] = bets.map(bet => {
        const prof = profileMap[bet.profile_id];
        return {
          bet_id: bet.id,
          profile_name: prof?.name || "Unknown",
          phone: prof?.phone_number || "Unknown",
          number: bet.number,
          amount: bet.amount,
          payout: bet.amount * PAYOUT_MULTIPLIER,
          time: bet.created_at
        };
      });

      setWinners(winnerData.sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime()));
      
      // Log Action
      const { data: user } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert([{
        action: "Check Results",
        details: { draw_date: date, session, winningNumber },
        admin_id: user?.user?.id
      }]);
    } else {
      setWinners([]);
      addToast("ဤပွဲစဉ်အတွက် ပေါက်သူ မရှိပါ။", "success");
    }
    
    setLoading(false);
  };

  const handleSort = () => {
    const asc = !sortAsc;
    setSortAsc(asc);
    const sorted = [...winners].sort((a,b) => {
      const aTime = new Date(a.time).getTime();
      const bTime = new Date(b.time).getTime();
      return asc ? aTime - bTime : bTime - aTime;
    });
    setWinners(sorted);
  };

  const totalPayout = winners.reduce((sum, w) => sum + w.payout, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">ထွက်မည့် ရလဒ်များ</h2>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:w-auto flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">ရက်စွဲ</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="w-full md:w-auto flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">အချိန်</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                value={session}
                onChange={e => setSession(e.target.value as "12:00 PM" | "4:30 PM")}
              >
                <option value="12:00 PM">12:00 PM</option>
                <option value="4:30 PM">4:30 PM</option>
              </select>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">ပေါက်ဂဏန်း</label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
              <input
                type="text"
                pattern="[0-9]{2}"
                maxLength={2}
                placeholder="00-99"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm font-bold bg-yellow-50"
                value={winningNumber}
                onChange={e => setWinningNumber(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || winningNumber.length !== 2}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 h-[38px] md:h-[40px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            တွက်ချက်မည်
          </button>
        </form>
      </div>

      {searched && (
        <div className="space-y-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-gray-500 text-sm font-medium mb-1">ပေါက်ဂဏန်း</span>
              <span className="text-4xl font-black font-mono text-blue-600">{winningNumber}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-gray-500 text-sm font-medium mb-1">စုစုပေါင်း ပေါက်သူများ</span>
              <span className="text-3xl font-bold text-gray-800">{winners.length}</span>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center">
              <span className="text-emerald-700 text-sm font-medium mb-1">စုစုပေါင်း ပေးချေငွေ</span>
              <span className="text-3xl font-bold text-emerald-600">{totalPayout.toLocaleString()} <span className="text-lg">MMK</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">ပေါက်သော ထီစာရင်း</h3>
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">အဆ: {PAYOUT_MULTIPLIER}x</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                  <tr>
                    <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={handleSort}>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> ထိုးသော အချိန် <ArrowUpDown className="w-3 h-3"/></div>
                    </th>
                    <th className="p-4">ဖောက်သည်</th>
                    <th className="p-4">ထိုးကြေး</th>
                    <th className="p-4 rounded-tr-lg">ရငွေ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">တွက်ချက်နေသည်...</td></tr>
                  ) : winners.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">ဤပွဲစဉ်အတွက် ပေါက်သူ မရှိပါ။</td></tr>
                  ) : (
                    winners.map(winner => (
                      <tr key={winner.bet_id} className="hover:bg-green-50 transition-colors">
                        <td className="p-4 font-mono text-gray-500 text-xs">{new Date(winner.time).toLocaleTimeString()}</td>
                        <td className="p-4">
                          <p className="font-medium text-gray-900">{winner.profile_name}</p>
                          <p className="text-xs text-gray-500">{winner.phone}</p>
                        </td>
                        <td className="p-4 font-medium text-gray-700">{winner.amount.toLocaleString()} MMK</td>
                        <td className="p-4 font-bold text-emerald-600">{winner.payout.toLocaleString()} MMK</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
