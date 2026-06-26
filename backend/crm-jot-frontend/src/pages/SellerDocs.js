import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiAlertCircle, FiRefreshCw, FiExternalLink, FiFileText } from "react-icons/fi";

function SellerDocs() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const source = location.state?.source || "sellers";
  const docAppUrl = process.env.REACT_APP_DOC_AUTO_URL || "http://localhost:5173";
  const username = localStorage.getItem("username") || "";

  // loading, online, offline, invalid, route_unavailable
  const [status, setStatus] = useState("loading");

  const checkHealth = async () => {
    setStatus("loading");
    if (!sellerId || isNaN(sellerId)) {
      setStatus("invalid");
      return;
    }

    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Step 1: Health Check
      const healthResponse = await fetch(`${docAppUrl}/health.json`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });

      if (!healthResponse.ok) {
        clearTimeout(timeoutId);
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      // Step 2: Route Reachability Check
      const targetRoute = `/sellers/${sellerId}/documents`;
      const routeResponse = await fetch(`${docAppUrl}${targetRoute}`, {
        method: "HEAD", // Use HEAD to minimize bandwidth
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      const endTime = performance.now();
      
      if (process.env.NODE_ENV === "development") {
        console.group("🔍 Startup Diagnostics: Document Service");
        console.log(`URL: ${docAppUrl}`);
        console.log(`Service Health Status: ${healthResponse.status} ${healthResponse.statusText}`);
        console.log(`Route Requested: ${targetRoute}`);
        console.log(`Route Status: ${routeResponse.status} ${routeResponse.statusText}`);
        console.log(`Response Code: ${routeResponse.status}`);
        console.log(`Response Time: ${(endTime - startTime).toFixed(2)}ms`);
        console.groupEnd();
      }

      if (routeResponse.ok) {
        setStatus("online");
      } else {
        setStatus("route_unavailable");
      }
    } catch (err) {
      const endTime = performance.now();
      if (process.env.NODE_ENV === "development") {
        console.group("🔍 Startup Diagnostics: Document Service");
        console.log(`URL: ${docAppUrl}`);
        console.log(`Service Health Status: FAILED`);
        console.log(`Route Requested: /sellers/${sellerId}/documents`);
        console.log(`Response Time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Failure Reason:`, err.message);
        console.groupEnd();
      }
      setStatus("offline");
    }
  };

  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, docAppUrl]);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.action === "navigate" && e.data.to) {
        if (e.data.to === "/sellers" && source === "recycle-bin") {
          navigate("/sellers/recycle-bin");
        } else {
          navigate(e.data.to);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate, source]);

  if (status === "invalid") {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <FiAlertCircle size={40} style={{ marginBottom: '10px' }} />
          <h3>Profile Not Found</h3>
          <p>The requested seller profile ID is invalid.</p>
        </div>
      </div>
    );
  }

  if (status === "route_unavailable") {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fff3cd',
            color: '#856404',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <FiFileText size={32} />
          </div>
          <h2 style={{ fontSize: '20px', color: '#0e2318', marginBottom: '12px' }}>Requested Profile Page Not Available</h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
            The Document Automation service is online, but the requested profile route could not be found or returned an error.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={checkHealth} className="save-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FiRefreshCw /> Retry Connection
            </button>
            <button className="quick-action-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid #e5e0d5', color: '#555', textAlign: 'center' }}>
              Contact Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <FiAlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '20px', color: '#0e2318', marginBottom: '12px' }}>Document Service Unavailable</h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
            The Document Automation application is currently offline or unreachable.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={checkHealth} className="save-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FiRefreshCw /> Retry Connection
            </button>
            <button onClick={() => window.open(docAppUrl, "_blank")} className="quick-action-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid #e5e0d5', color: '#555', textAlign: 'center' }}>
              <FiExternalLink /> Open Service
            </button>
            <button className="quick-action-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#888', textAlign: 'center' }}>
              Contact Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="card" style={{ margin: '-20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '28px', borderBottom: '1px solid #f0ede6', background: 'white' }}>
          <div style={{ height: '24px', width: '200px', background: '#f0ede6', borderRadius: '4px', marginBottom: '10px', animation: 'pulse 1.5s infinite' }}></div>
          <div style={{ height: '14px', width: '300px', background: '#f5f2eb', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
        </div>
        <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: '#faf9f6' }}>
           <div style={{ height: '200px', width: '100%', background: '#f5f2eb', borderRadius: '16px', animation: 'pulse 1.5s infinite' }}></div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div style={{ height: '120px', background: '#f0ede6', borderRadius: '16px', animation: 'pulse 1.5s infinite' }}></div>
             <div style={{ height: '120px', background: '#f0ede6', borderRadius: '16px', animation: 'pulse 1.5s infinite' }}></div>
           </div>
           <div style={{ textAlign: 'center', marginTop: '40px', color: '#888', fontWeight: 600 }}>Loading Seller Documents...</div>
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', margin: '-20px' }}>
      <iframe 
        src={`${docAppUrl}/sellers/${sellerId}/documents?created_by=${encodeURIComponent(username)}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Seller Documents"
      />
    </div>
  );
}

export default SellerDocs;
