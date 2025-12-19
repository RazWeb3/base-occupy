// -------------------------------------------------------
// 目的: Farcaster Mini Appのドメイン検証手順を案内するページです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 14:55 ドメイン表示の初期化方法を調整
// 理由: lintの指摘を回避しつつ初期表示を安定させるため
// 2025/12/19 16:20 未使用コードを整理してlintを通過させる
// 理由: ガイドページ内の未使用hooksがlint失敗になるため
// -------------------------------------------------------

'use client'

import { useState } from 'react'

export default function SetupPage() {
  const [domain] = useState(() => (typeof window !== 'undefined' ? window.location.host : ''))
  const [signatureData, setSignatureData] = useState<string>('')

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 space-y-6">
        <h1 className="text-3xl font-bold text-center text-blue-400">Mini App Setup</h1>
        
        <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-600">
                <h2 className="font-bold text-lg mb-2">Step 1: Domain Verification</h2>
                <p className="text-slate-400 text-sm mb-4">
                    To enable the Popup experience (Mini App), you must verify that you own this domain 
                    (<strong>{domain}</strong>) and link it to your Farcaster account.
                </p>
                
                <div className="space-y-2">
                    <p className="text-sm">1. Go to the <a href="https://warpcast.com/~/developers/frames" target="_blank" className="text-blue-400 hover:underline">Warpcast Developer Console</a> or Base Build Tool.</p>
                    <p className="text-sm">2. Enter your domain: <code className="bg-slate-800 px-2 py-1 rounded select-all">{domain}</code></p>
                    <p className="text-sm">3. Sign the message with your wallet.</p>
                    <p className="text-sm">4. Copy the generated JSON (header, payload, signature).</p>
                </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-600">
                <h2 className="font-bold text-lg mb-2">Step 2: Update Manifest</h2>
                <p className="text-slate-400 text-sm mb-4">
                    Paste the generated JSON into your <code>public/.well-known/farcaster.json</code> file.
                </p>
                <textarea 
                    className="w-full bg-slate-800 p-3 rounded text-xs font-mono h-32 border border-slate-700"
                    placeholder='Paste here to verify format...'
                    onChange={(e) => setSignatureData(e.target.value)}
                />
            </div>
            
            {signatureData && (
                <div className="bg-green-900/30 p-4 rounded-xl border border-green-600">
                    <h2 className="font-bold text-green-400 text-lg mb-2">Ready to Update!</h2>
                    <p className="text-sm">Now ask the AI assistant:</p>
                    <p className="mt-2 font-mono bg-black/30 p-2 rounded text-xs select-all">
                        I have the signature JSON. Please update farcaster.json with this: {signatureData}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
