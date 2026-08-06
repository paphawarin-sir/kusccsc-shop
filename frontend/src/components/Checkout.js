import { useState } from "react";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

const DELIVERY_OPTIONS = [
  { value: "pickup", label: "รับเอง", fee: 0, desc: "ฟรี" },
  { value: "dorm_in", label: "หอใน", fee: 10, desc: "+10 บาท" },
  { value: "dorm_out", label: "หอนอก", fee: 20, desc: "+20 บาท" },
];

export default function Checkout({ onBack, onBackToForm, onSuccess }) {
  const { cart, subtotal, clearCart } = useCart();

  const [step, setStep] = useState("form"); // form | confirm | payment
  // 1. โหลดจาก sessionStorage ตอน init
  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem("checkout_form");
      return saved ? JSON.parse(saved) : {
        studentId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        dormName: "",
        roomNumber: "",
      };
    } catch {
      return {
        studentId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        dormName: "",
        roomNumber: "",
      };
    }
  });

  const [delivery, setDelivery] = useState(() => {
    return sessionStorage.getItem("checkout_delivery") || "pickup";
  });
  const [slip, setSlip] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState("");

  const deliveryFee = DELIVERY_OPTIONS.find((o) => o.value === delivery)?.fee || 0;
  const total = subtotal + deliveryFee;

  // 2. handleChange — บันทึกทุกครั้งที่พิมพ์
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    sessionStorage.setItem("checkout_form", JSON.stringify(updated));
    setError("");
  };

  // เพิ่ม handler สำหรับ delivery
  const handleDelivery = (value) => {
    setDelivery(value);
    sessionStorage.setItem("checkout_delivery", value);
  };
  const handleSlip = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSlip(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!form.studentId || !/^\d{10}$/.test(form.studentId))
      return "กรุณากรอกรหัสนิสิตให้ครบ 10 หลัก";
    if (!form.customerName.trim()) return "กรุณากรอกชื่อ";
    if (!form.customerPhone.trim() || !/^0\d{8,9}$/.test(form.customerPhone))
      return "กรุณากรอกเบอร์โทรให้ถูกต้อง";
    if (!form.customerEmail.trim() || !form.customerEmail.endsWith("@ku.th"))
      return "กรุณากรอกอีเมล @ku.th";
    if ((delivery === "dorm_in" || delivery === "dorm_out") && !form.dormName.trim())
      return "กรุณากรอกชื่อหอพัก";
    if ((delivery === "dorm_in" || delivery === "dorm_out") && !form.roomNumber.trim())
      return "กรุณากรอกเลขห้อง";
    return "";
  };

  const handleConfirmForm = () => {
    const err = validateForm();
    if (err) { setError(err); return; }
    setError("");
    setStep("confirm");
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://kusccsc-shop-backend.onrender.com/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deliveryMethod: delivery,
          items: cart.map((i) => ({
            productId: i._id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image || "",
            selectedColor: i.selectedColor || "",  // ← เพิ่ม
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrderResult(data);
      setStep("payment");
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSlip = async () => {
    if (!slip) { setError("กรุณาเลือกสลิปก่อน"); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("slip", slip);
      const res = await fetch(`https://kusccsc-shop-backend.onrender.com/api/orders/${orderResult.orderCode}/slip`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      clearCart();
      sessionStorage.removeItem("checkout_form");      // ← เพิ่ม
      sessionStorage.removeItem("checkout_delivery");  // ← เพิ่ม
      onSuccess(orderResult.orderCode);
    } catch (err) {
      setError(err.message || "อัพโหลดสลิปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const deliveryLabel =
    DELIVERY_OPTIONS.find((o) => o.value === delivery)?.label;
  // === STEP: FORM ===
  if (step === "form") {
    return (

      <div className="checkout-page">
        <div className="page-header">
          <button className="checkout-btn-back" onClick={onBack}>←</button>
          <h2>กรอกข้อมูล</h2>
        </div>

        <div className="section-card">
          <h3 className="section-title">วิธีรับสินค้า</h3>
          <div className="delivery-options">
            {DELIVERY_OPTIONS.map((opt) => (
              <label key={opt.value} className={`delivery-opt ${delivery === opt.value ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="delivery"
                  value={opt.value}
                  checked={delivery === opt.value}
                  onChange={() => handleDelivery(opt.value)}
                />
                <span className="delivery-label">{opt.label}</span>
                <span className="delivery-fee">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="section-card">
          {delivery === "pickup" && (
            <div style={{
              color: "red",
              fontWeight: "bold",
              textAlign: "center"
            }}>
              รับที่ห้องสภาผู้แทนนิสิตฯ อาคาร 19 ห้อง 19-409
            </div>
          )}
          <h3 className="section-title">ข้อมูลผู้สั่ง</h3>
          <div className="form-group">
            <label>รหัสนิสิต *</label>
            <input
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              placeholder="เช่น 6412345678"
              maxLength={10}   // ✅ จำกัดไม่เกิน 10 ตัว
            />
          </div>
          <div className="form-group">
            <label>ชื่อ-นามสกุล *</label>
            <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="ชื่อจริง นามสกุล" />
          </div>
          <div className="form-group">
            <label>เบอร์โทรศัพท์ *</label>
            <input name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="08xxxxxxxx" type="tel" />
          </div>
          <div className="form-group">
            <label>อีเมล KU *</label>
            <input name="customerEmail" value={form.customerEmail} onChange={handleChange} placeholder="b6xxxxxxx@ku.th" type="email" />
          </div>

          {(delivery === "dorm_in" || delivery === "dorm_out") && (
            <>
              <div className="form-group">
                <label>ชื่อหอพัก *</label>
                {delivery === "dorm_in" ? (
                  <select name="dormName" value={form.dormName} onChange={handleChange}>
                    <option value="">-- เลือกหอพัก --</option>
                    <option value="หอพักอินทนิล (อาคาร 4)">หอพักอินทนิล (อาคาร 4)</option>
                    <option value="หอพักนนทรี (อาคาร 5)">หอพักนนทรี (อาคาร 5)</option>
                    <option value="หอพักตาลฟ้า (อาคาร 18)">หอพักตาลฟ้า (อาคาร 18)</option>
                  </select>
                ) : (
                  <input name="dormName" value={form.dormName} onChange={handleChange} placeholder="เช่น หอสุรินทร์, คาซ่า" />
                )}
              </div>
              <div className="form-group">
                <label>เลขห้อง *</label>
                <input name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="เช่น 305" />
              </div>
            </>
          )}
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" onClick={handleConfirmForm}>ยืนยันข้อมูล →</button>
      </div>
    );
  }

  // === STEP: CONFIRM ===
  if (step === "confirm") {
    return (
      <div className="checkout-page">
        <div className="page-header">
          <button className="checkout-btn-back" onClick={() => setStep("form")}>←</button>
          <h2>ยืนยันคำสั่งซื้อ</h2>
        </div>

        <div className="section-card">
          <h3 className="section-title">รายการสินค้า</h3>
          {cart.map((item) => (
            <div key={item._id} className="confirm-item">
              <span>
                {item.name} × {item.quantity}
                {item.selectedColor && <span style={{ color: "#888", fontSize: 12 }}> ({item.selectedColor})</span>}
              </span>
              <span>฿{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="confirm-divider" />
          <div className="confirm-item">
            <span>ค่าส่ง ({deliveryLabel})</span>
            <span>{deliveryFee === 0 ? "ฟรี" : `฿${deliveryFee}`}</span>
          </div>
          <div className="confirm-item confirm-total">
            <span>รวมทั้งหมด</span>
            <span>฿{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="section-card">
          <h3 className="section-title">ข้อมูลผู้รับ</h3>
          {delivery === "pickup" && (
            <div style={{
              background: "#fff8e1",
              border: "1px solid #f5c842",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 10,
              fontSize: 14,
              color: "#7a5c00",
            }}>
              📍 <strong>สถานที่รับ:</strong> ห้องสภาผู้แทนนิสิตฯ อาคาร 19 ห้อง 19-409
            </div>
          )}
          <div className="info-row"><span>รหัสนิสิต</span><span>{form.studentId}</span></div>
          <div className="info-row"><span>ชื่อ</span><span>{form.customerName}</span></div>
          <div className="info-row"><span>เบอร์</span><span>{form.customerPhone}</span></div>
          <div className="info-row"><span>อีเมล</span><span>{form.customerEmail}</span></div>
          <div className="info-row"><span>วิธีรับ</span><span>{deliveryLabel}</span></div>
          {form.dormName && <div className="info-row"><span>หอ</span><span>{form.dormName} ห้อง {form.roomNumber}</span></div>}
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" onClick={handlePlaceOrder} disabled={loading}>
          {loading ? "กำลังสร้างออเดอร์..." : "ยืนยันและไปชำระเงิน →"}
        </button>
      </div>
    );
  }

  // === STEP: PAYMENT ===
  return (
    <div className="checkout-page">
      <h2 style={{ marginBottom: 4 }}>ชำระเงิน</h2>
      <div className="section-card payment-box">
        <p className="payment-amount">ยอดที่ต้องโอน: <strong>฿{total.toLocaleString()}</strong></p>
        <p className="payment-desc">โอนเงินมาที่บัญชีด้านล่าง แล้วอัพโหลดสลิปยืนยัน</p>
        <div className="bank-info">
          <p>ธนาคาร: <strong>พร้อมเพย์</strong></p>
          <p>เลขบัญชี: <strong>004-66601920-3268</strong></p>
          <p>ชื่อบัญชี: <strong>น.ส. ทานตะวัน สีส่วน</strong></p>
        </div>
      </div>
      <div style={{
        textAlign: "center",
        fontSize: "22px",
        fontWeight: "bold",
        color: "red",
        margin: "16px 0"
      }}>
        รหัสออเดอร์: {orderResult?.orderCode}
      </div>
      <div className="section-card">
        <h3 className="section-title">อัพโหลดสลิป</h3>
        <label className="slip-upload">
          <input type="file" accept="image/*" onChange={handleSlip} hidden />
          {slipPreview
            ? <img src={slipPreview} alt="slip" className="slip-preview" />
            : <div className="slip-placeholder">แตะเพื่อเลือกรูปสลิป</div>
          }
        </label>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <button className="btn-primary" onClick={handleUploadSlip} disabled={loading || !slip}>
        {loading ? "กำลังส่ง..." : "ส่งสลิป และยืนยันการสั่งซื้อ ✓"}
      </button>
    </div>
  );
}
