import { useState, useEffect } from "react";
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");
import styles from "../styles/Home.module.css";

export default function Header() {
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState([]);

  useEffect(() => {
    Moralis.start({
      apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
    });

  }, []);

  const fetchTokenBalances = async (address) => {
    const chain = EvmChain.ETHEREUM;
    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      address,
      chain,
    });
    return response.toJSON();
  };

  const handleSubmitSingle = async (event) => {
    event.preventDefault();
    const address = document.querySelector("#singleWalletAddress").value;
    const tokens = await fetchTokenBalances(address);
    setResult(tokens);
    setShowResult(true);
  };

  const handleSubmitMultiple = async (event) => {
    event.preventDefault();
    const addresses = document.querySelector("#multipleWalletAddresses").value.split('\n').filter(addr => addr.length > 0);
    let tokenMap = {};
  
    for (let address of addresses) {
      const tokens = await fetchTokenBalances(address);
      tokens.forEach(token => {
        if (token.verified_contract && !tokenMap[token.token_address]) {
          // Initialize only if token is verified and not already in the map
          tokenMap[token.token_address] = {
            ...token,
            count: 1,
            balance: Number(token.balance),
          };
        } else if (token.verified_contract && tokenMap[token.token_address]) {
          // Update count and balance only for verified contracts
          tokenMap[token.token_address].count += 1;
          tokenMap[token.token_address].balance += Number(token.balance);
        }
      });
    }
  
    // Filter to include only verified tokens held by at least 2 addresses
    const filteredTokens = Object.values(tokenMap).filter(token => token.verified_contract && token.count >= 2).map(token => ({
      ...token,
      percentage: ((token.count / addresses.length) * 100).toFixed(2),
    }));
  
    setResult(filteredTokens);
    setShowResult(true);
  };
  

  return (
    <section className={styles.main}>
      <form className={styles.getTokenForm} onSubmit={handleSubmitSingle}>
        <label className={styles.label} htmlFor="singleWalletAddress">
          Add a Single ERC20 Wallet Address
        </label>
        <input
          className={styles.walletAddress}
          type="text"
          id="singleWalletAddress"
          name="walletAddress"
          maxLength="120"
          required
        />
        <button type="submit" className={styles.form_btn}>Submit Single Address</button>
      </form>

      <form className={styles.getTokenForm} onSubmit={handleSubmitMultiple}>
        <label className={styles.label} htmlFor="multipleWalletAddresses">
          Add Multiple ERC20 Wallet Addresses (one per line)
        </label>
        <textarea
          className={styles.walletAddresses}
          id="multipleWalletAddresses"
          name="walletAddresses"
          rows="5"
          required
        ></textarea>
        <button type="submit" className={styles.form_btn}>Submit Multiple Addresses</button>
      </form>
      {showResult && (
  <section className={styles.result}>
    {result.map((token, index) => (
      <section className={styles.tokenContainer} key={index}>
        <img src={token.thumbnail} alt="" />
        <p className={styles.name}>{token.name}</p>
        <p className={styles.tokenAddress}>Address: {token.token_address}</p> {/* Display token address */}
        <p className={styles.amount}>
          {((token.balance / Math.pow(10, token.decimals)).toFixed(2))} - {token.percentage}% addresses
        </p>
      </section>
    ))}
  </section>
)}
    </section>
  );
}