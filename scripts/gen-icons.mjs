// Sinh các icon PWA/favicon từ SVG bằng sharp — chạy 1 lần, không cần chạy lại trừ khi đổi thiết kế
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RED = "#dc2626";
const FONT = "PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif";

// Icon thường: nền bo góc + chữ 学 to giữa (giống logo header hiện tại)
function normalSvg(size, corner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${corner}" fill="${RED}"/>
  <text x="${size / 2}" y="${size * 0.645}" font-family="${FONT}" font-size="${size * 0.586}" font-weight="700" fill="#ffffff" text-anchor="middle">学</text>
</svg>`;
}

// Icon maskable: phủ kín nền (không bo góc — OS tự cắt theo hình dạng), chữ thu nhỏ nằm trong vùng an toàn ~80%
function maskableSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${RED}"/>
  <text x="${size / 2}" y="${size * 0.6}" font-family="${FONT}" font-size="${size * 0.42}" font-weight="700" fill="#ffffff" text-anchor="middle">学</text>
</svg>`;
}

async function render(svg, outPath, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log("✓", outPath.replace(ROOT + "/", ""));
}

const iconsDir = join(ROOT, "public/icons");
mkdirSync(iconsDir, { recursive: true });

await render(normalSvg(512, 96), join(ROOT, "src/app/icon.png"), 512);
await render(normalSvg(180, 0), join(ROOT, "src/app/apple-icon.png"), 180); // iOS tự bo góc, để nền vuông
await render(normalSvg(192, 36), join(iconsDir, "icon-192.png"), 192);
await render(normalSvg(512, 96), join(iconsDir, "icon-512.png"), 512);
await render(maskableSvg(192), join(iconsDir, "maskable-192.png"), 192);
await render(maskableSvg(512), join(iconsDir, "maskable-512.png"), 512);

console.log("Xong toàn bộ icon.");
