// -------------------------------------------------------
// 目的: wagmiのチェーン/RPC設定（読み取り/書き込みの接続先）を管理するファイルです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 15:20 Base Sepoliaをデフォルトにして読み取りが止まる問題を回避
// 理由: 一部環境でBase Mainnet RPCがタイムアウトし、ローディングが解けなかったため
// -------------------------------------------------------

import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [base.id]: http('https://mainnet.base.org'),
  },
})
