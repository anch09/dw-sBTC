import { StacksProvider } from "@stacks/connect-react";

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    XverseProviders:
      | {
          StacksProvider: StacksProvider | undefined;
        }
      | undefined;
    LeatherProvider: StacksProvider | undefined;
    btc: {
      request: Function,
      listen: Function
    } | undefined;
  }
}