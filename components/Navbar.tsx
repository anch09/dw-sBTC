'use client';

import {Navbar, NavbarBrand, NavbarContent, NavbarItem} from "@nextui-org/navbar";
import Link from "next/link";
import {Button} from "@nextui-org/button";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { authenticate, isUserSignedIn, userSession, userStxAddress } from "../utils/connect-wallet";

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname().slice(1);

  const connectWallet = () => {
    const provider = window?.LeatherProvider || window?.XverseProviders?.StacksProvider;
    authenticate(provider, router);
  }

  const disconnect = () => {
    userSession.signUserOut('/');
  };

  return (
    <Navbar>
      <NavbarBrand>
        <Image src={'/sbtclogo.png'} alt="sbtc logo" width={30} height={30}/>
        <p className="font-bold text-inherit">sBTC</p>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem isActive={'deposit' === pathname}>
          <Link href="/deposit">
            Deposit
          </Link>
        </NavbarItem>
        <NavbarItem isActive={'withdraw' === pathname}>
          <Link href="/withdraw" aria-current="page">
            Withdraw
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            variant="flat"
            className="bg-gradient-to-tr from-orange-700 to-yellow-500 text-whiteshadow-lg"
            onClick={isUserSignedIn ? disconnect :  connectWallet}
          >
            {
              isUserSignedIn ?
              `${userStxAddress.slice(0, 4)}...${userStxAddress.slice(-4)}` :
              'Connect Wallet'
            }
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
