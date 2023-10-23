import type { AuthOptions, StacksProvider } from '@stacks/connect-react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect-react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.d';
import { DevEnvHelper, WALLET_00 } from 'sbtc';

const appConfig = new AppConfig(['store_write', 'publish_data']);

export const userSession = new UserSession({ appConfig });
export let isUserSignedIn = userSession.isUserSignedIn();
export let userStxAddress = isUserSignedIn
  ? (userSession.loadUserData().profile.stxAddress.testnet as string)
  : '';
export let btcAddress: string;
export let btcPublicKey: string;


export const authOptions: AuthOptions = {
  appDetails: {
    name: 'sBTC DW',
    icon: 'https://static.tildacdn.com/tild6534-3661-4631-b330-666433636536/1.png'
  },
  redirectTo: '/',
  userSession
};

export const setDevnetWallet = async () => {
  const testnet = new DevEnvHelper();
  const bitcoinAccountA = await testnet.getBitcoinAccount(WALLET_00);
  btcAddress = bitcoinAccountA.wpkh.address;
  btcPublicKey = bitcoinAccountA.publicKey.buffer.toString();
}

export const authenticate = (
  provider: StacksProvider | undefined,
  router: AppRouterInstance,
) => {
  showConnect(
    {
      ...authOptions,
      onFinish(payload) {
        const { userSession } = payload;
        isUserSignedIn = userSession.isUserSignedIn();
        userStxAddress = userSession.loadUserData().profile.stxAddress.testnet;
        setDevnetWallet();
        router.refresh();
      }
    },
    provider
  );
};
