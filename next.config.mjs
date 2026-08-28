/** @type {import('next').NextConfig} */

// GitHub Pages のプロジェクトサイト(https://<user>.github.io/spi/)で配信するため、
// CI では DEPLOY_TARGET=gh-pages を立てて basePath を付ける。ローカルの build/dev では付かない。
const repo = "spi";
const ghPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig = {
  reactStrictMode: true,
  output: "export", // 静的HTMLのみ書き出し（サーバ不要）
  trailingSlash: true, // /history → /history/index.html にして Pages で404を防ぐ
  images: { unoptimized: true },
  ...(ghPages ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),
};

export default nextConfig;
