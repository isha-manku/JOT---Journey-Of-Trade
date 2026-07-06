import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function GenerateDoc() {
  const docAppUrl = "http://localhost:5000/docplatform";  
  const username = localStorage.getItem("username") || "";
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.action === "navigate" && e.data.to) {
        let dest = e.data.to;
        if (dest === "/login") dest = "/";
        navigate(dest);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return (
    <div style={{ width: '100%', height: '100vh', margin: '-20px' }}>
      <iframe 
        src={`${docAppUrl}?created_by=${encodeURIComponent(username)}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Document Generation"
      />
    </div>
  );
}

export default GenerateDoc;