const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>ConvertFlow AI - Server Running!</h1><p>Node.js is working on Hostinger.</p>");
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Test server running on port ${PORT}`);
});
