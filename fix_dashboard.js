const fs = require('fs');

// 1. Update useDashboardData.js
let hookCode = fs.readFileSync('backend/crm-jot-frontend/src/hooks/useDashboardData.js', 'utf8');

hookCode = hookCode.replace(
  'const [inquiries,   setInquiries]   = useState([]);',
  'const [inquiries,   setInquiries]   = useState([]);\n  const [analytics,   setAnalytics]   = useState(null);'
);

hookCode = hookCode.replace(
  'fetch("http://localhost:5000/inquiries"),',
  'fetch("http://localhost:5000/inquiries"),\n        fetch("http://localhost:5000/accounts/analytics", { headers: { "x-user-role": localStorage.getItem("role") || "admin" } }).catch(() => null),'
);

hookCode = hookCode.replace(
  'const [br, sr, ir] = await Promise.all([',
  'const [br, sr, ir, ar] = await Promise.all(['
);

hookCode = hookCode.replace(
  'setInquiries(await ir.json());',
  'setInquiries(await ir.json());\n      if (ar) {\n        const aData = await ar.json();\n        if (!aData.error) setAnalytics(aData.summary);\n      }'
);

hookCode = hookCode.replace(
  'genuineNames, bonafideChange,',
  'genuineNames, bonafideChange, analytics,'
);

fs.writeFileSync('backend/crm-jot-frontend/src/hooks/useDashboardData.js', hookCode);


// 2. Update Dashboard.js
let dashCode = fs.readFileSync('backend/crm-jot-frontend/src/pages/Dashboard.js', 'utf8');

dashCode = dashCode.replace(
  'genuineNames, bonafideChange, currentTime,',
  'genuineNames, bonafideChange, currentTime, analytics,'
);

dashCode = dashCode.replace(
  'import { FiUsers, FiShoppingBag, FiMessageSquare, FiTrendingUp,',
  'import { FiUsers, FiShoppingBag, FiMessageSquare, FiTrendingUp, FiDollarSign, FiActivity,'
);

const financialStats = `
      {analytics && (
        <div className="jot-stats" style={{ marginTop: "20px" }}>
          <div className="jot-stat-card">
            <div className="jot-stat-icon" style={{ background: "#123524" }}><FiDollarSign size={22} /></div>
            <div className="jot-stat-body">
              <p className="jot-stat-label">Total Revenue (Shipment Value)</p>
              <h2 className="jot-stat-value">USD {Number(analytics.total_shipment_value || 0).toLocaleString()}</h2>
            </div>
          </div>
          <div className="jot-stat-card">
            <div className="jot-stat-icon" style={{ background: "#c9a96e" }}><FiTrendingUp size={22} /></div>
            <div className="jot-stat-body">
              <p className="jot-stat-label">Total Net Profit</p>
              <h2 className="jot-stat-value">USD {Number(analytics.total_net_profit || 0).toLocaleString()}</h2>
            </div>
          </div>
          <div className="jot-stat-card">
            <div className="jot-stat-icon" style={{ background: "#356859" }}><FiActivity size={22} /></div>
            <div className="jot-stat-body">
              <p className="jot-stat-label">Avg Profit per Tx</p>
              <h2 className="jot-stat-value">USD {Number(analytics.avg_profit_per_tx || 0).toLocaleString(undefined, {maximumFractionDigits: 2})}</h2>
            </div>
          </div>
        </div>
      )}
`;

dashCode = dashCode.replace(
  '<div className="jot-main-grid">',
  financialStats + '\n      <div className="jot-main-grid">'
);

fs.writeFileSync('backend/crm-jot-frontend/src/pages/Dashboard.js', dashCode);
console.log('Fixed dashboard data flow');
