import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

export default function InsightLabel({ pct, up, isZero }) {
  if (isZero) {
    return (
      <span className="stat-change stat-up">
        {pct}% vs last month
      </span>
    );
  }
  return (
    <span className={`stat-change ${up ? "stat-up" : "stat-down"}`}>
      {up ? <FiArrowUpRight size={13} /> : <FiArrowDownRight size={13} />}
      {up ? "+" : "-"}{pct}% vs last month
    </span>
  );
}
