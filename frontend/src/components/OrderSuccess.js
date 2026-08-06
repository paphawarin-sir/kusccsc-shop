import "./OrderSuccess.css";


export default function OrderSuccess({ orderCode, onHome, onCheck }) {
  return (
    <div className="success-page">
      <div className="success-icon">✅</div>
      <h2>สั่งซื้อสำเร็จแล้ว!</h2>
      <p className="success-sub">รอตรวจสลิปจากทีมงาน KU.SC.CSC SHOP ครับ/คะ</p>

      <div className="order-code-box">
        <p className="oc-label">รหัสออเดอร์ของคุณ</p>
        <p className="oc-value">{orderCode}</p>
        <p className="oc-hint">เก็บรหัสนี้ไว้สำหรับเช็คสถานะ</p>
      </div>

      <div className="success-actions">
        <button className="btn-primary" onClick={onCheck}>เช็คสถานะออเดอร์</button>
        <button className="btn-secondary" onClick={onHome}>กลับหน้าแรก</button>
      </div>
    </div>
  );
}
