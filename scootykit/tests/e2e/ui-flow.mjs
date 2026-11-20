// Browser smoke test. Requires: npm i -D puppeteer-core, a running app (npm run start -p 3100) and Chrome.
// Usage: CHROME_PATH=/path/to/chrome node tests/e2e/ui-flow.mjs
import puppeteer from "puppeteer-core";
const BASE = process.env.BASE_URL || "http://localhost:3100";
const out = process.env.SCREENSHOT_DIR || "/tmp";
const results = [];
const check = (name, ok, extra = "") => { results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`); };

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--disable-gpu"], headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// Seed a guest cart (product data mimics a real cart line)
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
const line = { productId: "10000000-0000-4000-8000-000000000001", slug: "test-helmet", name: "Half Face Helmet (test)", price: 3500, salePrice: 2999, image: null, stock: 4, quantity: 2 };
await page.evaluate((l) => localStorage.setItem("scootykit:cart:v1", JSON.stringify([l])), line);
await page.reload({ waitUntil: "networkidle0" });
const badge = await page.$eval('a[href="/cart"]', (a) => a.getAttribute("aria-label"));
check("Header cart badge reads persisted cart", badge.includes("2 items"), badge);

// Mega menu + mobile menu
await page.click("button[aria-controls]");
check("Mega menu opens", (await page.$eval("button[aria-controls]", (b) => b.getAttribute("aria-expanded"))) === "true");
await page.keyboard.press("Escape");
check("Mega menu closes on Escape", (await page.$eval("button[aria-controls]", (b) => b.getAttribute("aria-expanded"))) === "false");

// Cart page — server refresh removes unknown product (no DB) → cart becomes empty with notice
await page.goto(BASE + "/cart", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
const cartText = await page.evaluate(() => document.querySelector("main").innerText);
check("Cart refresh drops products the server doesn't confirm", cartText.includes("no longer available") || cartText.includes("Your cart is empty"));

// Re-seed and go to checkout (quote fails gracefully without DB)
await page.evaluate((l) => localStorage.setItem("scootykit:cart:v1", JSON.stringify([l])), line);
await page.goto(BASE + "/checkout", { waitUntil: "networkidle0" });
await page.waitForSelector("#full_name");
await page.click("button[type=submit]");
await new Promise((r) => setTimeout(r, 400));
const errs = await page.$$eval('[role=alert]', (els) => els.map((e) => e.textContent));
check("Checkout shows validation errors on empty submit", errs.length >= 4, errs.join(" | "));
await page.type("#full_name", "Ayesha Khan");
await page.type("#phone", "0423576123");
await page.select("#province", "Punjab");
await page.type("#city", "Lahore");
await page.type("#address", "House 12, Street 4, Model Town");
await page.click("button[type=submit]");
await new Promise((r) => setTimeout(r, 400));
const phoneErr = await page.$eval("#phone", (i) => i.getAttribute("aria-invalid"));
check("Landline / invalid mobile rejected", phoneErr === "true");
await page.$eval("#phone", (i) => (i.value = ""));
await page.type("#phone", "+923001234567");
await page.screenshot({ path: `${out}/checkout-filled.png`, fullPage: true });
await page.click("button[type=submit]");
await page.waitForFunction(() => document.body.innerText.includes("We couldn't place your order"), { timeout: 8000 }).catch(() => {});
const body = await page.evaluate(() => document.body.innerText);
check("Order submit reaches server action and fails safely without DB (no fake success)", body.includes("We couldn't place your order") && !page.url().includes("order-confirmation"));
await page.screenshot({ path: `${out}/checkout-error.png` });

// Track order validation
await page.goto(BASE + "/track-order", { waitUntil: "networkidle0" });
await page.type("#order_number", "12345");
await page.type("#track-phone", "03001234567");
await page.click("button[type=submit]");
await new Promise((r) => setTimeout(r, 400));
check("Tracking rejects malformed order number", (await page.evaluate(() => document.body.innerText)).includes("SK-261119-AB2CD"));

// Order confirmation is private without token
await page.goto(BASE + "/order-confirmation/SK-261119-ABCDE", { waitUntil: "networkidle0" });
check("Order confirmation private without token", (await page.evaluate(() => document.body.innerText)).includes("Order details are private"));

// Wishlist toggle on mobile & auth form validation
await page.setViewport({ width: 375, height: 800 });
await page.goto(BASE + "/register", { waitUntil: "networkidle0" });
await page.type("#full_name", "Ali");
await page.type("#email", "not-an-email");
await page.type("#password", "abc");
await page.type("#confirm_password", "abd");
await page.click("button[type=submit]");
await new Promise((r) => setTimeout(r, 400));
const regErrs = await page.$$eval('[role=alert]', (els) => els.map((e) => e.textContent).join(" | "));
check("Register validates email, password strength and match", regErrs.includes("valid email") && regErrs.includes("8 characters") && regErrs.includes("don't match"));
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await page.click('button[aria-label="Open menu"]');
check("Mobile menu opens as dialog", Boolean(await page.$('[role=dialog][aria-label="Menu"]')));
await page.screenshot({ path: `${out}/mobile-menu.png` });

// Admin protection
await page.goto(BASE + "/admin/products", { waitUntil: "networkidle0" });
check("Unauthenticated /admin redirects to login", page.url().includes("/login?next=%2Fadmin") || page.url().includes("/login?next=/admin"), page.url());

// Responsive: no horizontal overflow
for (const w of [375, 768, 1440]) {
  await page.setViewport({ width: w, height: 900 });
  for (const p of ["/", "/shop", "/checkout", "/faq", "/contact", "/login"]) {
    await page.goto(BASE + p, { waitUntil: "load", timeout: 20000 }).catch((e) => check(`load ${p} @${w}`, false, e.message));
    await new Promise((r) => setTimeout(r, 300));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) check(`No horizontal overflow ${p} @${w}`, false, `${overflow}px`);
  }
}
check("Responsive overflow sweep (6 pages × 3 widths)", !results.some((r) => r.includes("overflow") && r.startsWith("FAIL")));
check("No uncaught browser errors", errors.length === 0, errors.slice(0, 3).join(" ; "));
await browser.close();
console.log(results.join("\n"));
