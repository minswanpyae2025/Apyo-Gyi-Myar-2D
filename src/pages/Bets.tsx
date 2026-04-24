import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { format, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CircleDollarSign, ArrowLeftRight, User, Plus, Info, Loader2 } from "lucide-react";
import { useToast } from "../components/Toast";
import { Profile, Bet } from "../types";

export default function Bets() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  
  // Form State
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isReverse, setIsReverse] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchProfiles();
    fetchRecentBets();
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase.from("profiles").select("*").order("name");
    if (data) setProfiles(data);
  }

  async function fetchRecentBets() {
    const { data } = await supabase.from("bets").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setRecentBets(data);
  }

  const isDouble = number.length === 2 && number[0] === number[1];
  const disableReverse = isDouble || number.length !== 2;

  // Enforce double if user checks R but input becomes double, uncheck it.
  useEffect(() => {
    if (disableReverse && isReverse) setIsReverse(false);
  }, [number, disableReverse, isReverse]);

  function getYangonDrawSession() {
    const tz = "Asia/Yangon";
    const now = new Date();
    const yangonTime = toZonedTime(now, tz);
    
    // Extract hours and minutes
    const hours = yangonTime.getHours();
    const minutes = yangonTime.getMinutes();
    
    const timeInMinutes = hours * 60 + minutes;
    const noon = 12 * 60; // 720
    const fourThirty = 16 * 60 + 30; // 990
    
    let draw_date = format(yangonTime, "yyyy-MM-dd");
    let session: "12:00 PM" | "4:30 PM";

    if (timeInMinutes <= noon) {
      session = "12:00 PM";
    } else if (timeInMinutes <= fourThirty) {
      session = "4:30 PM";
    } else {
      session = "12:00 PM";
      draw_date = format(addDays(yangonTime, 1), "yyyy-MM-dd");
    }

    return { session, draw_date };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (number.length !== 2) { addToast("ဂဏန်းသည် ၂ လုံး ဖြစ်ရမည်။", "error"); return; }
    if (!amount || parseInt(amount, 10) < 100) { addToast("အနည်းဆုံး ထိုးကြေး 100 ကျပ် ဖြစ်ရမည်။", "error"); return; }
    if (!selectedProfileId) { addToast("ပရိုဖိုင်ရွေးချယ်ပါ။", "error"); return; }

    setSubmitting(true);
    const { session, draw_date } = getYangonDrawSession();
    const { data: user } = await supabase.auth.getUser();
    
    const numAmount = parseInt(amount, 10);
    
    const betsToInsert: Partial<Bet>[] = [];
    
    betsToInsert.push({
      profile_id: selectedProfileId,
      number: number,
      amount: numAmount,
      session,
      draw_date,
      created_by: user?.user?.id
    });

    if (isReverse && !isDouble) {
      const reversedNumber = number[1] + number[0];
      betsToInsert.push({
        profile_id: selectedProfileId,
        number: reversedNumber,
        amount: numAmount,
        session,
        draw_date,
        created_by: user?.user?.id
      });
    }

    const { data, error } = await supabase.from("bets").insert(betsToInsert).select();
    
    if (data) {
      setRecentBets([...data.reverse(), ...recentBets].slice(0, 20));
      
      // Log Action
      await supabase.from("audit_logs").insert([{
        action: "Log Bet",
        details: { profile_id: selectedProfileId, bets: betsToInsert },
        admin_id: user?.user?.id
      }]);
      
      setNumber("");
      setAmount("");
      setIsReverse(false);
      addToast("ထီထိုးခြင်း အောင်မြင်ပါသည်။", "success");
    }
    
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">ထီထိုးရန်</h2>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ဖောက်သည် ပရိုဖိုင်</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                value={selectedProfileId}
                onChange={e => setSelectedProfileId(e.target.value)}
                required
              >
                <option value="" disabled>ပရိုဖိုင်ရွေးချယ်ပါ...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.phone_number})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 border p-4 rounded-xl relative overflow-hidden bg-gray-50 border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">၂ လုံးဂဏန်း</label>
              <input
                type="text"
                placeholder="00-99"
                pattern="[0-9]{2}"
                maxLength={2}
                className="w-full text-center text-2xl font-bold font-mono tracking-widest py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={number}
                onChange={e => setNumber(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <div className="flex-1 border p-4 rounded-xl relative overflow-hidden bg-gray-50 border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">ပမာဏ (ကျပ်)</label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  placeholder="1000"
                  min="100"
                  className="w-full pl-10 pr-4 py-3 text-lg font-medium border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl bg-blue-50/50 border-blue-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isReverse ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 tracking-tight">"R" (ပြောင်းပြန်)</p>
                <p className="text-xs text-gray-500 max-w-[200px] leading-tight mt-0.5">
                  ပြောင်းပြန်ဂဏန်းကို အလိုအလျောက် ထိုးမည်။ အပူးဂဏန်းများအတွက် ပိတ်ထားသည်။
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isReverse}
                disabled={disableReverse}
                onChange={() => setIsReverse(!isReverse)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-100">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>ရန်ကုန်စံတော်ချိန်ကို အခြေခံ၍ အချိန်ကို အလိုအလျောက် သတ်မှတ်ထားသည်: <b>{getYangonDrawSession().draw_date}</b> for <b>{getYangonDrawSession().session}</b> draw.</p>
          </div>

          <button
            type="submit"
            disabled={submitting || number.length !== 2 || !amount || !selectedProfileId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {submitting ? "ထီထိုးနေသည်..." : "ထီထိုးရန်"}
          </button>
        </form>
      </div>
      
      {/* Recent Bets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">လတ်တလော ထီများ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="p-4">အချိန်</th>
                <th className="p-4">ပရိုဖိုင်</th>
                <th className="p-4">ဂဏန်း</th>
                <th className="p-4">ပမာဏ</th>
                <th className="p-4">အချိန်</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBets.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">လတ်တလော ထီမရှိပါ။</td></tr>
              ) : (
                recentBets.map(bet => {
                  const profile = profiles.find(p => p.id === bet.profile_id);
                  return (
                    <tr key={bet.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-500">{new Date(bet.created_at).toLocaleString()}</td>
                      <td className="p-4 font-medium">{profile?.name || bet.profile_id.substring(0,8)}</td>
                      <td className="p-4 font-mono font-bold text-blue-600">{bet.number}</td>
                      <td className="p-4 text-emerald-600 font-medium">{bet.amount.toLocaleString()} MMK</td>
                      <td className="p-4 text-gray-600">{bet.draw_date} <span className="text-xs ml-1 bg-gray-100 px-2 py-0.5 rounded">{bet.session}</span></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
