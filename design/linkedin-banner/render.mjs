import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
const [,, outDir, ...rest] = process.argv;
const variants = rest.length ? rest : ["1","2","3","4","5"];
const scale = Number(process.env.SCALE || 1);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1584, height: 396 }, deviceScaleFactor: scale });
page.on("console", m => console.log("console:", m.text()));
page.on("pageerror", e => console.log("pageerror:", e.message));
for (const v of variants) {
  const [id, debug] = v.split(":");
  await page.goto(`http://127.0.0.1:8766/design/linkedin-banner/banner.html?v=${id}${debug ? "&debug" : ""}`);
  await page.waitForSelector("body[data-ready]", { timeout: 20000 });
  await page.screenshot({ path: `${outDir}/linkedin-banner-${id}${debug ? "-debug" : ""}${scale > 1 ? `@${scale}x` : ""}.png` });
  console.log("rendered", v);
}
await browser.close();
