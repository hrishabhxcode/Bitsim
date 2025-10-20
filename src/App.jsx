import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimProvider } from "./context/SimContext";
import { CustomCoinsProvider } from "./context/CustomCoinsContext";
import { CredentialsProvider } from "./context/CredentialsContext";
import { BlockchainProvider } from "./context/BlockchainContext";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import Navbar from "./components/Navbar";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Dashboard from "./pages/Dashboard";
import CreateCoin from "./pages/CreateCoin";
import Invest from "./pages/Invest";
import Mining from "./pages/Mining";
import Credentials from "./pages/Credentials";
import Blockchain from "./pages/Blockchain";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Simulator from "./pages/Simulator";
import Admin from "./pages/Admin";
import AdminMiners from "./pages/AdminMiners";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import LearnCrypto from "./pages/LearnCrypto";
import Footer from "./components/Footer";
import Tokens from "./pages/Tokens";
import Transactions from "./pages/Transactions";
import Blocks from "./pages/Blocks";
import Verifications from "./pages/Verifications";

function App() {
  return (
    <SimProvider>
      <CredentialsProvider>
        <BlockchainProvider>
          <CustomCoinsProvider>
            <AuthProvider>
            <AdminAuthProvider>
              <BrowserRouter>
                <Navbar />
                <div className="container py-6 grid gap-5">
                  <h1 className="text-center text-3xl sm:text-4xl font-semibold tracking-tight text-slate-100 anim-fade-up">Bitcoin Simulator</h1>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/create" element={<CreateCoin />} />
                    <Route path="/invest" element={<Invest />} />
                    <Route path="/mining" element={<Mining />} />
                    <Route path="/credentials" element={<Credentials />} />
                    <Route path="/blockchain" element={<Blockchain />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/simulator" element={<Simulator />} />
                    <Route path="/tokens" element={<Tokens />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/blocks" element={<Blocks />} />
                    <Route path="/verifications" element={<Verifications />} />
                    <Route path="/learn-crypto" element={<LearnCrypto />} />

                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                    <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
                    <Route path="/admin-miners" element={<ProtectedAdminRoute><AdminMiners /></ProtectedAdminRoute>} />
                  </Routes>
                </div>
                <Footer />
              </BrowserRouter>
            </AdminAuthProvider>
            </AuthProvider>
          </CustomCoinsProvider>
        </BlockchainProvider>
      </CredentialsProvider>
    </SimProvider>
  );
}

export default App;


