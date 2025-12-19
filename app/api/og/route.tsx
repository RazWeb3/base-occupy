// -------------------------------------------------------
// 目的: OGP用の動的画像（賞金プール/残り時間）を生成するAPIです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 14:55 Base Sepolia RPC指定とフォールバック画像を追加
// 理由: 本番環境で /api/og が 500 になりOG画像が表示されなかったため
// -------------------------------------------------------

import { ImageResponse } from 'next/og';
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains'; // Or base
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/app/constants';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let prize = searchParams.get('prize');
  let timeLeft = searchParams.get('time');

  if (!prize || !timeLeft) {
    try {
      const client = createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      });

      const prizePool = (await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'prizePool',
      })) as bigint;

      const deadline = (await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'deadline',
      })) as bigint;

      prize = formatEther(prizePool) + ' ETH';

      const now = Math.floor(Date.now() / 1000);
      const d = Number(deadline);
      if (d === 0) {
        timeLeft = 'Not Started';
      } else if (now >= d) {
        timeLeft = 'Ended';
      } else {
        const diff = d - now;
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        timeLeft = `${m}m ${s}s`;
      }
    } catch {
      prize = prize || '— ETH';
      timeLeft = timeLeft || '—';
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #475569',
            borderRadius: '20px',
            padding: '40px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '90%',
          }}
        >
          <h1
            style={{
              fontSize: '60px',
              fontWeight: 'bold',
              margin: '0 0 20px 0',
              background: 'linear-gradient(to right, #60a5fa, #a855f7)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Base Occupy
          </h1>

          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', marginTop: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '30px', color: '#94a3b8' }}>Prize Pool</span>
              <span style={{ fontSize: '50px', fontWeight: 'bold', color: '#facc15' }}>{prize}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '30px', color: '#94a3b8' }}>Time Left</span>
              <span
                style={{
                  fontSize: '50px',
                  fontWeight: 'bold',
                  color: timeLeft === 'Ended' ? '#ef4444' : '#4ade80',
                }}
              >
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
