import { chromium } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "5174",
    "--strictPort",
  ],
  { stdio: "pipe" },
);
let browser;
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Preview did not start")),
      15000,
    );
    server.stdout.on("data", (data) => {
      if (data.toString().includes("5174")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Preview exited: ${code}`));
    });
  });
  browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    acceptDownloads: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5174");
  await page
    .getByRole("heading", { name: "변화를 관찰하고, 법칙을 발견하다." })
    .waitFor();
  const scrub = (value) =>
    page.getByRole("slider", { name: "실험 진행률" }).fill(String(value));
  const choose = (name) =>
    page.locator(".process-card").filter({ hasText: name }).click();
  const values = async () =>
    page.locator(".state-card strong").allTextContents();
  await page.getByRole("slider", { name: "기체의 양", exact: true }).fill("2");
  await page
    .getByRole("slider", { name: "초기 온도", exact: true })
    .fill("400");
  await page.getByRole("slider", { name: "초기 부피", exact: true }).fill("40");
  assert.deepEqual(await values(), ["166.3 kPa", "40.0 L", "400.0 K"]);
  await page.getByRole("button", { name: "모든 실험 조건 초기화" }).click();
  await scrub(100);
  assert.deepEqual(await values(), ["62.4 kPa", "40.0 L", "300.0 K"]);
  assert.match(await page.locator(".energy-equation").innerText(), /\+1.73/);
  await page.getByRole("button", { name: "결과 기록", exact: true }).click();
  assert.equal(await page.locator("tbody tr").count(), 1);
  await choose("등압 과정");
  await scrub(100);
  assert.deepEqual(await values(), ["124.7 kPa", "40.0 L", "600.0 K"]);
  await page.getByRole("button", { name: "결과 기록", exact: true }).click();
  await choose("등적 과정");
  await scrub(100);
  assert.deepEqual(await values(), ["249.4 kPa", "20.0 L", "600.0 K"]);
  assert.match(await page.locator(".energy-item").nth(1).innerText(), /0.00/);
  await choose("단열 과정");
  await scrub(100);
  assert.deepEqual(await values(), ["39.3 kPa", "40.0 L", "189.0 K"]);
  await page.getByRole("slider", { name: "최종 부피 비율" }).fill("0.5");
  await scrub(100);
  assert.deepEqual(await values(), ["396.0 kPa", "10.0 L", "476.2 K"]);
  assert.match(
    await page.locator(".energy-item").nth(1).innerText(),
    /−|-2.20/,
  );
  await page
    .getByRole("textbox", { name: "나의 탐구 노트" })
    .fill("단열 압축에서 외부가 기체에 일을 하므로 온도가 올라갔다.");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV 내보내기" }).click();
  const file = await download;
  assert.equal(file.suggestedFilename(), "thermo-lab-results.csv");
  const stream = await file.createReadStream();
  let csv = "";
  for await (const chunk of stream) csv += chunk.toString("utf8");
  assert.match(csv, /내부에너지변화\(J\)/);
  assert.match(csv, /등온 과정,100,1,300,20/);
  assert.match(csv, /등압 과정,100,1,300,20/);
  await page.reload();
  assert.equal(await page.locator("tbody tr").count(), 2);
  assert.match(
    await page.getByRole("textbox", { name: "나의 탐구 노트" }).inputValue(),
    /단열 압축/,
  );
  await page.getByRole("button", { name: "이용 가이드" }).click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.getByRole("button", { name: "압력 부피 그래프 확대" }).click();
  assert.equal(await page.locator(".modal .pv-chart").count(), 1);
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByRole("button", { name: "법칙 알아보기" }).click();
  assert.match(await page.getByRole("dialog").innerText(), /ΔU = Q − W/);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "실험 시작", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "일시 정지", exact: true }).click();
  assert.ok(
    Number(
      await page.getByRole("slider", { name: "실험 진행률" }).inputValue(),
    ) > 0,
  );
  await scrub(72);
  await page.screenshot({ path: "/tmp/thermo-desktop.png", fullPage: true });
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(150);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Horizontal overflow at ${width}px`,
    );
    if (width === 390)
      await page.screenshot({ path: "/tmp/thermo-mobile.png", fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await choose("등적 과정");
  await scrub(100);
  assert.deepEqual(await values(), ["249.4 kPa", "20.0 L", "600.0 K"]);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: all four processes, compression, playback, recording, persistence, CSV download, dialogs, mobile interaction and layout.",
  );
} finally {
  await browser?.close();
  server.kill();
}
