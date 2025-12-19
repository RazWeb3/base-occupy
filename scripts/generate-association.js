const { createWalletClient, http, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { mainnet } = require('viem/chains');

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// 1. Enter your Farcaster FID (Number)
const FID = 12345; 

// 2. Enter the domain of your Mini App (e.g., traebaseecta.vercel.app)
const DOMAIN = "traebaseecta.vercel.app";

// 3. Enter the Private Key of the wallet that owns the FID
//    (Be careful with your private key! Do not commit this file.)
const PRIVATE_KEY = "0x..."; 
// ------------------------------------------------------------------

async function generateSignature() {
  try {
    if (PRIVATE_KEY === "0x...") {
      console.error("Error: Please set your PRIVATE_KEY in the script.");
      return;
    }

    const account = privateKeyToAccount(PRIVATE_KEY);
    
    const header = {
      fid: FID,
      type: 'custody',
      key: account.address.toLowerCase(),
    };

    const payload = {
      domain: DOMAIN,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const message = `${encodedHeader}.${encodedPayload}`;
    
    const signature = await account.signMessage({
      message: message,
    });

    console.log("\n--- Generated Account Association Data ---");
    console.log("Copy these values into your public/.well-known/farcaster.json file:\n");
    
    console.log(`"header": "${encodedHeader}",`);
    console.log(`"payload": "${encodedPayload}",`);
    console.log(`"signature": "${signature}"`);
    console.log("\n------------------------------------------");

  } catch (error) {
    console.error("Error generating signature:", error);
  }
}

generateSignature();
