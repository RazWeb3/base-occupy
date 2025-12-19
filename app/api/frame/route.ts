// -------------------------------------------------------
// 目的: Farcaster Frame v2のHTMLメタタグを返すエンドポイントです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 16:20 未使用引数を除去してlintを通過させる
// 理由: Next.js route handlerで未使用引数がlint失敗になるため
// 2025/12/19 17:10 本番URLをリクエストから自動推定してlocalhost混入を防止
// 理由: SNSカード/Frame埋め込みでlocalhostが出ると外部から参照できないため
// 2025/12/19 17:40 envがlocalhostでも本番URLへフォールバック
// 理由: NEXT_PUBLIC_BASE_URLの誤設定でlocalhostが混入するケースを防ぐため
// -------------------------------------------------------

import { NextResponse } from 'next/server';

const getBaseUrl = (request: Request) => {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, '')
    try {
      const hostname = new URL(trimmed).hostname
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') return trimmed
    } catch {
      if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) return trimmed
    }
  }
  return new URL(request.url).origin;
};

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  const imageUrl = `${baseUrl}/api/og?ts=${Date.now()}`;
  
  return new NextResponse(
    `<!DOCTYPE html>
      <html>
        <head>
          <title>Base Occupy</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Occupy (0.01 ETH)" />
          <meta property="fc:frame:button:1:action" content="tx" />
          <meta property="fc:frame:button:1:target" content="${baseUrl}/api/frame/tx" />
          <meta property="fc:frame:button:2" content="Share" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=I%20am%20fighting%20for%20the%20throne%20on%20Base%20Occupy!%20Join%20now!&embeds[]=${baseUrl}/" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/frame" />
        </head>
        <body>
            <h1>Base Occupy</h1>
        </body>
      </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

export async function POST(request: Request) {
  return GET(request);
}
