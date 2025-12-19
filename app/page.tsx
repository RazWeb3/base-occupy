// -------------------------------------------------------
// 目的: ゲームのメインUI（Webフロントエンド）を担当するファイルです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 12:00 メニュー、ゲーム説明、言語切替機能（日/英）を追加
// 2025/12/19 12:30 Base Sepolia利用の注記とシェア機能の説明を追加
// 2025/12/19 13:50 メニュー内に注記/ルール4を表示、日英翻訳を補完
// 理由: UIに表示されずユーザーが確認できなかったため
// 2025/12/19 14:50 シェア文言を日本語対応、OG画像生成の安定化に伴う調整
// 理由: 日本語時に英語文言でシェアされ、OG画像が表示されなかったため
// 2025/12/19 15:20 読み取りチェーンをBase Sepoliaに固定して環境差のローディングを改善
// 理由: 一部WebViewでBase Mainnet RPCがタイムアウトし表示が止まっていたため
// 2025/12/19 16:20 Farcaster(Android)向けにMini App SDKのEVM Provider接続を追加
// 理由: Farcaster Android内のWebViewでInjected Providerが提供されず接続が無反応になるため
// 2025/12/19 16:35 Farcaster Providerをwindow.ethereumへ注入してInjected接続を成立させる
// 理由: wagmi側の型制約を避けつつMini App内のEVM Providerを利用するため
// 2025/12/19 16:55 Mini Appのwallet/capabilities診断UIとシェア埋め込みを改善
// 理由: Android Farcasterでの失敗原因の切り分けと、シェアでアプリ埋め込みを復活させるため
// 理由: ユーザーからの機能追加要望とUX改善のため
// 2025/12/19 17:25 シェアURL生成でlocalhost混入を防止
// 理由: 本番SNS投稿では外部から参照できるURLでカードを生成する必要があるため
// 2025/12/19 17:30 ローカルシェアでも本番アプリURLを優先
// 理由: 開発中でも共有導線は常に公開URLを指す方が検証しやすいため
// 2025/12/19 17:40 envがlocalhostでも本番URLへフォールバック
// 理由: NEXT_PUBLIC_BASE_URLの誤設定でlocalhostが混入するケースを防ぐため
// -------------------------------------------------------

'use client'

import { useState, useEffect } from 'react'
import sdk from '@farcaster/miniapp-sdk'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { formatEther, parseEther } from 'viem'
import Image from 'next/image'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './constants'

// --- Translations ---
const translations = {
  en: {
    title: "Base Occupy",
    round: "Round",
    prizePool: "Prize Pool",
    timeLeft: "Time Left",
    currentKing: "Current King",
    connectWallet: "Connect Wallet",
    wrongNetwork: "Wrong Network",
    switchNetwork: "Switch to Base Sepolia",
    disconnect: "Disconnect",
    claimWinnings: "Withdraw Winnings",
    youHaveWinnings: "You have winnings to claim!",
    settleAndClaim: "Settle Round & Claim Winnings",
    startNewRound: "Start New Round & Occupy (0.01 ETH)",
    occupyThrone: "Occupy Throne (0.01 ETH)",
    confirming: "Confirming...",
    processing: "Processing...",
    provoke: "Provoke",
    taunt: "Taunt",
    decree: "Decree",
    provokeText: "Provoke challengers to increase the pool!",
    shareProvoke: "Current Prize: {prize} ETH. Easy money. Who wants to donate more? 🤑 #BaseOccupy #Base",
    shareTaunt: "I own the throne and {prize} ETH. Is everyone else asleep? Come on! 😴 #BaseOccupy #Base",
    shareDecree: "{prize} ETH is mine. The timer is ticking. Pay the tax or bow down! 👑 #BaseOccupy #Base",
    yourStatus: "Your Status",
    deposits: "Deposits",
    wins: "Wins",
    toVeteran: "more deposits to become a Veteran!",
    menu: "Menu",
    close: "Close",
    howToPlay: "How to Play",
    rule1: "1. Pay 0.01 ETH to occupy the throne.",
    rule2: "2. Each occupation extends the timer.",
    rule3: "3. The last person on the throne when time runs out wins the prize!",
    rule4: "4. Become the King to unlock special share buttons and taunt your rivals!",
    ruleFee: "* 10% fee applies to the pot.",
    networkNote: "Note: This game runs on Base Sepolia Testnet.",
    language: "Language",
    loading: "Loading...",
    gameNotStarted: "Game Not Started",
    ended: "Ended",
    none: "None",
    noNft: "No NFT",
    connected: "Connected",
    diagnostics: "Diagnostics",
    refresh: "Refresh",
    isMiniApp: "In Mini App",
    hasInjected: "Injected available",
    hasMiniAppProvider: "Mini App provider available",
    capabilities: "Capabilities",
    ethChainId: "eth_chainId",
    ethAccounts: "eth_accounts",
    testRequestAccounts: "Test eth_requestAccounts",
    requestAccountsResult: "eth_requestAccounts result",
  },
  ja: {
    title: "Base Occupy",
    round: "ラウンド",
    prizePool: "賞金プール",
    timeLeft: "残り時間",
    currentKing: "現在の王",
    connectWallet: "ウォレット接続",
    wrongNetwork: "ネットワークエラー",
    switchNetwork: "Base Sepoliaに切り替え",
    disconnect: "切断",
    claimWinnings: "賞金を引き出す",
    youHaveWinnings: "受け取れる賞金があります！",
    settleAndClaim: "ラウンドを終了して賞金を受け取る",
    startNewRound: "新ラウンド開始 & 王座奪取 (0.01 ETH)",
    occupyThrone: "王座を奪う (0.01 ETH)",
    confirming: "確認中...",
    processing: "処理中...",
    provoke: "挑発",
    taunt: "煽り",
    decree: "布石",
    provokeText: "挑戦者を挑発してプールを増やそう！",
    shareProvoke: "賞金 {prize} ETH。美味しすぎ。上乗せしてくれる人いる？ 😈 #BaseOccupy #Base",
    shareTaunt: "王座も賞金 {prize} ETH も、いま私のもの。奪いに来なよ。😴 #BaseOccupy #Base",
    shareDecree: "タイマー進行中。賞金 {prize} ETH、取りに来るなら今。👑 #BaseOccupy #Base",
    yourStatus: "あなたのステータス",
    deposits: "参加回数",
    wins: "勝利数",
    toVeteran: "回でベテランランクに昇格！",
    menu: "メニュー",
    close: "閉じる",
    howToPlay: "遊び方",
    rule1: "1. 0.01 ETHを支払って王座を奪います。",
    rule2: "2. 王座が奪われるたびに時間が延長されます。",
    rule3: "3. 時間切れの時点で王座にいた人が賞金を総取りします！",
    rule4: "4. 王座を奪うと特別なシェアボタンが解除され、ライバルを挑発できます！",
    ruleFee: "※ 10%の手数料が差し引かれます。",
    networkNote: "注意: このゲームは Base Sepolia Testnet 上で動作します。",
    language: "言語設定",
    loading: "読み込み中...",
    gameNotStarted: "開始前",
    ended: "終了",
    none: "なし",
    noNft: "NFTなし",
    connected: "接続中",
    diagnostics: "診断",
    refresh: "更新",
    isMiniApp: "Mini App内",
    hasInjected: "Injected有効",
    hasMiniAppProvider: "Mini App Provider有効",
    capabilities: "Capabilities",
    ethChainId: "eth_chainId",
    ethAccounts: "eth_accounts",
    testRequestAccounts: "eth_requestAccounts テスト",
    requestAccountsResult: "eth_requestAccounts 結果",
  }
}

function formatAddress(address: string) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // --- UI State ---
  const [lang, setLang] = useState<'en' | 'ja'>('en')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false)
  const [capabilities, setCapabilities] = useState<string[] | null>(null)
  const [hasMiniAppProvider, setHasMiniAppProvider] = useState(false)
  const [hasInjectedProvider, setHasInjectedProvider] = useState(false)
  const [providerChainId, setProviderChainId] = useState<string | null>(null)
  const [providerAccounts, setProviderAccounts] = useState<string[] | null>(null)
  const [requestAccountsResult, setRequestAccountsResult] = useState<string | null>(null)
  const t = translations[lang]

  const getBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (envUrl) {
      const trimmed = envUrl.replace(/\/+$/, '')
      try {
        const hostname = new URL(trimmed).hostname
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') return trimmed
      } catch {
        if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) return trimmed
      }
    }

    if (typeof window !== 'undefined') {
      const { origin, hostname } = window.location
      if (hostname === 'localhost' || hostname === '127.0.0.1') return 'https://traebaseecta.vercel.app'
      return origin
    }
    return 'https://traebaseecta.vercel.app'
  }

  const refreshDiagnostics = async () => {
    const w = window as unknown as { ethereum?: unknown }
    setHasInjectedProvider(!!w.ethereum)

    const inMiniApp = await sdk.isInMiniApp().catch(() => false)
    setIsMiniApp(inMiniApp)

    const caps = await sdk.getCapabilities().catch(() => null)
    setCapabilities(caps ? (caps as string[]) : null)

    const provider = await sdk.wallet.getEthereumProvider().catch(() => undefined)
    setHasMiniAppProvider(!!provider)
    if (!provider) {
      setProviderChainId(null)
      setProviderAccounts(null)
      return
    }

    const chainId = await provider.request({ method: 'eth_chainId' }).catch(() => null)
    setProviderChainId(typeof chainId === 'string' ? chainId : null)

    const accounts = await provider.request({ method: 'eth_accounts' }).catch(() => null)
    setProviderAccounts(Array.isArray(accounts) ? (accounts as string[]) : null)
  }

  useEffect(() => {
    const initSdk = async () => {
      await sdk.actions.ready().catch(() => undefined)
      const inMiniApp = await sdk.isInMiniApp().catch(() => false)
      setIsMiniApp(inMiniApp)

      if (inMiniApp) {
        const provider = await sdk.wallet.getEthereumProvider().catch(() => undefined)
        if (provider) {
          const w = window as unknown as { ethereum?: unknown }
          if (!w.ethereum) w.ethereum = provider
        }
      }

      await refreshDiagnostics()
    };
    initSdk();
  }, []);

  const handleConnectWallet = async () => {
    const inMiniApp = isMiniApp || (await sdk.isInMiniApp().catch(() => false))
    if (inMiniApp) {
      const provider = await sdk.wallet.getEthereumProvider().catch(() => undefined)
      if (provider) {
        const w = window as unknown as { ethereum?: unknown }
        w.ethereum = provider
      }
    }

    connect({ connector: injected() })
  }

  const handleTestRequestAccounts = async () => {
    setRequestAccountsResult(null)
    const provider = await sdk.wallet.getEthereumProvider().catch(() => undefined)
    if (!provider) {
      setRequestAccountsResult('provider unavailable')
      return
    }

    try {
      const result = await provider.request({ method: 'eth_requestAccounts' })
      setRequestAccountsResult(JSON.stringify(result))
    } catch (error) {
      if (error && typeof error === 'object') {
        const message = 'message' in error ? String((error as { message?: unknown }).message) : 'unknown error'
        const code = 'code' in error ? String((error as { code?: unknown }).code) : ''
        setRequestAccountsResult(code ? `${code}: ${message}` : message)
        return
      }

      setRequestAccountsResult(String(error))
    }
  }

  // --- Read Contract State ---
  const { data: prizePool, refetch: refetchPrize } = useReadContract({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'prizePool',
  })

  const { data: deadline, refetch: refetchDeadline } = useReadContract({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'deadline',
  })

  const { data: lastDepositor, refetch: refetchDepositor } = useReadContract({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'lastDepositor',
  })

  const { data: gameRound, refetch: refetchGameRound } = useReadContract({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'gameRound',
  })

  const { data: pendingWithdrawal, refetch: refetchPendingWithdrawal } = useReadContract({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pendingWithdrawals',
    args: address ? [address] : undefined,
    query: {
        enabled: !!address
    }
  })

  const { data: userStatData, refetch: refetchUserStat } = useReadContract({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'userStats',
    args: address ? [address] : undefined,
    query: {
        enabled: !!address
    }
  })

  const userStat = userStatData as unknown as [bigint, bigint, bigint, bigint, boolean, boolean] | undefined;

  const { data: tokenURI, refetch: refetchTokenURI } = useReadContract({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'tokenURI',
    args: userStat && userStat[0] > 0n ? [userStat[0]] : undefined,
    query: {
        enabled: !!userStat && userStat[0] > 0n
    }
  })

  // --- Event Listening ---
  useWatchContractEvent({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'Occupied',
    onLogs(logs) {
      console.log('New occupation!', logs)
      refetchPrize()
      refetchDeadline()
      refetchDepositor()
      refetchUserStat()
      refetchTokenURI()
      refetchGameRound()
    },
  })

  useWatchContractEvent({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'WinnerArchived',
    onLogs(logs) {
        console.log('Winner Archived!', logs)
        refetchPrize()
        refetchDeadline()
        refetchDepositor()
        refetchGameRound()
        refetchPendingWithdrawal()
        refetchUserStat()
    }
  })

  useWatchContractEvent({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'Withdrawal',
    onLogs() {
        refetchPendingWithdrawal()
    }
  })

  useWatchContractEvent({
    chainId: baseSepolia.id,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'SuddenDeathTriggered',
    onLogs() {
        refetchDeadline()
    }
  })

  // --- Timer ---
  const [timeLeft, setTimeLeft] = useState<string>("")
  
  useEffect(() => {
    const timer = setInterval(() => {
        if (!deadline) {
            setTimeLeft(t.loading)
            return
        }
        const now = Math.floor(Date.now() / 1000)
        const d = Number(deadline)
        if (d === 0) {
            setTimeLeft(t.gameNotStarted)
        } else if (now >= d) {
            setTimeLeft(t.ended)
        } else {
            const diff = d - now
            const m = Math.floor(diff / 60)
            const s = diff % 60
            setTimeLeft(`${m}m ${s}s`)
        }
    }, 1000)
    return () => clearInterval(timer)
  }, [deadline, t])


  // --- Actions ---
  const handleOccupy = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'occupy',
      value: parseEther('0.01'),
    })
  }

  const handleClaim = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdraw',
    })
  }

  const handleSettle = () => {
    writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'settleRound',
    })
  }

  const handleShare = async (pattern: 'provoke' | 'taunt' | 'decree') => {
    const currentPrize = prizePool ? formatEther(prizePool as bigint) : '0';
    let text = "";

    switch (pattern) {
        case 'provoke':
            text = t.shareProvoke.replace('{prize}', currentPrize);
            break;
        case 'taunt':
            text = t.shareTaunt.replace('{prize}', currentPrize);
            break;
        case 'decree':
            text = t.shareDecree.replace('{prize}', currentPrize);
            break;
    }

    const baseUrl = getBaseUrl();
    const homeUrl = `${baseUrl}/`;
    const shareText = text;

    const intentUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(homeUrl)}`

    const inMiniApp = isMiniApp || (await sdk.isInMiniApp().catch(() => false))

    if (inMiniApp) {
      await sdk.actions.composeCast({ text: shareText, embeds: [homeUrl] }).catch(async () => {
        await sdk.actions.openUrl(intentUrl).catch(() => {
          window.open(intentUrl, '_blank')
        })
      })
      return
    }

    window.open(intentUrl, '_blank')
  };

  // --- Parse NFT Image ---
  const [nftImage, setNftImage] = useState<string | null>(null)
  useEffect(() => {
    if (tokenURI) {
        try {
            const json = atob(tokenURI.toString().split(',')[1])
            const parsed = JSON.parse(json)
            setNftImage(parsed.image)
        } catch (e) {
            console.error("Failed to parse tokenURI", e)
        }
    }
  }, [tokenURI])


  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans relative">
      
      {/* Menu Button */}
      <div className="absolute top-4 right-4 z-10">
        <button 
            onClick={() => setIsMenuOpen(true)}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors"
        >
            {t.menu}
        </button>
      </div>

      {/* Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-600 shadow-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <h2 className="text-xl font-bold">{t.menu}</h2>
                    <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase">{t.language}</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setLang('en')}
                                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                English
                            </button>
                            <button 
                                onClick={() => setLang('ja')}
                                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${lang === 'ja' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                日本語
                            </button>
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={() => {
                              setIsDiagnosticsOpen((v) => !v)
                              if (!isDiagnosticsOpen) void refreshDiagnostics()
                            }}
                            className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold transition-colors"
                        >
                            {t.diagnostics}
                        </button>

                        {isDiagnosticsOpen && (
                          <div className="mt-3 text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl space-y-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => void refreshDiagnostics()}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg font-bold transition-colors"
                              >
                                {t.refresh}
                              </button>
                              <button
                                onClick={() => void handleTestRequestAccounts()}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg font-bold transition-colors"
                              >
                                {t.testRequestAccounts}
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-slate-900 p-2 rounded">
                                <div className="text-xs text-slate-400">{t.isMiniApp}</div>
                                <div className="font-mono">{isMiniApp ? 'true' : 'false'}</div>
                              </div>
                              <div className="bg-slate-900 p-2 rounded">
                                <div className="text-xs text-slate-400">{t.hasInjected}</div>
                                <div className="font-mono">{hasInjectedProvider ? 'true' : 'false'}</div>
                              </div>
                              <div className="bg-slate-900 p-2 rounded">
                                <div className="text-xs text-slate-400">{t.hasMiniAppProvider}</div>
                                <div className="font-mono">{hasMiniAppProvider ? 'true' : 'false'}</div>
                              </div>
                              <div className="bg-slate-900 p-2 rounded">
                                <div className="text-xs text-slate-400">{t.ethChainId}</div>
                                <div className="font-mono break-all">{providerChainId ?? '-'}</div>
                              </div>
                            </div>

                            <div className="bg-slate-900 p-2 rounded">
                              <div className="text-xs text-slate-400">{t.ethAccounts}</div>
                              <div className="font-mono break-all">{providerAccounts ? JSON.stringify(providerAccounts) : '-'}</div>
                            </div>

                            <div className="bg-slate-900 p-2 rounded">
                              <div className="text-xs text-slate-400">{t.requestAccountsResult}</div>
                              <div className="font-mono break-all">{requestAccountsResult ?? '-'}</div>
                            </div>

                            <div className="bg-slate-900 p-2 rounded">
                              <div className="text-xs text-slate-400">{t.capabilities}</div>
                              <div className="font-mono break-all">{capabilities ? JSON.stringify(capabilities) : '-'}</div>
                            </div>
                          </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase">{t.howToPlay}</h3>
                        <div className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl">
                            <div className="text-xs text-yellow-300 mb-3">{t.networkNote}</div>
                            <ul className="space-y-2">
                                <li>{t.rule1}</li>
                                <li>{t.rule2}</li>
                                <li>{t.rule3}</li>
                                <li className="text-blue-300 font-medium">{t.rule4}</li>
                                <li className="text-xs text-slate-500 mt-2">{t.ruleFee}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold transition-colors"
                >
                    {t.close}
                </button>
            </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto space-y-8 mt-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {t.title}
            </h1>
            <p className="text-slate-400">{t.round} #{gameRound?.toString()}</p>
        </header>

        {/* Game Status Card */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-slate-900 rounded-xl">
                    <p className="text-sm text-slate-400">{t.prizePool}</p>
                    <p className="text-2xl font-bold text-yellow-400">
                        {prizePool ? formatEther(prizePool as bigint) : '0'} ETH
                    </p>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl">
                    <p className="text-sm text-slate-400">{t.timeLeft}</p>
                    <p className={`text-2xl font-bold ${timeLeft === t.ended ? 'text-red-500' : 'text-green-400'}`}>
                        {timeLeft}
                    </p>
                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-400 mb-1">{t.currentKing}</p>
                <div className="inline-block bg-slate-700 px-4 py-2 rounded-full font-mono text-sm">
                    {lastDepositor ? formatAddress(String(lastDepositor)) : t.none}
                </div>
            </div>

            <div className="mt-8 flex justify-center">
                {!isConnected ? (
                    <button 
                        onClick={() => void handleConnectWallet()}
                        disabled={isConnecting}
                        className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-bold transition-colors"
                    >
                        {t.connectWallet}
                    </button>
                ) : chainId !== baseSepolia.id ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                         <div className="text-red-400 font-bold">
                            {t.wrongNetwork}
                        </div>
                        <button
                            onClick={() => switchChain({ chainId: baseSepolia.id })}
                            className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold text-lg shadow-lg animate-pulse transition-all"
                        >
                            {t.switchNetwork}
                        </button>
                         <button onClick={() => disconnect()} className="text-sm text-slate-400 hover:underline">
                            {t.disconnect}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 w-full">
                        {!!pendingWithdrawal && (pendingWithdrawal as bigint) > 0n && (
                            <div className="bg-green-900/50 border border-green-500 rounded-xl p-4 text-center mb-4">
                                <p className="text-green-400 font-bold mb-2">{t.youHaveWinnings}</p>
                                <p className="text-2xl font-bold text-white mb-4">{formatEther(pendingWithdrawal as bigint)} ETH</p>
                                <button
                                    onClick={handleClaim}
                                    disabled={isPending || isConfirming}
                                    className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold shadow-lg disabled:opacity-50"
                                >
                                    {isPending ? t.confirming : t.claimWinnings}
                                </button>
                            </div>
                        )}

                        {timeLeft === t.ended ? (
                            <div className="space-y-4">
                                {!!lastDepositor && address && (lastDepositor as string).toLowerCase() === address.toLowerCase() && (
                                    <button
                                        onClick={handleSettle}
                                        disabled={isPending || isConfirming}
                                        className="w-full bg-yellow-600 hover:bg-yellow-500 py-3 rounded-lg font-bold shadow-lg disabled:opacity-50 animate-pulse"
                                    >
                                        {isPending ? t.confirming : t.settleAndClaim}
                                    </button>
                                )}
                                <button
                                    onClick={handleOccupy}
                                    disabled={isPending || isConfirming}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isPending ? t.confirming : isConfirming ? t.processing : t.startNewRound}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleOccupy}
                                disabled={isPending || isConfirming}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isPending ? t.confirming : isConfirming ? t.processing : t.occupyThrone}
                            </button>
                        )}
                    
                    <div className="flex justify-between items-center px-2 mt-2">
                            <span className="text-sm text-slate-400">{t.connected}: {formatAddress(address || '')}</span>
                            <button onClick={() => disconnect()} className="text-sm text-red-400 hover:underline">
                                {t.disconnect}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {hash && <div className="mt-4 text-center text-xs text-slate-500 break-all">Tx: {hash}</div>}
        </div>

        {/* Share Buttons (Only if King) */}
        {!!lastDepositor && address && (lastDepositor as string).toLowerCase() === address.toLowerCase() && (
             <div className="space-y-3">
                <p className="text-center text-slate-400 text-sm">{t.provokeText}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        onClick={() => void handleShare('provoke')}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        🤬 {t.provoke}
                    </button>
                    <button
                        onClick={() => void handleShare('taunt')}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        😴 {t.taunt}
                    </button>
                    <button
                        onClick={() => void handleShare('decree')}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        👑 {t.decree}
                    </button>
                </div>
             </div>
        )}

        {/* User Stats / NFT */}
        {isConnected && userStat && (
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-32 h-32 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-600">
                    {nftImage ? (
                        <Image src={nftImage} alt="Your NFT" width={128} height={128} unoptimized className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs text-slate-500">{t.noNft}</span>
                    )}
                </div>
                <div className="flex-1 space-y-2 w-full">
                    <h3 className="text-xl font-bold">{t.yourStatus}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-400 block">{t.deposits}</span>
                            <span className="font-mono">{userStat[1].toString()}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-400 block">{t.wins}</span>
                            <span className="font-mono">{userStat[2].toString()}</span>
                        </div>
                    </div>
                    {Number(userStat[1]) <= 10 && (
                        <p className="text-xs text-slate-400">
                            {11 - Number(userStat[1])} {t.toVeteran}
                        </p>
                    )}
                </div>
            </div>
        )}

      </main>
    </div>
  )
}
