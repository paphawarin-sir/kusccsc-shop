import { useEffect, useState } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import OrderSuccess from "./components/OrderSuccess";
import OrderStatus from "./components/OrderStatus";
import Admin from "./components/Admin";
import ChecklistPage from "./components/ChecklistPage";   // ← ใหม่
import RecommendPage from "./components/RecommendPage";   // ← ใหม่
import "./App.css";
import { ShoppingCart, ClipboardList, ExternalLink } from "lucide-react";
import ProductDetail from "./components/ProductDetail";

const API = "https://kusccsc-shop-backend.onrender.com/api";

function Shop() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(() => sessionStorage.getItem("page") || "home");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successCode, setSuccessCode] = useState("");
  const [shopOpen, setShopOpen] = useState(true);
  const { totalItems } = useCart();

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });

    const fetchShopOpen = () => {
      if (document.hidden) return;
      fetch(`${API}/settings/shop-open`)
        .then((res) => res.json())
        .then((data) => setShopOpen(data.shopOpen))
        .catch(() => { });
    };

    fetchShopOpen();
    const interval = setInterval(fetchShopOpen, 3000);
    document.addEventListener("visibilitychange", fetchShopOpen);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchShopOpen);
    };
  }, []);

  const navigate = (p) => {
    sessionStorage.setItem("page", p);
    setPage(p);
    setSelectedProduct(null);
  };

  const handleSuccess = (orderCode) => {
    setSuccessCode(orderCode);
    navigate("success");
  };

  if (page === "admin") return <Admin onLogout={() => navigate("home")} onBack={() => navigate("home")} />;

  // ── หน้าเช็คลิสต์ ──
  if (page === "checklist") return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("home")}>
          <span className="nav-title">KU.SC.CSC SHOP</span>
        </div>
      </nav>
      <main className="main">
        <ChecklistPage onBack={() => navigate("home")} />
      </main>
      <footer className="footer">
        <p>KU.SC.CSC SHOP © 2569</p>
      </footer>
    </div>
  );

  // ── หน้าแนะนำสินค้า ──
  if (page === "recommend") return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("home")}>
          <span className="nav-title">KU.SC.CSC SHOP</span>
        </div>
      </nav>
      <main className="main">
        <RecommendPage onBack={() => navigate("home")} />
      </main>
      <footer className="footer">
        <p>KU.SC.CSC SHOP © 2569</p>
      </footer>
    </div>
  );

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("home")}>
          <span className="nav-title">KU.SC.CSC SHOP</span>
        </div>
        <div className="nav-actions">
          <button className="nav-btn" onClick={() => navigate("status")}>
            เช็คออเดอร์
          </button>
          {shopOpen && page !== "cart" && page !== "checkout" && (
            <button className="nav-cart" onClick={() => navigate("cart")}>
              <ShoppingCart size={22} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
          )}
        </div>
      </nav>

      {/* PAGES */}
      <main className="main">
        {page === "home" && (
          <>
            <div className="hero">
              <h1>Pre-order ของใช้เข้าหอ</h1>
              <h2>วันนี้ - 5 มิ.ย. 2569 เริ่มจัดส่ง 10 มิ.ย. 2569 เป็นต้นไป</h2>
              <p>สำหรับนิสิต KU.CSC เท่านั้น </p>

              {/* ─── ปุ่ม 2 หน้าใหม่ ─── */}
              <div className="hero-nav-btns">
                <button
                  className="hero-nav-btn"
                  onClick={() => navigate("checklist")}
                >
                  <ClipboardList size={18} />
                  สิ่งที่เด็กหอควรมี
                </button>
                <button
                  className="hero-nav-btn"
                  onClick={() => navigate("recommend")}
                >
                  <ExternalLink size={18} />
                  ไม่มีขายแต่มีแนะนำ
                </button>
              </div>
            </div>

            {!shopOpen && (
              <div style={{
                background: "#fff0f0",
                border: "1px solid #ffcccc",
                borderRadius: 12,
                padding: "16px 20px",
                textAlign: "center",
                marginBottom: 20,
                color: "#cc3333",
                fontWeight: 700,
                fontSize: 16,
              }}>
                ปิดรับออเดอร์ขอบคุณที่ใช้บริการ ครับ/ค่ะ
              </div>
            )}

            {selectedProduct ? (
              <ProductDetail
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
                shopOpen={shopOpen}
              />
            ) : loading ? (
              <div className="loading">กำลังโหลดสินค้า...</div>
            ) : products.length === 0 ? (
              <div className="empty-products">ยังไม่มีสินค้าในขณะนี้</div>
            ) : (
              <div className="product-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    onClick={() => setSelectedProduct(p)}
                    shopOpen={shopOpen}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {page === "cart" && (
          shopOpen
            ? <Cart onBack={() => navigate("home")} onCheckout={() => navigate("checkout")} />
            : <div style={{ textAlign: "center", padding: 60, color: "#cc3333", fontWeight: 700 }}>
              ปิดรับออเดอร์แล้ว<br />
              <button className="nav-btn" style={{ marginTop: 16 }} onClick={() => navigate("home")}>กลับหน้าหลัก</button>
            </div>
        )}

        {page === "checkout" && (
          shopOpen
            ? <Checkout onBack={() => navigate("cart")} onBackToForm={() => { }} onSuccess={handleSuccess} />
            : <div style={{ textAlign: "center", padding: 60, color: "#cc3333", fontWeight: 700 }}>
              ปิดรับออเดอร์แล้ว<br />
              <button className="nav-btn" style={{ marginTop: 16 }} onClick={() => navigate("home")}>กลับหน้าหลัก</button>
            </div>
        )}

        {page === "success" && (
          <OrderSuccess
            orderCode={successCode}
            onHome={() => navigate("home")}
            onCheck={() => navigate("status")}
          />
        )}

        {page === "status" && (
          <OrderStatus onBack={() => navigate("home")} prefillCode={successCode} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <p>KU.SC.CSC SHOP © 2569 | Pre-order ของใช้เข้าหอ</p>
        <div className="footer-social">
          <a href="https://www.facebook.com/share/1HLCmkFVhh/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
            style={{ color: '#1877F2', marginRight: '16px' }}>Facebook</a>
          <a href="https://www.instagram.com/kusc.csc?igsh=MWRlbzF5N2VlZ2RjeQ==" target="_blank" rel="noopener noreferrer"
            style={{ color: '#E1306C' }}>Instagram</a>
        </div>
        <button className="footer-admin" onClick={() => navigate("admin")}>
          Admin
        </button>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Shop />
    </CartProvider>
  );
}