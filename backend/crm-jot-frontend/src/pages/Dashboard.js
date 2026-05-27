import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  FiUsers,
  FiShoppingBag,
  FiMessageSquare,
  FiTrendingUp,
  FiUserPlus,
  FiUpload,
  FiEye,
  FiMoreVertical,
  FiChevronRight,
  FiArrowUpRight,
  FiCalendar,
} from "react-icons/fi";

function Dashboard() {

  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  

  useEffect(() => {

    fetchData();

    const refresh = setInterval(() => {
      fetchData();
    }, 5000);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(refresh);
      clearInterval(timer);
    };

  }, []);

  const fetchData = async () => {

    try {

      const [
        buyersRes,
        sellersRes,
        inquiriesRes
      ] = await Promise.all([

        fetch("http://localhost:5000/buyers"),
        fetch("http://localhost:5000/sellers"),
        fetch("http://localhost:5000/inquiries")

      ]);

      const buyersData = await buyersRes.json();
      const sellersData = await sellersRes.json();
      const inquiriesData = await inquiriesRes.json();

      setBuyers(buyersData);
      setSellers(sellersData);
      setInquiries(inquiriesData);

    } catch (error) {

      console.log(error);

    }

  };

  // LINE CHART DATA
  const lineData = [
    { name: "May 1", thisMonth: 200, lastMonth: 100 },
    { name: "May 5", thisMonth: 400, lastMonth: 150 },
    { name: "May 10", thisMonth: 350, lastMonth: 250 },
    { name: "May 15", thisMonth: 600, lastMonth: 300 },
    { name: "May 20", thisMonth: 550, lastMonth: 450 },
    { name: "May 25", thisMonth: 850, lastMonth: 600 },
  ];

  // PIE CHART DATA
  const pieData = [
    { name: "Wheat", value: 35 },
    { name: "Sugar", value: 25 },
    { name: "Rice", value: 15 },
    { name: "Pulses", value: 10 },
    { name: "Spices", value: 8 },
    { name: "Others", value: 7 },
  ];

  const COLORS = [
    "#123524",
    "#c9a96e",
    "#356859",
    "#8faf9f",
    "#d8c3a5",
    "#6b8f71",
  ];

  const countryData = [
    { country: "India", count: 1245, pct: 100 },
    { country: "UAE", count: 856, pct: 70 },
    { country: "USA", count: 642, pct: 50 },
    { country: "Canada", count: 245, pct: 25 },
    { country: "UK", count: 157, pct: 15 },
  ];

  const recentActivity = [
    {
      time: "10:30 AM",
      title: "New buyer registered",
      sub: buyers[0]?.email || "muskaan@gmail.com",
    },
    {
      time: "09:45 AM",
      title: "New inquiry received",
      sub: "Wheat - 25 MT",
    },
    {
      time: "09:20 AM",
      title: "Seller verified",
      sub: "Golden Horse Trading",
    },
    {
      time: "08:15 AM",
      title: "Document uploaded",
      sub: "Company Certificate.pdf",
    },
  ];

  const formatDate = (date) => {

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  };

  return (

    <div className="jot-dashboard">

      {/* HEADER */}
      <div className="jot-header">

        <div>

          <h1 className="jot-title">
            Business Dashboard
          </h1>

          <p className="jot-subtitle">
            Welcome back
          </p>

        </div>

        <div className="jot-date-pill">

          <FiCalendar size={16} />

          <span>
            {formatDate(currentTime)}
          </span>

        </div>

      </div>

      {/* STATS */}
      <div className="jot-stats">

        {/* CARD */}
        <div className="jot-stat-card">

          <div
            className="jot-stat-icon"
            style={{ background: "#123524" }}
          >
            <FiUsers size={22} />
          </div>

          <div className="jot-stat-body">

            <p>Total Buyers</p>

            <h2>
              {buyers.length || 2540}
            </h2>

            <span>
              <FiArrowUpRight />
              +14.2% this month
            </span>

          </div>

        </div>

        {/* CARD */}
        <div className="jot-stat-card">

          <div
            className="jot-stat-icon"
            style={{ background: "#c9a96e" }}
          >
            <FiShoppingBag size={22} />
          </div>

          <div className="jot-stat-body">

            <p>Total Sellers</p>

            <h2>
              {sellers.length || 1320}
            </h2>

            <span>
              <FiArrowUpRight />
              +9.1% this month
            </span>

          </div>

        </div>

        {/* CARD */}
        <div className="jot-stat-card">

          <div
            className="jot-stat-icon"
            style={{ background: "#123524" }}
          >
            <FiMessageSquare size={22} />
          </div>

          <div className="jot-stat-body">

            <p>Total Inquiries</p>

            <h2>
              {inquiries.length || 3245}
            </h2>

            <span>
              <FiArrowUpRight />
              +18.7% this month
            </span>

          </div>

        </div>

        {/* CARD */}
        <div className="jot-stat-card">

          <div
            className="jot-stat-icon"
            style={{ background: "#c9a96e" }}
          >
            <FiTrendingUp size={22} />
          </div>

          <div className="jot-stat-body">

            <p>Bonafide Buyers</p>

            <h2>
              {buyers.length || 860}
            </h2>

            <span>
              <FiArrowUpRight />
              +11.3% this month
            </span>

          </div>

        </div>

      </div>

      {/* GRID */}
      <div className="jot-main-grid">

        {/* LEFT */}
        <div className="jot-left">

          {/* CHART */}
          <div className="jot-card">

            <div className="jot-card-head">

              <h3>
                Inquiries Overview
              </h3>

            </div>

            <ResponsiveContainer width="100%" height={300}>

              <LineChart data={lineData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="thisMonth"
                  stroke="#123524"
                  strokeWidth={3}
                />

                <Line
                  type="monotone"
                  dataKey="lastMonth"
                  stroke="#c9a96e"
                  strokeWidth={3}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          {/* BOTTOM */}
          <div className="jot-bottom-row">

            {/* ACTIVITY */}
            <div className="jot-card">

              <h3>
                Recent Activity
              </h3>

              {recentActivity.map((item, index) => (

                <div
                  className="jot-activity-item"
                  key={index}
                >

                  <div>

                    <strong>
                      {item.title}
                    </strong>

                    <p>
                      {item.sub}
                    </p>

                  </div>

                  <span>
                    {item.time}
                  </span>

                </div>

              ))}

            </div>

            {/* PIE */}
            <div className="jot-card">

              <h3>
                Top Commodities
              </h3>

              <ResponsiveContainer width="100%" height={250}>

                <PieChart>

                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={90}
                    innerRadius={50}
                  >

                    {pieData.map((entry, index) => (

                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />

                    ))}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

            {/* COUNTRY */}
            <div className="jot-card">

              <h3>
                Inquiries by Country
              </h3>

              {countryData.map((country, index) => (

                <div
                  className="country-row"
                  key={index}
                >

                  <div className="country-top">

                    <span>
                      {country.country}
                    </span>

                    <span>
                      {country.count}
                    </span>

                  </div>

                  <div className="country-bar-bg">

                    <div
                      className="country-bar"
                      style={{
                        width: `${country.pct}%`,
                        background:
                          index % 2 === 0
                            ? "#123524"
                            : "#c9a96e",
                      }}
                    ></div>

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* TABLE */}
          <div className="jot-card">

            <div className="jot-card-head">

              <h3>
                Recent Buyers
              </h3>

              <button className="view-btn">
                View Full Buyers
                <FiChevronRight />
              </button>

            </div>

            <div className="jot-table-wrap">

              <table className="jot-table">

                <thead>

                  <tr>

                    <th>Buyer Name</th>
                    <th>Email</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {(buyers.length
                    ? buyers
                    : [
                        {
                          id: 1,
                          name: "muskaan",
                          email: "hello@gmail.com",
                          country: "India",
                          status: "Verified",
                        },
                        {
                          id: 2,
                          name: "isha",
                          email: "isha@go4world.com",
                          country: "UAE",
                          status: "Pending",
                        },
                      ]
                  ).map((buyer) => (

                    <tr key={buyer.id}>

                      <td>{buyer.name}</td>

                      <td>{buyer.email}</td>

                      <td>{buyer.country}</td>

                      <td>

                        <span className="status-badge">
                          {buyer.status}
                        </span>

                      </td>

                      <td className="actions">

                        <button className="icon-btn">
                          <FiEye />
                        </button>

                        <button className="icon-btn">
                          <FiMoreVertical />
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="jot-right">

          {/* QUICK ACTIONS */}
          <div className="jot-card">

            <h3>
              Quick Actions
            </h3>

            <button className="quick-btn">
              <FiUserPlus />
              Add New Buyer
            </button>

            <button className="quick-btn">
              <FiShoppingBag />
              Add New Seller
            </button>

            <button className="quick-btn">
              <FiMessageSquare />
              Create Inquiry
            </button>

            <button className="quick-btn">
              <FiUpload />
              Upload Document
            </button>

          </div>

          {/* EVENTS */}
          <div className="jot-card">

            <h3>
              Upcoming Events
            </h3>

            <div className="event-item">

              <h4>
                Dubai Trade Expo
              </h4>

              <p>
                International buyer meeting
              </p>

              <span>
                28 May 2026
              </span>

            </div>

            <div className="event-item">

              <h4>
                Wheat Buyer Meeting
              </h4>

              <p>
                Client follow-up discussion
              </p>

              <span>
                2 June 2026
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

export default Dashboard;