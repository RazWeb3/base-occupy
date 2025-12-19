# 仕様書 (Specification)

## 1. システム構成
- **Blockchain:** Base (Ethereum L2)
- **Smart Contract Language:** Solidity ^0.8.20
- **Framework:** Hardhat or Foundry
- **Frontend:** Next.js (App Router), Wagmi/Viem
- **Integration:** Farcaster Frame v2 / Farcaster Mini App SDK

## 2. スマートコントラクト詳細仕様

### 2.1 BaseOccupy.sol

#### 変数定義
| 変数名 | 型 | 説明 |
| --- | --- | --- |
| `owner` | address | コントラクト管理者 |
| `prizePool` | uint256 | 現在の賞金プール残高 |
| `adminFeeBalance` | uint256 | 蓄積された管理者手数料 |
| `lastDepositor` | address | 現在の王座保持者 |
| `deadline` | uint256 | ゲーム終了予定時刻 (timestamp) |
| `isSuddenDeath` | bool | サドンデスモードフラグ |
| `gameRound` | uint256 | 現在のラウンド数 |
| `ENTRY_FEE` | uint256 | 参加費 (定数: 0.01 ether) |
| `FEE_PERCENT` | uint256 | 手数料率 (定数: 10%) |
| `DEADLINE_EXTENSION` | uint256 | 通常時の延長時間 (定数: 10 minutes) |
| `SUDDEN_DEATH_EXTENSION` | uint256 | サドンデス時の延長時間 (定数: 1 minute) |

#### 構造体: UserStat
```solidity
struct UserStat {
    uint256 tokenId;
    uint256 depositCount;
    uint256 winCount;
    uint256 lastWinRound;
    bool isEternalKing;
}
```
- マッピング: `mapping(address => UserStat) public userStats;`
- マッピング: `mapping(address => uint256) public pendingWithdrawals;` (未引き出しの賞金管理)
- マッピング: `mapping(uint256 => address) public ownerOfToken;` (ERC721継承利用時は標準機能を使用)

#### 主要関数

1.  **occupy()**
    - **修飾子:** `payable`, `nonReentrant`
    - **条件:**
        - `msg.value == ENTRY_FEE`
    - **処理:**
        - **Lazy Settlement判定:** `block.timestamp > deadline` かつ `lastDepositor != address(0)` の場合
            - 前の勝者を確定 (`_archiveWinner` 実行)
                - 賞金を `pendingWithdrawals[winner]` に加算
                - 勝者のステータス更新 (`winCount`, `isEternalKing`など)
                - `WinnerArchived` イベント発行
            - ゲームリセット (`prizePool = 0`, `lastDepositor = address(0)`, `gameRound++`)
        - `prizePool += msg.value * 90 / 100`
        - `adminFeeBalance += msg.value * 10 / 100`
        - `deadline` 更新: 現在時刻 + Extension (SuddenDeathフラグで分岐)
        - `lastDepositor = msg.sender`
        - `userStats[msg.sender].depositCount++`
        - NFT未所持ならMint (TokenID発行)
    - **イベント:** `Occupied(address indexed user, uint256 newPrizePool, uint256 newDeadline, uint256 round)`

2.  **withdraw()** (旧 claimReward)
    - **修飾子:** `nonReentrant`
    - **条件:**
        - `pendingWithdrawals[msg.sender] > 0`
    - **処理:**
        - `amount = pendingWithdrawals[msg.sender]`
        - `pendingWithdrawals[msg.sender] = 0`
        - `amount` を `msg.sender` に送金
    - **イベント:** `Withdrawal(address indexed user, uint256 amount)`

3.  **_archiveWinner()** (Internal)
    - **処理:** 勝者の賞金をPendingに移動し、勝敗履歴を更新する内部関数。
    - **イベント:** `WinnerArchived(address indexed winner, uint256 reward, uint256 round)`

4.  **triggerSuddenDeath()**
    - **修飾子:** `onlyOwner`
    - **処理:** `isSuddenDeath = true`
    - **イベント:** `SuddenDeathTriggered(uint256 timestamp)`

5.  **withdrawAdminFees()**
    - **修飾子:** `onlyOwner`
    - **処理:** `adminFeeBalance` 全額を `owner` へ送金
    - **イベント:** `AdminFeesWithdrawn(uint256 amount)`

### 2.2 NFT & Metadata (On-chain SVG)

- **ERC721準拠**
- **tokenURI(uint256 tokenId)**
    - オンチェーンでSVGを構築し、Base64エンコードしてJSON形式で返す。
- **画像生成ロジック:**
    - `userStats[ownerOf(tokenId)]` を参照。
    1. `isEternalKing` -> **"Crown" SVG**
    2. `lastDepositor == ownerOf(tokenId)` -> **"Sword" SVG**
    3. `depositCount > 10` -> **"Helm" SVG**
    4. その他 -> **"Hat" SVG**

## 3. フロントエンド仕様

### 3.1 画面構成
- **Hero Section:**
    - 現在の賞金プール (ETH / USD換算)
    - 残り時間 (カウントダウン)
    - 現在のKing (Address / ENS / Farcaster ID)
    - Occupyボタン
- **User Stats:**
    - 自分のNFT画像
    - ランク名
    - Next Rankまでの回数
- **History:**
    - 過去ラウンドの勝者一覧
- **Menu Overlay:**
    - ハンバーガーメニューアイコンで開閉
    - **Language Switcher:** 日本語 (JA) / 英語 (EN) のトグル
    - **Game Description:**
        - ゲームのルール、勝敗条件、手数料についての説明
        - **Base Sepolia Testnet** を使用する旨の注記
        - **シェア機能**（王座獲得時の挑発アクション）についての説明を追加し、参加意欲を喚起
    - **Wallet Diagnostics:**
        - Mini App判定、Injected Provider有無、Mini App Provider有無
        - `eth_chainId` / `eth_accounts` / `eth_requestAccounts` の結果表示
        - `sdk.getCapabilities()` の結果表示

### 3.2 Farcaster Frame v2
- **Endpoint:** `/api/frame`
  - **GET/POST:** 初期フレーム (OG画像 + Occupyボタン + Shareボタン)
  - **Base URL解決:** `NEXT_PUBLIC_BASE_URL` を優先し、未設定時はリクエストの `origin` から自動推定してSNS側に `localhost` を出さない。
- **Transaction Endpoint:** `/api/frame/tx`
  - **POST:** `eth_sendTransaction` 用のデータを返却 (Target: Base Sepolia / Mainnet)
- **Image Generation:** `/api/og`
  - `viem` を使用してオンチェーンデータを取得し、動的な賞金プールと残り時間を描画。

### 3.3 Farcaster Mini App (Android WebView) 対応
- **目的:** Farcaster(Android)内WebViewで `window.ethereum` が未注入でも接続できるようにする。
- **Ready:** Mini App起動時に `sdk.actions.ready()` を呼び出し、スプラッシュ画面が残らないようにする。
- **Wallet Provider:** `sdk.wallet.getEthereumProvider()` を取得できる場合、`window.ethereum` に注入して `wagmi` の `injected()` 接続を成立させる。
- **シェア:** Mini App内では `sdk.actions.composeCast()` を優先し、失敗時は `sdk.actions.openUrl()` 経由で Warpcast compose へフォールバックする。
- **シェアURL:** `NEXT_PUBLIC_BASE_URL` を本番の公開URLに固定し、`localhost` 混入を避ける。

## 4. データモデル (UserStat詳細)
- `tokenId`: NFT ID (1から始まる連番)
- `depositCount`: 参加回数
- `winCount`: 勝利回数
- `lastWinRound`: 最後に勝利したラウンド
- `isEternalKing`: 勝利経験フラグ
- `hasMinted`: NFT発行済みフラグ

## 5. セキュリティ考慮事項
- **Reentrancy:** `ReentrancyGuard` を継承し、外部呼び出し前後の状態更新順序に注意する。
- **Access Control:** `Ownable` を使用。
- **Gas Optimization:** SVG生成などの重い処理は `view` 関数 (`tokenURI`) に閉じ込め、書き込み関数のガス消費を抑える。
- **Frontend Security:** `wagmi` フックを使用し、型安全なコントラクト対話を行う。
