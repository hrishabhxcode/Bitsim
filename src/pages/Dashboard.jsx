import React from "react";
import PriceTicker from "../components/PriceTicker";
import Wallet from "../components/Wallet";
import TradePanel from "../components/TradePanel";
import History from "../components/History";

export default function Dashboard() {
  return (
    <div className="grid gap-4 sm:gap-5">
      <div className="card shadow-soft anim-fade-up"><PriceTicker /></div>
      <div className="card shadow-soft anim-fade-up"><Wallet /></div>
      <div className="card shadow-soft anim-fade-up"><TradePanel /></div>
      <div className="card shadow-soft anim-fade-up"><History /></div>
    </div>
  );
}
