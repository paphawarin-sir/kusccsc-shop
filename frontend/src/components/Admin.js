import { useCallback, useEffect, useState } from "react";
import "./Admin.css";
import * as XLSX from 'xlsx';

const API = "https://kusccsc-shop-backend.onrender.com/api";

const STATUS_OPTIONS = [
  { value: "pending_payment", label: "รอชำระเงิน" },
  { value: "pending_verify", label: "รอตรวจสลิป" },
  { value: "slip_rejected", label: "สลิปไม่ถูกต้อง" },
  { value: "verified", label: "ชำระเงินแล้ว" },
  { value: "preparing", label: "กำลังเตรียมของ" },
  { value: "ready", label: "พร้อมรับ/ส่ง" },
  { value: "delivered", label: "ส่งแล้ว" },
];

const STATUS_COLORS = {
  pending_payment: "#f5a623",
  pending_verify: "#4a90e2",
  verified: "#27ae60",
  preparing: "#8e44ad",
  ready: "#16a085",
  delivered: "#95a5a6",
};

const DELIVERY_LABEL = { pickup: "รับเอง", dorm_in: "หอใน", dorm_out: "หอนอก" };

export default function Admin({ onLogout, onBack }) {
  const [recForm, setRecForm] = useState({ name: "", url: "", imageUrl: "" });
  const [authed, setAuthed] = useState(() => {
    return localStorage.getItem("admin_authed") === "true";
  });
  const [passInput, setPassInput] = useState("");
  const [userInput, setUserInput] = useState("");
  const [passError, setPassError] = useState(false);
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [shopOpen, setShopOpen] = useState(true);       // ← สถานะร้าน
  const [shopToggling, setShopToggling] = useState(false); // ← loading ขณะกด
  const [pForm, setPForm] = useState({ name: "", price: "", description: "", store: "", colors: [] });
  const [imageFiles, setImageFiles] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pSaving, setPSaving] = useState(false);
  const [newColor, setNewColor] = useState({ name: "", price: "" });
  const [recs, setRecs] = useState([]);
  const [recSaving, setRecSaving] = useState(false);

  const fetchRecs = useCallback(async () => {
    const res = await fetch(`${API}/recs`);
    const data = await res.json();
    setRecs(Array.isArray(data) ? data : []);
  }, []);


  // แทน editingRec state ใหม่ — ใช้แค่ id ที่กำลังแก้
  const [editingId, setEditingId] = useState(null);

  const startEdit = (r) => {
    setRecForm({ name: r.name, url: r.url, imageUrl: r.imageUrl || "" });
    setEditingId(r._id);
    // scroll ขึ้นไปหาฟอร์ม (optional)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRecForm({ name: "", url: "", imageUrl: "" });
  };

  const saveRec = async () => {
    if (!recForm.name.trim() || !recForm.url.trim()) return;
    setRecSaving(true);
    try {
      if (editingId) {
        await fetch(`${API}/recs/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recForm),
        });
        setEditingId(null);
      } else {
        await fetch(`${API}/recs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recForm),
        });
      }
      setRecForm({ name: "", url: "", imageUrl: "" });
      fetchRecs();
    } finally {
      setRecSaving(false);
    }
  };
  const deleteRec = async (id) => {
    if (!window.confirm("ลบลิงค์นี้?")) return;
    await fetch(`${API}/recs/${id}`, { method: "DELETE" });
    fetchRecs();
  };
  const handleLogin = async () => {
    try {
      const res = await fetch(`${API}/orders/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userInput, password: passInput }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("admin_authed", "true");
        setAuthed(true);
        setPassError(false);
      } else {
        setPassError(true);
      }
    } catch {
      setPassError(true);
    }
  };

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`${API}/orders/admin/all?status=${filterStatus}`);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  }, [filterStatus]);

  const fetchProducts = useCallback(async () => {
    const res = await fetch(`${API}/products/admin/all`);
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
  }, []);

  /* โหลดสถานะร้านตอน mount*/
  const fetchShopOpen = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings/shop-open`);
      const data = await res.json();
      setShopOpen(data.shopOpen);
    } catch {
      setShopOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchOrders();
    fetchProducts();
    fetchShopOpen();
    fetchRecs();
  }, [authed, fetchOrders, fetchProducts, fetchShopOpen, fetchRecs]);

  // Toggle เปิด/ปิดร้าน
  const toggleShop = async () => {
    setShopToggling(true);
    try {
      const res = await fetch(`${API}/settings/shop-open`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopOpen: !shopOpen }),
      });
      const data = await res.json();
      if (data.success) setShopOpen(data.shopOpen);
    } catch (err) {
      console.error("Toggle shop error:", err);
    } finally {
      setShopToggling(false);
    }
  };

  const openOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNote(order.adminNote || "");
  };

  const saveOrderStatus = async () => {
    setSaving(true);
    await fetch(`${API}/orders/admin/${selectedOrder._id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, adminNote }),
    });
    setSaving(false);
    setSelectedOrder(null);
    fetchOrders();
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("ลบออเดอร์นี้?")) return;
    await fetch(`${API}/orders/admin/${id}`, { method: "DELETE" });
    fetchOrders();
  };

  const handleProductSave = async () => {
    const hasColorPrice = pForm.colors?.some(c => c.price);
    if (!pForm.name || (!pForm.price && !hasColorPrice)) return;
    setPSaving(true);

    const fd = new FormData();
    fd.append("name", pForm.name);
    fd.append("price", pForm.price || Math.min(...pForm.colors.filter(c => c.price).map(c => Number(c.price))));
    fd.append("description", pForm.description);
    fd.append("store", pForm.store);
    fd.append("colors", JSON.stringify(pForm.colors || []));
    imageFiles.forEach(f => fd.append("images", f));

    const url = editingProduct ? `${API}/products/${editingProduct._id}` : `${API}/products`;
    const method = editingProduct ? "PUT" : "POST";

    await fetch(url, { method, body: fd });

    setPForm({ name: "", price: "", description: "", store: "", colors: [] });
    setImageFiles([]);
    setEditingProduct(null);
    setPSaving(false);
    fetchProducts();
  };

  const editProduct = (p) => {
    setEditingProduct(p);
    setPForm({
      name: p.name,
      price: p.price,
      description: p.description || "",
      store: p.store || "",
      colors: p.colors || [],
    });
    setImageFiles([]);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("ลบสินค้านี้?")) return;
    await fetch(`${API}/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const exportExcel = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${API}/orders/admin/all`),
        fetch(`${API}/products/admin/all`),
      ]);
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();

      const wb = XLSX.utils.book_new();

      const productRows = productsData.map((p) => ({
        "ชื่อสินค้า": p.name,
        "ราคา (บาท)": p.price,
        "คำอธิบาย": p.description || "",
        "ตัวเลือก": (p.colors || []).map((c) =>
          c.price ? `${c.name} (฿${c.price})` : c.name
        ).join(", "),
      }));
      const wsProducts = XLSX.utils.json_to_sheet(productRows);
      wsProducts["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsProducts, "สินค้า");

      const orderRows = [];
      ordersData.forEach((order) => {
        order.items.forEach((item, idx) => {
          orderRows.push({
            "Order ID": idx === 0 ? order.orderCode : "",
            "ชื่อลูกค้า": idx === 0 ? order.customerName : "",
            "เบอร์โทร": idx === 0 ? order.customerPhone : "",
            "วิธีรับ": idx === 0 ? { pickup: "รับเอง", dorm_in: "หอใน", dorm_out: "หอนอก" }[order.deliveryMethod] : "",
            "สินค้า": item.name,
            "ตัวเลือก": item.selectedColor || "",
            "จำนวน": item.quantity,
            "ราคา/ชิ้น": item.price,
            "รวมรายการ": item.price * item.quantity,
            "ค่าส่ง": idx === 0 ? order.deliveryFee : "",
            "รวมทั้งหมด": idx === 0 ? order.total : "",
            "สถานะ": idx === 0 ? order.status : "",
            "วันที่สั่ง": idx === 0 ? new Date(order.createdAt).toLocaleDateString("th-TH") : "",
          });
        });
      });
      const wsOrders = XLSX.utils.json_to_sheet(orderRows);
      wsOrders["!cols"] = [
        { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 10 },
        { wch: 25 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, wsOrders, "ออเดอร์");

      XLSX.writeFile(wb, `KUSCCSC_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert("Export ไม่สำเร็จ: " + err.message);
    }
  };

  // LOGIN SCREEN
  if (!authed) {
    return (
      <div className="admin-login">
        <div className="login-box">
          <button className="btn-back" onClick={onBack}>←</button>
          <h2>Admin Panel</h2>
          <p>KU.SC.CSC SHOP</p>
          <input
            type="text"
            placeholder="ชื่อผู้ใช้"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {passError && <p className="login-error">ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง</p>}
          <button onClick={handleLogin}>เข้าสู่ระบบ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Admin Panel — KU.SC.CSC SHOP</h2>

        {/* ปุ่มเปิด/ปิดร้าน */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: shopOpen ? "#f0faf4" : "#fff0f0",
          border: `1px solid ${shopOpen ? "#1a6b3a" : "#cc3333"}`,
          borderRadius: 10,
          padding: "8px 16px",
          marginBottom: 12,
        }}>
          <span style={{ fontWeight: 700, color: shopOpen ? "#1a6b3a" : "#cc3333", fontSize: 15 }}>
            {shopOpen ? "🟢 รับออเดอร์อยู่" : "🔴 ปิดรับออเดอร์แล้ว"}
          </span>
          <button
            onClick={toggleShop}
            disabled={shopToggling}
            style={{
              background: shopOpen ? "#cc3333" : "#1a6b3a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: shopToggling ? "not-allowed" : "pointer",
              opacity: shopToggling ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {shopToggling ? "กำลังบันทึก..." : shopOpen ? "ปิดรับออเดอร์" : "เปิดรับออเดอร์"}
          </button>
        </div>

        <div className="admin-tabs">
          <button className={tab === "orders" ? "tab active" : "tab"} onClick={() => setTab("orders")}>ออเดอร์</button>
          <button className={tab === "products" ? "tab active" : "tab"} onClick={() => setTab("products")}>สินค้า</button>
          <button className={tab === "recs" ? "tab active" : "tab"} onClick={() => setTab("recs")}>ลิงค์แนะนำ</button>
          <button className="tab" onClick={() => {
            localStorage.removeItem("admin_authed");
            setAuthed(false);
            onLogout();
          }}>ออกจากระบบ</button>
          <button className="tab" onClick={exportExcel}>Export Excel</button>
        </div>
      </div>

      {/* ORDERS TAB */}
      {tab === "orders" && (
        <div>
          <div className="filter-bar">
            <span>กรอง:</span>
            {["all", ...STATUS_OPTIONS.map((s) => s.value)].map((s) => (
              <button
                key={s}
                className={filterStatus === s ? "filter-btn active" : "filter-btn"}
                onClick={() => setFilterStatus(s)}
              >
                {s === "all" ? "ทั้งหมด" : STATUS_OPTIONS.find((o) => o.value === s)?.label}
              </button>
            ))}
          </div>

          {orders.length === 0 && <p className="admin-empty">ยังไม่มีออเดอร์</p>}

          <div className="order-list">
            {orders.map((order) => (
              <div key={order._id} className="order-row" onClick={() => openOrder(order)}>
                <div className="order-row-left">
                  <span className="order-code">{order.orderCode}</span>
                  <span className="order-name">{order.customerName}</span>
                  <span className="order-phone">{order.customerPhone}</span>
                  <span className="order-delivery">{DELIVERY_LABEL[order.deliveryMethod]}</span>
                </div>
                <div className="order-row-right">
                  <span className="order-total">฿{order.total.toLocaleString()}</span>
                  <span className="order-status-badge" style={{ background: STATUS_COLORS[order.status] + "22", color: STATUS_COLORS[order.status] }}>
                    {STATUS_OPTIONS.find((o) => o.value === order.status)?.label}
                  </span>
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); deleteOrder(order._id); }}>🗑</button>
                </div>
              </div>
            ))}
          </div>

          {selectedOrder && (
            <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{selectedOrder.orderCode}</h3>
                  <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
                </div>

                <div className="modal-section">
                  <p><strong>ชื่อ:</strong> {selectedOrder.customerName}</p>
                  <p><strong>รหัสนิสิต:</strong> {selectedOrder.studentId}</p>
                  <p><strong>เบอร์:</strong> {selectedOrder.customerPhone}</p>
                  <p><strong>อีเมล:</strong> {selectedOrder.customerEmail}</p>
                  <p><strong>วิธีรับ:</strong> {DELIVERY_LABEL[selectedOrder.deliveryMethod]}</p>
                  {selectedOrder.dormName && (
                    <p><strong>หอ/ห้อง:</strong> {selectedOrder.dormName} ห้อง {selectedOrder.roomNumber}</p>
                  )}
                </div>

                <div className="modal-section">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="modal-item">
                      <span>
                        {item.name} × {item.quantity}
                        {item.selectedColor && (
                          <span style={{ color: "#888", fontSize: 12 }}> ({item.selectedColor})</span>
                        )}
                      </span>
                      <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="modal-item modal-total">
                    <span>รวม</span>
                    <strong>฿{selectedOrder.total.toLocaleString()}</strong>
                  </div>
                </div>

                {selectedOrder.slipUrl && (
                  <div className="modal-section">
                    <p><strong>สลิป:</strong></p>
                    <img src={selectedOrder.slipUrl} alt="slip" className="modal-slip" />
                  </div>
                )}

                <div className="modal-section">
                  <label><strong>เปลี่ยนสถานะ:</strong></label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <label style={{ marginTop: 10, display: "block" }}><strong>โน้ต admin:</strong></label>
                  <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} placeholder="โน้ตถึงลูกค้า (ถ้ามี)" />
                </div>

                <button className="btn-save" onClick={saveOrderStatus} disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === "products" && (
        <div>
          <div className="product-form-card">
            <h3>{editingProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  placeholder="ชื่อสินค้า *"
                  value={pForm.name}
                  onChange={(e) => setPForm({ ...pForm, name: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  placeholder={pForm.colors?.some(c => c.price) ? "ราคา" : "ราคา *"}
                  type="number"
                  value={pForm.price}
                  onChange={(e) => setPForm({ ...pForm, price: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, opacity: pForm.colors?.some(c => c.price) ? 0.5 : 1 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  placeholder="คำอธิบาย"
                  value={pForm.description}
                  onChange={(e) => setPForm({ ...pForm, description: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  placeholder="ร้าน/แหล่งที่มา"
                  value={pForm.store}
                  onChange={(e) => setPForm({ ...pForm, store: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                />
              </div>

              {/* ตัวเลือก */}
              <div>
                <label style={{ fontSize: 13, color: "#888", marginBottom: 6, display: "block" }}>เพิ่มตัวเลือก</label>
                {pForm.colors && pForm.colors.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {pForm.colors.map((color, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "#f0f0f0", borderRadius: 20, padding: "4px 10px", fontSize: 13
                      }}>
                        {color.name}{color.price ? ` (฿${color.price.toLocaleString()})` : ""}
                        <button onClick={() => setPForm(prev => ({
                          ...prev, colors: prev.colors.filter((_, idx) => idx !== i)
                        }))} style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#999", fontSize: 14, padding: 0, marginLeft: 2
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    placeholder="ชื่อตัวเลือก เช่น เล็ก กลาง ใหญ่"
                    value={newColor.name}
                    onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newColor.name.trim()) {
                        setPForm(prev => ({ ...prev, colors: [...(prev.colors || []), { name: newColor.name.trim(), price: Number(newColor.price) || 0 }] }));
                        setNewColor({ name: "", price: "" });
                      }
                    }}
                    style={{ flex: 2, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                  />
                  <input
                    placeholder="ราคา"
                    type="number"
                    value={newColor.price}
                    onChange={(e) => setNewColor(prev => ({ ...prev, price: e.target.value }))}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                  />
                  <button onClick={() => {
                    if (!newColor.name.trim()) return;
                    setPForm(prev => ({ ...prev, colors: [...(prev.colors || []), { name: newColor.name.trim(), price: Number(newColor.price) || 0 }] }));
                    setNewColor({ name: "", price: "" });
                  }} style={{
                    background: "#333", color: "#fff", border: "none",
                    borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer"
                  }}>+ เพิ่ม</button>
                </div>
              </div>

              {/* อัพโหลดรูป */}
              <div>
                <label className="image-upload-label">
                  📷 {imageFiles.length > 0
                    ? `เลือกแล้ว ${imageFiles.length} รูป`
                    : editingProduct?.image
                      ? `รูปปัจจุบัน: ${editingProduct.image}`
                      : "เลือกรูปสินค้า (ได้สูงสุด 5 รูป)"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const files = [...e.target.files];
                      const oversize = files.filter(f => f.size > 5 * 1024 * 1024);
                      if (oversize.length > 0) {
                        alert(`รูปต่อไปนี้ใหญ่เกิน 5MB:\n${oversize.map(f => f.name).join("\n")}`);
                        return;
                      }
                      setImageFiles(prev => [...prev, ...files]);
                    }}
                  />
                </label>
                {imageFiles.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {imageFiles.map((f, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={URL.createObjectURL(f)} alt={`preview-${i}`}
                          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
                        <button
                          onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                          style={{
                            position: "absolute", top: -6, right: -6,
                            background: "#cc3333", color: "#fff", border: "none",
                            borderRadius: "50%", width: 20, height: 20,
                            fontSize: 12, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={handleProductSave}
                disabled={pSaving}
                style={{ background: "#333", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}
              >
                {pSaving ? "กำลังบันทึก..." : editingProduct ? "อัพเดต" : "+ เพิ่มสินค้า"}
              </button>
              {editingProduct && (
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setPForm({ name: "", price: "", description: "", store: "", colors: [] });
                    setImageFiles([]);
                  }}
                  style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>

          <div className="product-admin-list">
            {products.map((p) => (
              <div key={p._id} className="product-admin-row">
                <img src={p.image || "/placeholder.png"} alt={p.name} className="product-admin-img" />
                <div className="product-admin-info">
                  <p className="product-admin-name">{p.name}</p>
                  <p className="product-admin-price">฿{p.price.toLocaleString()}</p>
                </div>
                <div className="product-admin-actions">
                  <button onClick={() => editProduct(p)}>แก้ไข</button>
                  <button className="btn-del" onClick={() => deleteProduct(p._id)}>ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "recs" && (
        <div>
          {/* ฟอร์มเพิ่ม */}
          <div className="product-form-card">
            <h3>{editingId ? "แก้ไขลิงค์" : "เพิ่มลิงค์แนะนำ"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  placeholder="ชื่อสินค้า *"
                  value={recForm.name}
                  onChange={(e) => setRecForm({ ...recForm, name: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  placeholder="ลิงค์ Shopee / Lazada *"
                  value={recForm.url}
                  onChange={(e) => setRecForm({ ...recForm, url: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  placeholder="ลิงค์รูปสินค้า"
                  value={recForm.imageUrl}
                  onChange={(e) => setRecForm({ ...recForm, imageUrl: e.target.value })}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={saveRec}
                disabled={recSaving}
                style={{ background: "#333", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}
              >
                {recSaving ? "กำลังบันทึก..." : editingId ? "บันทึก" : "+ เพิ่มลิงค์"}
              </button>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>

          {/* รายการ — หน้าตาเหมือนเดิม 100% */}
          <div className="product-admin-list">
            {recs.map((r) => (
              <div key={r._id} className="product-admin-row">
                <div className="product-admin-info" style={{ minWidth: 0, flex: 1 }}>
                  <p className="product-admin-name">{r.name}</p>
                  <p style={{
                    fontSize: 12,
                    color: "#000000",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {r.url}
                  </p>
                </div>
                <div className="product-admin-actions">
                  <button onClick={() => startEdit(r)}>แก้ไข</button>
                  <button className="btn-del" onClick={() => deleteRec(r._id)}>ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}