import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

const API = "https://kusccsc-shop-backend.onrender.com/api";

function detectPlatform(url = "") {
  if (url.includes("shopee")) return "shopee";
  if (url.includes("lazada")) return "lazada";
  return "other";
}

function PlatformBadge({ url }) {
  const p = detectPlatform(url);
  const styles = {
    shopee: { background: "#FFF0E6", color: "#D0401A", label: "Shopee" },
    lazada: { background: "#F3EAFF", color: "#7B2FBE", label: "Lazada" },
    other: { background: "#F0F0F0", color: "#555", label: "ลิงค์" },
  };
  const s = styles[p];
  return (
    <span style={{
      display: "inline-block", fontSize: 11, padding: "2px 10px",
      borderRadius: 20, background: s.background, color: s.color,
      fontWeight: 600, marginTop: 4,
    }}>
      {s.label}
    </span>
  );
}

export default function RecommendPage({ onBack }) {
  const [recs, setRecs] = useState([]);



  useEffect(() => {
    fetch(`${API}/recs`)
      .then((r) => r.json())
      .then((data) => setRecs(Array.isArray(data) ? data : []));
  }, []);


  return (
    <div className="recommend-page">
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> กลับหน้าหลัก
      </button>

      <div className="page-hero">
        <h2>สภาผู้แทนนิสิต องค์การนิสิต</h2>
        <p>วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร</p>
        <p style={{ marginTop: 8 }}>ติดตามพวกเราได้ที่</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
          <a href="https://www.facebook.com/profile.php?id=61558176067489" target="_blank" rel="noopener noreferrer"
            style={{ color: "#1877f2", fontWeight: 700, textDecoration: "none" }}>Facebook</a>
          <a href="https://www.instagram.com/kusc.csc" target="_blank" rel="noopener noreferrer"
            style={{ color: "#e1306c", fontWeight: 700, textDecoration: "none" }}>Instagram</a>
        </div>
      </div>

      {recs.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", padding: "2rem 0" }}>
          ยังไม่มีสินค้าแนะนำจากพี่สภาผู้แทนนิสิต
        </p>
      ) : (
        <div className="rec-list">
          {recs.map((rec) => (
            <div key={rec._id} className="rec-card">
              {rec.imageUrl && (
                <img src={rec.imageUrl} alt={rec.name}
                  style={{
                    width: 70,
                    height: 70,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 8
                  }} />
              )}
              <div className="rec-info">
                <div className="rec-name">{rec.name}</div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rec-link"
                  >
                    <ExternalLink
                      size={12}
                      style={{ marginRight: 4, verticalAlign: "middle" }}
                    />
                    ดูสินค้า
                  </a>

                  <PlatformBadge url={rec.url} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}