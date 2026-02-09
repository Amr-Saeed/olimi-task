const crypto = require("crypto");

module.exports = (req, res, next) => {
  // Enable CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  // POST /api/attachments/upload-url — returns a signed upload URL
  if (req.method === "POST" && req.url === "/api/attachments/upload-url") {
    const key = crypto.randomUUID();
    return res.status(200).json({
      key,
      signedUrl: `http://localhost:3001/upload/${key}`,
      expiresIn: 3600,
    });
  }

  // PUT /upload/:key — simulates file upload to signed URL
  if (req.method === "PUT" && req.url.startsWith("/upload/")) {
    const key = req.url.split("/upload/")[1];
    return res.status(200).json({
      success: true,
      key,
      message: "File uploaded successfully",
    });
  }

  // POST /api/agents/:id/test-call — simulates initiating a test call
  const testCallMatch = req.url.match(/^\/api\/agents\/([^/]+)\/test-call$/);
  if (req.method === "POST" && testCallMatch) {
    const agentId = testCallMatch[1];
    return res.status(200).json({
      success: true,
      callId: crypto.randomUUID(),
      agentId,
      status: "initiated",
    });
  }

  next();
};
