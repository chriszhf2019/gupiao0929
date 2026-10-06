import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { productionAccessProblem, rateLimit, requireApiAccess } from "./server/security.js";
import { register as registerStockRoutes } from "./server/routes/stock.js";
import { register as registerInstitutionalRoutes } from "./server/routes/institutional.js";
import { register as registerMarketRoutes } from "./server/routes/market.js";
import { register as registerAiRoutes } from "./server/routes/ai.js";
import { register as registerFundRoutes } from "./server/routes/funds.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:8765 https://push2.eastmoney.com https://push2ex.eastmoney.com https://datacenter.eastmoney.com https://datacenter-web.eastmoney.com https://data.eastmoney.com https://web.ifzq.gtimg.cn https://qt.gtimg.cn https://fund.eastmoney.com"
  );
  next();
});

app.use(express.json({ limit: "1mb" }));

const accessProblem = productionAccessProblem();
if (accessProblem) {
  console.error(`[安全] ${accessProblem}`);
  process.exit(1);
}

const api = express.Router();
api.use(requireApiAccess);
const aiRateLimit = rateLimit({ windowMs: 60_000, max: 15 });
const deepDiveRateLimit = rateLimit({ windowMs: 60_000, max: 5 });
const limits = { aiRateLimit, deepDiveRateLimit };
registerStockRoutes(api, limits);
registerInstitutionalRoutes(api, limits);
registerMarketRoutes(api, limits);
registerAiRoutes(api, limits);
registerFundRoutes(api, limits);
app.use("/api", api);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Stock Analysis Assistant backend running on http://localhost:${PORT}`);
  });
}

startServer();
