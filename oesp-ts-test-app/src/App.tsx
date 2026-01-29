import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import BLEConnection from "@/pages/BLEConnection";
import PackageEncoding from "@/pages/PackageEncoding";
import PackageDecoding from "@/pages/PackageDecoding";
import DataTransfer from "@/pages/DataTransfer";
import SyncConnection from "@/pages/SyncConnection";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connection" element={<BLEConnection />} />
        <Route path="/sync" element={<SyncConnection />} />
        <Route path="/encoding" element={<PackageEncoding />} />
        <Route path="/decoding" element={<PackageDecoding />} />
        <Route path="/transfer" element={<DataTransfer />} />
      </Routes>
    </Router>
  );
}