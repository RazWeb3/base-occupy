// -------------------------------------------------------
// 目的: Next.jsのビルド/開発サーバー設定を管理するファイルです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 14:55 Turbopackのrootディレクトリを明示
// 理由: workspace root推測ズレにより変更が反映されない事象を抑止するため
// -------------------------------------------------------

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
