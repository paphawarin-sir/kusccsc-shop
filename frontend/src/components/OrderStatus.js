import { useRef, useState } from "react";
import "./OrderStatus.css";

const STATUS_MAP = {
  pending_payment: { label: "รอชำระเงิน", color: "#f5a623" },
  slip_rejected: { label: "สลิปไม่ถูกต้อง", color: "#cc3333" },
  pending_verify: { label: "รอตรวจสลิป", color: "#4a90e2" },
  verified: { label: "ชำระเงินแล้ว", color: "#27ae60" },
  preparing: { label: "กำลังเตรียมของ", color: "#8e44ad" },
  ready: { label: "พร้อมรับของ", color: "#16a085" },
  delivered: { label: "ส่งแล้ว / รับแล้ว", color: "#27ae60" },
};

const DELIVERY_LABEL = { pickup: "รับเอง", dorm_in: "หอใน", dorm_out: "หอนอก" };

// สถานะที่ลูกค้าอัปโหลดสลิปใหม่ได้
const CAN_REUPLOAD = ["pending_payment", "pending_verify", "slip_rejected"];

export default function OrderStatus({ onBack, prefillCode }) {
  const [code, setCode] = useState(prefillCode || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // สำหรับอัปโหลดสลิปใหม่
  const [newSlip, setNewSlip] = useState(null);
  const [newSlipPreview, setNewSlipPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef();

  const handleSearch = async () => {
    if (!code.trim() || !phone.trim()) {
      setError("กรุณากรอกรหัสออเดอร์และเบอร์โทร");
      return;
    }
    // OrderStatus.js — บรรทัด validate
    if (!/^KU-\d{8}-[A-Z0-9]{4,6}$/.test(code.trim())) {
      setError("รูปแบบรหัสออเดอร์ไม่ถูกต้อง เช่น KU-20260414-AB1234");
      return;
    }
    if (!/^0\d{8,9}$/.test(phone.trim())) {
      setError("เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    setNewSlip(null);
    setNewSlipPreview(null);
    setUploadMsg("");
    try {
      const res = await fetch(`https://kusccsc-shop-backend.onrender.com/api/orders/check?code=${code.trim()}&phone=${phone.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrder(data);
    } catch {
      setError("ไม่พบออเดอร์ กรุณาตรวจสอบรหัสหรือเบอร์โทร");
    } finally {
      setLoading(false);
    }
  };

  // ✅ จุด 3: ลูกค้าอัปโหลดสลิปใหม่
  const handleReupload = async () => {
    if (!newSlip) { setUploadMsg("กรุณาเลือกไฟล์สลิปก่อน"); return; }
    setUploading(true);
    setUploadMsg("");
    try {
      const fd = new FormData();
      fd.append("slip", newSlip);
      const res = await fetch(`https://kusccsc-shop-backend.onrender.com/api/orders/${order.orderCode}/slip`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // อัปเดต state ทันที ไม่ต้อง search ใหม่
      setOrder((prev) => ({
        ...prev,
        slipUrl: data.slipUrl,
        slipUploadedAt: new Date().toISOString(),
        status: data.status, // "pending_verify"
      }));
      setNewSlip(null);
      setNewSlipPreview(null);
      setUploadMsg("✅ อัปโหลดสลิปใหม่เรียบร้อย รอแอดมินตรวจสอบ");
    } catch (err) {
      setUploadMsg(`❌ ${err.message || "อัปโหลดไม่สำเร็จ"}`);
    } finally {
      setUploading(false);
    }
  };

  const status = order ? STATUS_MAP[order.status] : null;
  const canReupload = order && CAN_REUPLOAD.includes(order.status);

  return (
    <div className="status-page">
      <div className="page-hero">
        <h2>เช็คสถานะออเดอร์</h2>
        <p style={{ textAlign: 'center' }}>เช็คเลขออร์เดอร์ได้ที่ <a href="https://www.facebook.com/share/18uKD1a95b/?mibextid=wwXIfr" target="_blank" rel="noreferrer">เพจสภา</a> 1-2 วันหลังจากสั่งซื้อ</p>
      </div>


      <div className="search-card">
        <div className="form-group">
          <label>รหัสออเดอร์</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="เช่น KU-20260414-AB1234"
          />
        </div>
        <div className="form-group">
          <label>เบอร์โทรที่ใช้สั่ง</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxx"
            type="tel"
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? "กำลังค้นหา..." : "ค้นหาออเดอร์"}
        </button>
      </div>

      {order && (
        <div className="order-result">
          <div
            className="status-badge"
            style={{ background: status.color + "22", borderColor: status.color }}
          >
            <span className="status-label" style={{ color: status.color }}>
              {status.label}
            </span>
          </div>

          <div className="result-card">
            <div className="result-row"><span>รหัสออเดอร์</span><strong>{order.orderCode}</strong></div>
            <div className="result-row"><span>ชื่อ</span><span>{order.customerName}</span></div>
            {order.studentId && (
              <div className="result-row"><span>รหัสนิสิต</span><span>{order.studentId}</span></div>
            )}
            <div className="result-row">
              <span>วิธีรับ</span>
              <span>
                {order.deliveryMethod === "pickup"
                  ? "รับที่ห้องสภาฯ อาคาร 19 ห้อง 19-409"
                  : DELIVERY_LABEL[order.deliveryMethod]}
              </span>
            </div>
            {order.dormName && (
              <div className="result-row">
                <span>หอ / ห้อง</span><span>{order.dormName} ห้อง {order.roomNumber}</span>
              </div>
            )}
            <div className="result-row">
              <span>วันที่สั่ง</span>
              <span>{new Date(order.createdAt).toLocaleString("th-TH")}</span>
            </div>
          </div>

          <div className="result-card">
            <p className="section-title">รายการสินค้า</p>
            {order.items.map((item, i) => (
              <div key={i} className="result-row">
                <span>
                  {item.name} × {item.quantity}
                  {item.selectedColor && (
                    <span style={{ color: "#888", fontSize: 12 }}> ({item.selectedColor})</span>
                  )}
                </span>
                <span>฿{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="result-divider" />
            <div className="result-row">
              <span>ค่าส่ง</span>
              <span>{order.deliveryFee === 0 ? "ฟรี" : `฿${order.deliveryFee}`}</span>
            </div>
            <div className="result-row result-total">
              <span>รวม</span><strong>฿{order.total.toLocaleString()}</strong>
            </div>
          </div>

          {/* ✅ จุด 2: adminNote แสดงเสมอเมื่อมีค่า */}
          {order.adminNote && (
            <div className="result-card">
              <p className="section-title">หมายเหตุจาก Admin</p>
              <p style={{ fontSize: 14, color: "#cc3333", margin: 0 }}>{order.adminNote}</p>
            </div>
          )}

          {/* ✅ จุด 3: ส่วนอัปโหลดสลิปใหม่ (เฉพาะสถานะที่อนุญาต) */}
          {canReupload && (
            <div className="result-card">
              <p className="section-title">
                {order.status === "slip_rejected" ? "⚠️ อัปโหลดสลิปใหม่" : "อัปโหลด / เปลี่ยนสลิป"}
              </p>

              {order.slipUrl && order.status === "slip_rejected" && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>สลิปปัจจุบัน:</p>
                  <img
                    src={order.slipUrl}
                    alt="slip"
                    style={{ width: "100%", maxWidth: 280, borderRadius: 8 }}
                  />
                </div>
              )}

              <label
                style={{
                  display: "block",
                  border: "2px dashed #ccc",
                  borderRadius: 10,
                  padding: "16px",
                  textAlign: "center",
                  cursor: "pointer",
                  marginBottom: 10,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setNewSlip(f);
                    setNewSlipPreview(URL.createObjectURL(f));
                    setUploadMsg("");
                  }}
                />
                {newSlipPreview
                  ? <img src={newSlipPreview} alt="preview" style={{ width: "100%", maxWidth: 280, borderRadius: 8 }} />
                  : <span style={{ color: "#888" }}> แตะเพื่อเลือกรูปสลิปใหม่</span>
                }
              </label>

              {uploadMsg && (
                <p style={{
                  fontSize: 14,
                  color: uploadMsg.startsWith("✅") ? "#27ae60" : "#cc3333",
                  marginBottom: 8,
                }}>
                  {uploadMsg}
                </p>
              )}

              <button
                className="btn-primary"
                onClick={handleReupload}
                disabled={uploading || !newSlip}
              >
                {uploading ? "กำลังอัปโหลด..." : "ส่งสลิปใหม่ →"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}