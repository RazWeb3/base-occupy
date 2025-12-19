# Base Occupy スライド構成案 (Updated)

## コンセプト
**"Pay to Steal, Share to Earn More."**
Baseハッカソン向けに、**「人間の強欲と顕示欲をハックする社会実験」**としてのインパクトを最大化する構成です。「Baseを使う理由」のような当たり前の説明は省き、**「Baseだからこそ実現できた過激な体験」**と**「バイラルを生む仕掛け」**に焦点を絞ります。

---

## スライド構成 (全6-8枚: 2-3分ピッチ想定)

### 1. Title Slide (表紙)
*   **Main Title**: Base Occupy
*   **Sub Title**: Pay to Steal, Share to Earn More.
*   **Catchphrase**: "人間の強欲と顕示欲をハックする、Base上の社会実験"
*   **Visual**: ロゴ、または「Current Pot: 1.5 ETH」のような扇動的なUIイメージ。

### 2. The Story: Why we built this? (開発ストーリー)
*   **The Theme**: 「Baseを使って面白いことをする」という大喜利に対する、我々の回答。
*   **The Irony**: メインネットでこれをやれば、賭博法に抵触し、我々は逮捕されるでしょう。
*   **The Experiment**: だからこそ、**「テストネット」**という安全な実験場で、**「無価値なテストネットETH」**を、人間はどこまで本気で奪い合えるのか？
*   **Message**: 法律の制約を超えて、人間の本能（Greed）を純粋にコード化できるのは、今、このハッカソンのBase Testnet上だけです。

### 3. The Mechanism: Simple & Cruel (ルール説明)
*   **Core Loop**:
    1.  **Pay**: 0.01 ETH 支払って玉座を奪う (Occupy)。
    2.  **Extend**: 奪うたびにタイマー延長 (通常10分 / Sudden Death 1分)。
    3.  **Win**: タイムアップ時に座っていた **最後の1人がポットを総取り**。
*   **Tech Highlight**: `BaseOccupy.sol` のロジックは絶対。管理者はサドンデスで介入はできても、勝者の賞金総取りを止めることはできない。この非情なルールの上で、**純粋な「資金力」と「執着心」の勝負**が繰り広げられる。

### 4. The Concept: "Farcaster Native War" (コンセプト)
*   **Message**: BaseとFarcasterのシームレスな連携を最大限に活用。強固なソーシャルグラフをそのまま**「競争」と「バイラル」の燃料**へと転換する。
*   **Concept**: **"Steal to Earn"**。
    *   友人を招待するのではない。
    *   FarcasterのTL上で友人を**挑発**し、リアルタイムに賞金を奪い合う極限の体験。

### 5. The Viral Engine: 3 Ways to Share (核心機能)
*   **Update Point**: 王座についた瞬間、3つの**「拡散兵器」**が解禁される。
    1.  **Provoke (挑発)**: "Come and get me!" — 単純な挑発で敵を呼び込む。
    2.  **Taunt (煽り)**: "Is that all you got?" — 敗者のプライドを逆撫でする。
    3.  **Strategy (布石)**: "I am ready." — 王としての余裕を見せつけ、油断を誘う。
*   **Incentive**: なぜシェアするのか？ → 参加者が増えれば、自分が総取りする賞金プールが増えるから。
*   **UX**: **Farcaster Frames v2** を採用。TL上でボタンを押すだけで即座に送金・参加完了。

### 5. On-Chain Reputation: Dynamic NFT (技術的加点)
*   **Tech**: フルオンチェーンSVG生成 (No IPFS, No Database)。
*   **Visual**: プレイヤーの「生き様」と「現在のステータス」が画像にリアルタイム反映される。
    *   🧢 **Challenger (Hat)**: 初期ランク (〜10 Deposits)
    *   🪖 **Veteran (Helm)**: 歴戦の勇者 (11+ Deposits)
    *   ⚔️ **Current King (Sword)**: 現在王座を占拠中 (Holding the Throne)
    *   👑 **Eternal King (Crown)**: ラウンド勝者として歴史に名を刻む (Win the Round)
*   **Psychology**: これはFarcasterプロフィールでマウントを取るための「オンチェーンの勲章」。

### 7. Architecture & Security (技術構成)
*   **Stack**:
    *   Smart Contract: Solidity (Base Sepolia)
    *   Frontend: Next.js + Wagmi
    *   Integration: Farcaster Frames v2, Mini App SDK (Android WebView対応)
*   **Security**:
    *   Pull型決済 (`pendingWithdrawals`)
    *   `ReentrancyGuard` による堅牢性
    *   サドンデス機能によるゲーム進行管理

### 8. Demo & Conclusion (デモと結び)
*   **Live Demo**: (QRコードを表示) 「今、私が王です。この賞金が欲しければ、今すぐ奪ってみてください」
*   **Closing**:
    *   ロードマップはありません。これは純粋な実験です。
    *   Web3×人間の本能 = **Greed is Good.**

---

## 補足資料
*   [SUBMIT.md](../SUBMIT.md): 提出用概要
*   [Specification](../docs/specification.md): 詳細仕様書
