import { useCart } from "../context/CartContext";
import "./Cart.css";
import { ShoppingCart } from "lucide-react";

export default function Cart({ onCheckout, onBack }) {
  const { cart, removeFromCart, updateQty, subtotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <ShoppingCart size={64} className="cart-empty-icon" />
        <p>ตะกร้าว่างเปล่า</p>
        <button className="btn-primary" onClick={onBack}>
          กลับเลือกสินค้า
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}>← กลับ</button>
        <h2>ตะกร้าสินค้า</h2>
        <button className="btn-clear" onClick={clearCart}>ล้างทั้งหมด</button>
      </div>

      <div className="cart-items">
        {cart.map((item) => (
          <div className="cart-item" key={`${item._id}-${item.selectedColor}`}>
            <img
              src={item.image || "/placeholder.png"}
              alt={item.name}
              className="cart-item-img"
            />
            <div className="cart-item-info">
              <p className="cart-item-name">{item.name}</p>
              {item.selectedColor && (
                <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}> {item.selectedColor}</p>
              )}
              <p className="cart-item-price">฿{item.price.toLocaleString()} / ชิ้น</p>
            </div>
            <div className="cart-item-qty">
              <button onClick={() => updateQty(item._id, item.quantity - 1, item.selectedColor)}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQty(item._id, item.quantity + 1, item.selectedColor)}>+</button>
            </div>
            <div className="cart-item-total">
              ฿{(item.price * item.quantity).toLocaleString()}
            </div>
            <button className="cart-item-remove" onClick={() => removeFromCart(item._id, item.selectedColor)}>✕</button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-subtotal">
          <span>รวมสินค้า</span>
          <span>฿{subtotal.toLocaleString()}</span>
        </div>
        <p className="cart-note">ค่าส่งคำนวณในขั้นตอนถัดไป</p>
        <button className="btn-primary btn-checkout" onClick={onCheckout}>
          สั่งซื้อเลย →
        </button>
      </div>
    </div>
  );
}