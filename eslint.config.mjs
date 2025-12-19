// -------------------------------------------------------
// 目的: ESLintの設定と除外パスを管理するファイルです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 14:55 生成物/補助スクリプトをlint対象外へ追加
// 理由: 生成コード由来のlintエラーで開発フローが止まるため
// -------------------------------------------------------

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "smart-contracts/**",
    "smart-contracts/typechain-types/**",
  ]),
]);

export default eslintConfig;
