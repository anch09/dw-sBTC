'use client';

import {Input} from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { usePathname, useRouter } from "next/navigation";
import { capitalizeWords } from "../utils/manipulators";
import { ChangeEvent, useEffect, useState, MouseEvent } from "react";
import { btcInSats, testnet } from "../utils/constants";
import {
  DevEnvHelper,
  sbtcDepositHelper,
  sbtcWithdrawHelper,
  sbtcWithdrawMessage,
  TESTNET,
  REGTEST,
  TestnetHelper,
  WALLET_00,
  WALLET_01,
} from "sbtc";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import * as btc from "@scure/btc-signer";
import { btcAddress, btcPublicKey, isUserSignedIn, setDevnetWallet, userSession, userStxAddress } from "../utils/connect-wallet";
import { openSignatureRequestPopup } from "@stacks/connect-react";
import { StacksTestnet, StacksMocknet } from "@stacks/network";
import classnames from 'classnames';

const DepositWithdraw = () => {
  const router = useRouter();
  const pathname = usePathname().slice(1);
  const [amount, setAmount] = useState(0);
  const [signature, setSignature] = useState("");
  const [balances, setBalances] = useState({
    sbtc_balance: 0,
    btc_balance: 0
  })

  const changeAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    setAmount(Number(amount) * btcInSats);
  }

  const buildDepositTransaction = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Helper for working with various API and RPC endpoints and getting and processing data
    // Change this depending on what network you are working with
    // const testnet = new TestnetHelper();

    // setting BTC address for devnet
    // Because of some quirks with Leather, we need to pull our BTC wallet using the helper if we are on devnet
    // const bitcoinAccountA = await testnet.getBitcoinAccount(WALLET_00);
    // const btcAddress = bitcoinAccountA.wpkh.address;
    // const btcPublicKey = bitcoinAccountA.publicKey.buffer.toString();

    let utxos = await testnet.fetchUtxos(btcAddress);

    // If we are working via testnet
    // get sBTC deposit address from bridge API
    // const response = await fetch(
    //   "https://bridge.sbtc.tech/bridge-api/testnet/v1/sbtc/init-ui"
    // );
    // const data = await response.json();
    // const sbtcWalletAddress = data.sbtcContractData.sbtcWalletAddress;

    // if we are working via devnet we can use the helper to get the sbtc wallet address, which is associated with the first wallet
    const sbtcWalletAccount = await testnet.getBitcoinAccount(WALLET_00);
    const sbtcWalletAddress = sbtcWalletAccount.tr.address;
    const paymentPublicKey = bytesToHex(sbtcWalletAccount.tr.publicKey);

    const tx = await sbtcDepositHelper({
      // comment this line out if working via devnet
      // network: TESTNET,
      network: REGTEST,
      pegAddress: sbtcWalletAddress,
      paymentPublicKey,
      // pegAddress: 'tb1pte5zmd7qzj4hdu45lh9mmdm0nwq3z35pwnxmzkwld6y0a8g83nnq6ts2d4',
      // paymentPublicKey: '034a45bd09cc815da165b8987a7263a2c4111b79951562fc5c0989e9cdf5ceded2',
      // pegAddress: sbtcWalletAddress, //! This could be a mistake
      stacksAddress: userStxAddress,
      amountSats: amount,
      // we can use the helper to get an estimated fee for our transaction
      feeRate: await testnet.estimateFeeRate('low'),
      // the helper will automatically parse through these and use one or some as inputs
      utxos,
      // where we want our remainder to be sent. UTXOs can only be spent as is, not divided, so we need a new input with the difference between our UTXO and how much we want to send
      bitcoinChangeAddress: btcAddress,
    });

    // convert the returned transaction object into a PSBT for Leather to use
    const psbt = tx.toPSBT();
    const requestParams = {
      publicKey: btcPublicKey,
      hex: bytesToHex(psbt),
    };
    // Call Leather API to sign the PSBT and finalize it
    const txResponse = await window.btc.request("signPsbt", requestParams);
    const formattedTx = btc.Transaction.fromPSBT(
      hexToBytes(txResponse.result.hex)
    );
    formattedTx.finalize();

    // Broadcast it using the helper
    const finalTx = await testnet.broadcastTx(formattedTx);

    // Get the transaction ID
    console.log(finalTx);
  };

  const signMessage = async (e) => {
    e.preventDefault();

    // First we need to sign a Stacks message to prove we own the sBTC
    const uint8ArrayMessage = new TextEncoder().encode(sbtcWithdrawMessage({
      network: REGTEST,
      amountSats: amount,
      bitcoinAddress: btcAddress
    }))
    // The sbtc paclage can help us format this
    const message = bytesToHex(uint8ArrayMessage);
    // Now we can use Leather to sign that message
    openSignatureRequestPopup({
      message,
      userSession,
      network: new StacksTestnet(),
      onFinish: (data) => {
        // Here we set the signature
        setSignature(data.signature);
      },
    });
  };

  const buildWithdrawTransaction = async (e) => {
    // Once the signature has been set, we can build and broadcast the transaction
    e.preventDefault();
    // Helper for working with various API and RPC endpoints and getting and processing data
    // Change this depending on what network you are working with
    // const testnet = new TestnetHelper();
    

    // setting BTC address for devnet
    // Because of some quirks with Leather, we need to pull our BTC wallet using the helper if we are on devnet
    // const bitcoinAccountA = await testnet.getBitcoinAccount(WALLET_00);
    // const btcAddress = bitcoinAccountA.wpkh.address;
    // const btcPublicKey = bitcoinAccountA.publicKey.buffer.toString();

    // setting BTC address for testnet
    // here we are pulling directly from our authenticated wallet
    // const btcAddress = userBtcAddress;
    // const btcPublicKey = userBtcPublicKey;

    let utxos = await testnet.fetchUtxos(btcAddress);

    // If we are working via testnet
    // get sBTC deposit address from bridge API
    // const response = await fetch(
    //   "https://bridge.sbtc.tech/bridge-api/testnet/v1/sbtc/init-ui"
    // );
    // const data = await response.json();
    // const sbtcWalletAddress = data.sbtcContractData.sbtcWalletAddress;

    // if we are working via devnet we can use the helper to get the sbtc wallet address, which is associated with the first wallet
    const sbtcWalletAccount = await testnet.getBitcoinAccount(WALLET_00);
    const sbtcWalletAddress = sbtcWalletAccount.tr.address;
    const paymentPublicKey = bytesToHex(sbtcWalletAccount.tr.publicKey);

    const tx = await sbtcWithdrawHelper({
      // comment this line out if working via devnet
      network: REGTEST,
      pegAddress: sbtcWalletAddress,
      paymentPublicKey,
      // sbtcWalletAddress,
      bitcoinAddress: btcAddress,
      amountSats: amount,
      signature,
      feeRate: await testnet.estimateFeeRate("low"),
      fulfillmentFeeSats: 2000,
      utxos,
      bitcoinChangeAddress: btcAddress,
    });
    const psbt = tx.toPSBT();
    const requestParams = {
      publicKey: btcPublicKey,
      hex: bytesToHex(psbt),
    };
    const txResponse = await window.btc.request("signPsbt", requestParams);
    const formattedTx = btc.Transaction.fromPSBT(
      hexToBytes(txResponse.result.hex)
    );
    formattedTx.finalize();
    const finalTx = await testnet.broadcastTx(formattedTx);
    console.log(finalTx);
  };

  const setBalancesState = async () => {
    if(isUserSignedIn) {
      const sbtc_balance = await testnet.getSbtcBalance({holderAddress: userStxAddress, sbtcContract: `${userStxAddress}.asset`});
      const btc_balance = await testnet.getBalance(btcAddress);
      setBalances({
        sbtc_balance: Number(sbtc_balance) / btcInSats,
        btc_balance: btc_balance / btcInSats
      })
    }
  }

  useEffect(() => {
    setDevnetWallet();
    setBalancesState();
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 w-3/6 mx-auto">
      <div className="flex flex-col w-full flex-wrap md:flex-nowrap gap-4 w-3/6">
        <Input 
          key={'#f7931a'}
          type="text"
          label="Avilable in your wallet"
          value={`${(pathname === 'deposit' ? balances.btc_balance : balances.sbtc_balance || 0).toLocaleString('en-US', {maximumFractionDigits: 4})} ${pathname === 'deposit' ? 'BTC' : 'sBTC'}`}
          isReadOnly
        />
        <Input
          type="number"
          label={`Amount to ${pathname} (in ${pathname === 'deposit' ? 'BTC' : 'sBTC'})`} 
          color={'warning'}
          onChange={changeAmount}
        />
        <Button 
          className={classnames("font-bold", {"bg-gradient-to-tr from-orange-700 to-yellow-500 text-whiteshadow-lg":  pathname === 'deposit' ? amount <= balances.btc_balance * btcInSats : amount <= balances.sbtc_balance * btcInSats})}
          isDisabled={amount <= 0 || !isUserSignedIn || pathname === 'deposit' ? amount > balances.btc_balance * btcInSats : amount > balances.sbtc_balance * btcInSats}
          onClick={pathname === 'deposit' ? buildDepositTransaction : !signature ? signMessage : buildWithdrawTransaction}
          color="danger"
        >
          {
            pathname === 'deposit' ? amount > balances.btc_balance * btcInSats ? 'Insuficient funds available' : capitalizeWords(pathname) : amount > balances.sbtc_balance * btcInSats ? 'Insuficient funds available' : !signature ? 'Sign withdraw tx' : capitalizeWords(pathname)
          }
        </Button>
      </div>
    </main>
  )
}

export default DepositWithdraw