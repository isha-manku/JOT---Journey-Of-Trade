import { useState, useEffect } from "react";

export function filterByMonth(items, dateField, year, month) {
  return items.filter((item) => {
    const d = new Date(item[dateField]);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function computeChange(current, previous) {
  if (previous === 0) {
    if (current > 0) return { pct: "100.0", up: true, isZero: false };
    return { pct: "0.0", up: true, isZero: true };
  }
  const diff = ((current - previous) / previous) * 100;
  if (diff === 0) return { pct: "0.0", up: true, isZero: true };
  return { pct: Math.abs(diff).toFixed(1), up: diff > 0, isZero: false };
}

export function useDashboardData() {
  const [buyers,      setBuyers]      = useState([]);
  const [sellers,     setSellers]     = useState([]);
  const [inquiries,   setInquiries]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchData();
    const refresh = setInterval(fetchData, 5000);
    const timer   = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => { clearInterval(refresh); clearInterval(timer); };
  }, []);

  const fetchData = async () => {
    try {
      const [br, sr, ir] = await Promise.all([
        fetch("http://localhost:5000/buyers"),
        fetch("http://localhost:5000/sellers"),
        fetch("http://localhost:5000/inquiries"),
      ]);
      setBuyers(await br.json());
      setSellers(await sr.json());
      setInquiries(await ir.json());
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const now       = currentTime;
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevYear  = thisMonth === 0 ? thisYear - 1 : thisYear;

  const buyerChange   = computeChange(filterByMonth(buyers,    "created_at",   thisYear, thisMonth).length, filterByMonth(buyers,    "created_at",   prevYear, prevMonth).length);
  const sellerChange  = computeChange(filterByMonth(sellers,   "created_at",   thisYear, thisMonth).length, filterByMonth(sellers,   "created_at",   prevYear, prevMonth).length);
  const inquiryChange = computeChange(filterByMonth(inquiries, "inquiry_date", thisYear, thisMonth).length, filterByMonth(inquiries, "inquiry_date", prevYear, prevMonth).length);

  const genuineNames = new Set(
    inquiries.filter(i => (i.buyer_quality_rating || "").toLowerCase() === "genuine buyer")
      .map(i => (i.buyer_name || "").toLowerCase().trim()).filter(Boolean)
  );
  
  const bonafideChange = computeChange(
    inquiries.filter(i => { const d = new Date(i.inquiry_date); return (i.buyer_quality_rating||"").toLowerCase()==="genuine buyer" && d.getFullYear()===thisYear && d.getMonth()===thisMonth; }).length,
    inquiries.filter(i => { const d = new Date(i.inquiry_date); return (i.buyer_quality_rating||"").toLowerCase()==="genuine buyer" && d.getFullYear()===prevYear && d.getMonth()===prevMonth; }).length
  );

  return {
    buyers, sellers, inquiries, loading,
    buyerChange, sellerChange, inquiryChange, 
    genuineNames, bonafideChange,
    currentTime, fetchData
  };
}
