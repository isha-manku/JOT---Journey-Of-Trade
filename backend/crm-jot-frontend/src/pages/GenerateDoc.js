function GenerateDoc() {
  const docAppUrl = "http://localhost:5000/docplatform";  const username = localStorage.getItem("username") || "";
  
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