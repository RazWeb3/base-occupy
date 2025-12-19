// -------------------------------------------------------
// 目的: Frameのtxアクション向けにeth_sendTransactionのpayloadを返すエンドポイントです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 16:20 未使用引数を除去してlintを通過させる
// 理由: Next.js route handlerで未使用引数がlint失敗になるため
// -------------------------------------------------------

import { NextResponse } from 'next/server';
import { encodeFunctionData, parseEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/app/constants';

export async function POST() {
  // Parse the body if needed to check who is clicking, but for now just return the tx
  // const body = await req.json();
  
  const data = encodeFunctionData({
    abi: CONTRACT_ABI,
    functionName: 'occupy',
  });

  return NextResponse.json({
    chainId: "eip155:84532", // Base Sepolia (84532) or Base Mainnet (8453)
    method: "eth_sendTransaction",
    params: {
      abi: CONTRACT_ABI,
      to: CONTRACT_ADDRESS,
      data: data,
      value: parseEther('0.01').toString(),
    },
  });
}
