# Base Occupy

> "Pay to Steal, Share to Earn More." - Baseチェーン上で展開される、最も中毒性の高いソーシャル陣取りゲーム。

## 概要

Base Occupyは、単なるギャンブルではなく「人間の強欲と顕示欲」をハックする社会実験です。プレイヤーは0.01 ETHで玉座を奪い合い、タイマー終了時に座っていた最後の王が賞金を総取りします。さらに、王が“敵を増やすほど賞金が増える”ソーシャル設計により、Farcaster上で自然に拡散が回るように作っています。

## デモ

- **アプリURL**: `https://traebaseecta.vercel.app`
- **スライド**: `https://docs.google.com/presentation/d/1sqODSAJ6SalnKiRPZSUry6FPxRfhUmLGi863a-4eQUk/edit?usp=sharing`
- **デモ動画**(任意): なし

## 推しポイント

1. **設計: “敵を増やすほど儲かる”社会実験をプロダクトに落とし込んだ**
   - 王になった瞬間に解禁される「挑発」「煽り」「布石」の3つのシェア文言に、現在の賞金総額（ETH）をリアルタイムで埋め込み、Farcaster上で挑戦者を呼び込むバイラルループを作りました。

2. **実装: オンチェーン×セキュリティ×UXをまとめて成立させた**
   - Pull型の賞金受け取り（`pendingWithdrawals`）と`ReentrancyGuard`で安全に決済しつつ、運営（Owner）がサドンデス発動で延長時間を**10分→1分**に短縮可能。さらに動的NFT（オンチェーン生成）で戦績が可視化され、外部表示では必要に応じてメタデータ更新（Refresh）で最新状態を反映できます。ウォレット接続時にはBase Sepolia以外なら切り替えを促し、誤ネットワークでの操作ミスを防ぎます。

## 使用技術(もしこだわりがあれば)

- **フロントエンド**: Next.js (App Router), Tailwind CSS, Wagmi, Viem
- **バックエンド**: Solidity (Smart Contract on Base Sepolia)
- **データベース**: なし (Full On-Chain Storage)
- **インフラ**: Vercel
- **その他**: Farcaster Frames v2 SDK, On-Chain SVG Generation

## チームメンバー

- Raz (Developer)
