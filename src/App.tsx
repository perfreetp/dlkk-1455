import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { ToastProvider } from "@/components/common/Toast";
import { useStore } from "@/store";

import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import InventoryDetail from "@/pages/InventoryDetail";
import StockMovement from "@/pages/StockMovement";
import Transfer from "@/pages/Transfer";
import Stocktake from "@/pages/Stocktake";
import Reports from "@/pages/Reports";
import Suppliers from "@/pages/Suppliers";
import OperationLogs from "@/pages/OperationLogs";

function AppShell() {
  const initData = useStore(s => s.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <PageContainer>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/:id" element={<InventoryDetail />} />
            <Route path="/stock-movement" element={<StockMovement />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/stocktake" element={<Stocktake />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/logs" element={<OperationLogs />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PageContainer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </Router>
  );
}
