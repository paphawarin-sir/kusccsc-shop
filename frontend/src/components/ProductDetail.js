import { useState, useRef } from "react";
import { useCart } from "../context/CartContext";
import "./ProductDetail.css";

export default function ProductDetail({ product, onBack, shopOpen }) {
  const { addToCart, cart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [colorError, setColorError] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);

  const inCart = cart.find((i) => i._id === product._id);
  const hasColors = product.colors && product.colors.length > 0;
  const displayPrice = (() => {
    if (!hasColors || !product.colors.some(c => c.price)) return product.price;
    if (selectedColor) {
      const chosen = product.colors.find(c => c.name === selectedColor);
      return chosen?.price || product.price;
    }
    const prices = product.colors.map(c => c.price || product.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? min : `${min.toLocaleString()} – ฿${max.toLocaleString()}`;
  })();
  const allImages = [
    ...(product.image ? [product.image] : []),
    ...(product.images || [])
  ];
  if (allImages.length === 0) allImages.push("/placeholder.png");

  const handleAdd = () => {
    if (hasColors && !selectedColor) {
      setColorError(true);
      setTimeout(() => setColorError(false), 1000);
      return;
    }
    const chosen = product.colors?.find(c => c.name === selectedColor);
    const finalPrice = chosen?.price || product.price;
    for (let i = 0; i < qty; i++) {
      addToCart({ ...product, price: finalPrice, selectedColor: selectedColor || null });
    }
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1200);
  };

  const prev = () => setImgIndex(i => (i === 0 ? allImages.length - 1 : i - 1));
  const next = () => setImgIndex(i => (i === allImages.length - 1 ? 0 : i + 1));

  const onDragStart = (clientX, clientY) => {
    startX.current = clientX;
    startY.current = clientY;
    dragging.current = true;
  };

  const onDragEnd = (clientX, clientY) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = clientX - startX.current;
    const dy = clientY - startY.current;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
  };

  return (
    <div className="detail-page">
      <button className="btn-back-detail" onClick={onBack}>← กลับ</button>

      {/* CAROUSEL */}
      <div
        className="carousel"
        onMouseDown={e => onDragStart(e.clientX, e.clientY)}
        onMouseUp={e => onDragEnd(e.clientX, e.clientY)}
        onMouseLeave={e => { if (dragging.current) onDragEnd(e.clientX, e.clientY); }}
        onTouchStart={e => onDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        style={{ cursor: "grab", userSelect: "none" }}
      >
        <img
          src={allImages[imgIndex]}
          alt={product.name}
          className="carousel-img"
          draggable={false}
        />

        {allImages.length > 1 && (
          <>
            <button
              className="carousel-btn left"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="รูปก่อนหน้า"
            >‹</button>
            <button
              className="carousel-btn right"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="รูปถัดไป"
            >›</button>
            <div className="carousel-dots">
              {allImages.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === imgIndex ? "active" : ""}`}
                  onClick={() => setImgIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* INFO */}
      <div className="detail-info">
        <h2 className="detail-name">{product.name}</h2>
        {product.description && <p className="detail-desc">{product.description}</p>}
        <p className="detail-price">
          ฿{typeof displayPrice === "number" ? displayPrice.toLocaleString() : displayPrice}
        </p>
        {/* COLOR CHIPS */}
        {hasColors && (
          <div className={`detail-color-section ${colorError ? "shake" : ""}`}>
            <p className="detail-color-label">
              {selectedColor
                ? <span className="detail-color-selected">: {selectedColor}</span>
                : <span className="detail-color-hint"> (กรุณาเลือก)</span>
              }
            </p>
            <div className="detail-color-chips">
              {product.colors.map((c, i) => (
                <button
                  key={i}
                  className={`detail-color-chip ${selectedColor === c.name ? "selected" : ""}`}
                  onClick={() => setSelectedColor(c.name)}
                >
                  {c.name}{c.price ? ` — ฿${c.price.toLocaleString()}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        {inCart && (
          <p className="in-cart-note">มีในตะกร้าแล้ว {inCart.quantity} ชิ้น</p>
        )}

        {shopOpen ? (
          <div className="detail-actions">
            <div className="qty-control">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button className={`btn-add-detail ${added ? "added" : ""}`} onClick={handleAdd}>
              {added ? "✓ เพิ่มแล้ว" : "+ ตะกร้า"}
            </button>
          </div>
        ) : (
          <div style={{
            background: "#fff0f0",
            border: "1px solid #ffcccc",
            borderRadius: 10,
            padding: "14px",
            textAlign: "center",
            color: "#cc3333",
            fontWeight: 700,
            marginTop: 16,
          }}>
            ปิดรับออเดอร์แล้ว
          </div>
        )}
      </div>
    </div>
  );
}