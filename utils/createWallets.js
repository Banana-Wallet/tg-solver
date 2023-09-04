import { Banana, Chains } from "@bananahq/banana-sdk-test";
import { POLYGON_RPC } from "../constant.js";
import fs from 'fs'
import Wallet from "ethereumjs-wallet";
import { ethers } from "ethers";

// Initialize an empty array to store multiple wallets
const walletArray = [];

// Generate multiple Ethereum wallets (e.g., 5 wallets)
for (let i = 0; i < 20; i++) {
  const wallet = Wallet['default'].generate();
  const polygonRpcProvider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);

  const privateKey = wallet.getPrivateKeyString();
  const publicKey = wallet.getPublicKeyString();
  const address = wallet.getAddressString();

  const polygonSigner = new ethers.Wallet(
    privateKey,
    polygonRpcProvider
  );

  const bananaPolygonInstance = new Banana(
    Chains.polygonMainnet,
    polygonSigner
  );

  const bananaPolygonWallet = await bananaPolygonInstance.connectWallet();
  const scaAddress = await bananaPolygonWallet.getAddress()

  const walletInfo = {
    privateKey,
    publicKey,
    address,
    scaAddress
  }

  walletArray.push(walletInfo);
  console.log('Wallet created:', scaAddress);
}

// Save the array of wallet information to a JSON file
fs.writeFile('./config/wallets.json', JSON.stringify(walletArray, null, 2), (err) => {
  if (err) {
    console.error('Error writing to file:', err);
  } else {
    console.log('Array of wallet information saved to wallets.json');
  }
});
