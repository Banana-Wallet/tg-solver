export const sendTransaction = async (signer, transactions) => {
    let txnHash = '';

    if(transactions.length > 1) {
        const txnReceipt = await signer.sendBatchTransaction(transactions);  
        txnHash = txnReceipt.hash;  
    } else {
        const txnReceipt = await signer.sendTransaction(transactions[0]);  
        txnHash = txnReceipt.hash; 
    }

    return txnHash;
}