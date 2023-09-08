// import { Chains, Banana } from '@bananahq/banana-sdk-tg-bot'
import { Chains, Banana } from '@bananahq/banana-sdk-tg-bot-modified'
// import { Chains, Banana } from '@bananahq/banana-sdk-tg-bot-wormhole'
import { POLYGON_RPC, GNOSIS_RPC, OPTIMISM_RPC, paymasterOptions } from '../../constant.js';
import { ethers } from 'ethers';

export const sendTransaction = async (txnConstructionResponse, userMeta) => {
    let txnHash = '';

    const transactions = txnConstructionResponse.transactions;

    const polygonRpcProvider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    const gnosisRpcProvider = new ethers.providers.JsonRpcProvider(GNOSIS_RPC);
    const optimismRpcProvider = new ethers.providers.JsonRpcProvider(OPTIMISM_RPC);

    console.log('this is user meta', userMeta)
    
    const polygonSigner = new ethers.Wallet(
        userMeta.accountPrivateKey,
        polygonRpcProvider
    );

    const gnosisSigner = new ethers.Wallet(
        userMeta.accountPrivateKey,
        gnosisRpcProvider
    )

    const optimismSigner = new ethers.Wallet(
        userMeta.accountPrivateKey,
        optimismRpcProvider
    );

    const chainId = txnConstructionResponse.chainId;
    let currentChain;

    let bananaInstance;
    let wallet;
    let scanBaseUrl;

    if(chainId ===  137)  { 
        currentChain = Chains.polygonMainnet;
        bananaInstance = new Banana(currentChain, polygonSigner ,paymasterOptions);
        wallet = await bananaInstance.connectWallet();
        scanBaseUrl = 'https://polygonscan.com/tx/';
    }
    if(chainId === 10) {
        currentChain = Chains.optimism;
        bananaInstance = new Banana(currentChain, optimismSigner, paymasterOptions);
        wallet = await bananaInstance.connectWallet(); 
        scanBaseUrl = 'https://gnosisscan.io/tx/';
    }
    if(chainId === 100) {
        currentChain = Chains.gnosis;
        bananaInstance = new Banana(currentChain, gnosisSigner, paymasterOptions);
        wallet = await bananaInstance.connectWallet();
        scanBaseUrl = 'https://optimistic.etherscan.io/tx/'
    }

    console.log('thios is wallet ', wallet);

    const signer = wallet.getSigner()

    // let txns = transactions.map(txn => {
    //     return {
    //         to: txn.to,
    //         data: txn.data,
    //         value: '0x00',
    //         gasLimit: '100000'
    //     };
    // })

    console.log('this is ssigner ', signer);

    // const normalCalls = transactions.find(txn => txn.delegateCall === false);
    // const delegateCalls = transactions.find(txn => txn.delegateCall === true);
    let txnReceipt;

    // console.log('normal calls ', normalCalls)
    // console.log('delegate calls ', delegateCalls)

    if(!txnConstructionResponse.delegateCall) {
        txnReceipt = await signer.sendBatchTransaction(transactions);
        txnHash = txnReceipt.hash;
    }

    if(txnConstructionResponse.delegateCall) {
        txnReceipt = await signer.sendTransaction(transactions[0]);
        txnHash = txnReceipt.hash;
    }

    return {
        txnLink: `${scanBaseUrl}${txnHash}`,
        txnHash
    }
}