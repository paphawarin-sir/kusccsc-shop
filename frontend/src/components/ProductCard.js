import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product, onClick, shopOpen }) {
  const { addToCart } = useCart();  // ← ต้องมีบรรทัดนี้
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");

  const hasColors = product.colors && product.colors.length > 0;

  // ล็อก scroll ตอน sheet เปิด
  useEffect(() => {
    if (showSheet) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showSheet]);

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (hasColors) {
      setShowSheet(true); // เปิด sheet ให้เลือกสีก่อน
    } else {
      confirmAdd(); // ไม่มีสี เพิ่มเลย
    }
  };

  // confirmAdd รับ price ด้วย
  const confirmAdd = (color = "", price = null) => {
    const finalPrice = price !== null ? price : product.price;
    addToCart({ ...product, price: finalPrice, selectedColor: color }, qty);
    setAdded(true);
    setShowSheet(false);
    setSelectedColor("");
    setTimeout(() => setAdded(false), 1500);
  };
  return (
    <>
      <div className="product-card" onClick={onClick}>
        <div className="product-img-wrap">
          {product.image
            ? <img src={product.image} alt={product.name} className="product-img" loading="lazy" />
            : <div className="product-img-placeholder" />
          }
        </div>

        <div className="product-info">
          <p className="product-name">{product.name}</p>
          {product.description && (
            <p className="product-desc">{product.description}</p>
          )}

          <div className="product-footer">
            <span className="product-price">
              {hasColors && product.colors.some(c => c.price) ? (() => {
                const prices = product.colors.map(c => c.price || product.price);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                return min === max ? `฿${min.toLocaleString()}` : `฿${min.toLocaleString()} – ฿${max.toLocaleString()}`;
              })() : `฿${product.price.toLocaleString()}`}
            </span>
            {/* เหลือแค่อันนี้อันเดียว */}
            {shopOpen && (
              <div className="add-section" onClick={(e) => e.stopPropagation()}>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={(e) => { e.stopPropagation(); setQty((q) => Math.max(1, q - 1)); }}
                    aria-label="ลด"
                  >−</button>
                  <span className="qty-value">{qty}</span>
                  <button
                    className="qty-btn"
                    onClick={(e) => { e.stopPropagation(); setQty((q) => q + 1); }}
                    aria-label="เพิ่ม"
                  >+</button>
                </div>
                <button
                  className={`btn-add ${added ? "added" : ""}`}
                  onClick={handleAddClick}
                >
                  {added ? "✓ เพิ่มแล้ว" : "+ ตะกร้า"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Sheet ── */}
      {showSheet && (
        <>
          {/* Backdrop */}
          <div
            className="sheet-backdrop"
            onClick={() => setShowSheet(false)}
          />

          {/* Sheet */}
          <div className="color-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Handle bar */}
            <div className="sheet-handle" />

            <div className="sheet-header">
              <span className="sheet-title">กรุณาเลือก</span>
              <button className="sheet-close" onClick={() => setShowSheet(false)}>✕</button>
            </div>

            <div className="sheet-colors">
              {product.colors.map((c, i) => (
                <button
                  key={i}
                  className={`color-chip ${selectedColor === c.name ? "selected" : ""}`}
                  onClick={() => setSelectedColor(c.name)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <button
              className="sheet-confirm"
              disabled={!selectedColor}
              onClick={() => {
                const chosen = product.colors.find(c => c.name === selectedColor);
                confirmAdd(selectedColor, chosen?.price || product.price);
              }}
            >
              {selectedColor ? `เพิ่ม "${selectedColor}" ลงตะกร้า` : "กรุณาเลือก"}
            </button>
          </div>
        </>
      )}
    </>
  );
}