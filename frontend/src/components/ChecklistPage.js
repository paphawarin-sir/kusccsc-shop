import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, RotateCcw } from "lucide-react";

const DEFAULT_ITEMS = [
  {
    cat: "เอกสารสำคัญ",
    items: [
      "บัตรประชาชน",
      "สำเนาบัตรประชาชน",
      "สำเนาทะเบียนบ้าน",
      "เอกสารรายงานตัวนิสิต / นักศึกษา",
      "เอกสารเข้าหอพัก (ถ้ามี)",
      "เอกสารกู้ยืม / ทุนการศึกษา (ถ้ามี)",
      "เอกสารสุขภาพ",
    ],
  },
  {
    cat: "ของสำคัญที่ต้องพก",
    items: ["โทรศัพท์", "กระเป๋าสตางค์"],
  },
  {
    cat: "เครื่องนอน",
    items: [
      "ชุดผ้าปูที่นอน 1-2 ชุด",
      "หมอน",
      "หมอนข้าง",
      "ปลอกหมอน / ปลอกหมอนข้าง",
      "ผ้าห่ม",
    ],
  },
  {
    cat: "ของใช้ในห้องน้ำ",
    items: [
      "ผ้าเช็ดตัว",
      "แปรงสีฟัน",
      "ยาสีฟัน",
      "สบู่",
      "แชมพู",
      "ครีมนวด",
      "โฟมล้างหน้า",
      "ทิชชู่ / ทิชชู่เปียก",
      "ไดร์เป่าผม",
    ],
  },
  {
    cat: "เสื้อผ้า / เครื่องแต่งกาย",
    items: [
      "ชุดนิสิต",
      "เครื่องแบบ + กระดุม / เข็มขัด",
      "ชุดไปรเวท",
      "ชุดนอน",
      "ชุดชั้นใน / กางเกงใน",
      "ถุงเท้า",
      "รองเท้าแตะ",
      "รองเท้าผ้าใบ",
      "กระเป๋า",
    ],
  },
  {
    cat: "ของใช้ส่วนตัว",
    items: [
      "สกินแคร์หน้า / ตัว",
      "เครื่องสำอาง",
      "โลชั่น",
      "น้ำหอม",
      "โรลออน",
      "หวี / ยางมัดผม",
      "ที่หนีบผม",
      "ยาสามัญ",
      "ยาประจำตัว (ถ้ามี)",
    ],
  },
  {
    cat: "อุปกรณ์เรียน / อิเล็กทรอนิกส์",
    items: [
      "โน้ตบุ๊ก / แท็บเล็ต / ไอแพด",
      "สายชาร์จ",
      "เมาส์",
      "หูฟัง",
      "แฟลชไดรฟ์",
      "พาวเวอร์แบงก์",
      "สมุด / กระดาษ",
      "คลิปหนีบเอกสาร / แฟ้มใส่เอกสาร",
      "เครื่องเขียน",
      "ปลั๊ก",
    ],
  },
  {
    cat: "ของใช้ในห้อง",
    items: [
      "พัดลม",
      "โคมไฟอ่านหนังสือ",
      "กล่องเก็บของ",
      "ชั้นวางรองเท้า",
      "ร่ม / เสื้อกันฝน",
      "หมวกกันน็อค",
      "ตุ๊กตาเน่า",
    ],
  },
  {
    cat: "อุปกรณ์ทำความสะอาด",
    items: [
      "ไม้กวาด",
      "ที่โกยขยะ",
      "ไม้ถูพื้น",
      "แปรงขัดห้องน้ำ",
      "ถังขยะ / ถุงดำ",
      "พรมเช็ดเท้า",
      "น้ำยาถูพื้น",
      "น้ำยาล้างห้องน้ำ",
      "สเปรย์ดับกลิ่น",
      "ยากันยุง",
    ],
  },
  {
    cat: "อุปกรณ์ซักผ้า",
    items: [
      "น้ำยาซักผ้า",
      "น้ำยาปรับผ้านุ่ม",
      "น้ำยารีดผ้า",
      "กะละมัง",
      "ตะกร้าใส่ผ้า",
      "แปรงขัดเสื้อ",
      "ราวตากผ้า",
      "ไม้หนีบผ้า",
      "ไม้แขวนเสื้อ",
      "โต๊ะรีดผ้า",
      "เตารีด",
    ],
  },
  {
    cat: "อุปกรณ์ครัว / ของกิน",
    items: [
      "แก้วน้ำ",
      "ช้อนส้อม",
      "จาน / ชาม",
      "ที่วางถ้วยจาน",
      "หม้อไฟฟ้า / หม้อหุงข้าวไฟฟ้า",
      "มีด",
      "เขียง",
      "ตะหลิว",
      "ทัพพี",
      "อุปกรณ์ล้างจาน น้ำยาล้างจาน ฟองน้ำ",
      "กล่องข้าว / กล่องถนอมอาหาร",
    ],
  },
  {
    cat: "อุปกรณ์เบ็ดเตล็ด",
    items: ["กรรไกร / คัตเตอร์", "แม่กุญแจ", "เทปกาว / กาว", "กรรไกรตัดเล็บ"],
  },
];

const STORAGE_KEY = "ku_checklist_v2";

function buildDefault() {
  const flat = [];
  DEFAULT_ITEMS.forEach((group) => {
    group.items.forEach((name) => {
      flat.push({
        id: `${group.cat}-${name}`,
        name,
        checked: false,
        cat: group.cat,
      });
    });
  });
  return flat;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return buildDefault();
}

export default function ChecklistPage({ onBack }) {
  const [items, setItems] = useState(() => loadFromStorage());
  const [newText, setNewText] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }, [items]);

  const categories = [...new Set(items.map((i) => i.cat))];
  const total = items.length;
  const done = items.filter((i) => i.checked).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggleItem = (id) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );

  const deleteItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const addItem = () => {
    const text = newText.trim();
    if (!text) return;
    setItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: text,
        checked: false,
        cat: "เพิ่มเอง",
      },
    ]);
    setNewText("");
  };

  const resetChecks = () =>
    setItems((prev) => prev.map((i) => ({ ...i, checked: false })));

  const resetAll = () => {
    if (window.confirm("รีเซ็ตรายการทั้งหมดกลับค่าเริ่มต้น?")) {
      setItems(buildDefault());
    }
  };

  return (
    <div className="checklist-page">
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> กลับหน้าหลัก
      </button>

      <div className="page-hero">
        <h2>สิ่งที่เด็กหอควรมี</h2>
        <p>เช็คสิ่งของที่ต้องเตรียมก่อนเข้าหอพัก</p>
      </div>

      {/* Progress */}
      <div className="progress-wrap">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-text">
          {done} / {total} รายการ ({pct}%)
        </span>
      </div>

      {/* Lists by category */}
      {total === 0 && (
        <p style={{ textAlign: "center", color: "#888", padding: "2rem 0" }}>
          ยังไม่มีรายการ กด + เพิ่มได้เลย
        </p>
      )}
      {categories.map((cat) => (
        <div key={cat} className="checklist-section">
          <div className="cat-label">{cat}</div>
          <div className="checklist-card">
            {items
              .filter((i) => i.cat === cat)
              .map((item) => (
                <div key={item.id} className="checklist-row">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span className={`item-text ${item.checked ? "checked" : ""}`}>
                    {item.name}
                  </span>
                  <button
                    className="del-btn"
                    onClick={() => deleteItem(item.id)}
                    aria-label="ลบ"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Add new */}
      <div className="add-row">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="เพิ่มรายการใหม่..."
        />
        <button onClick={addItem}>
          <Plus size={16} /> เพิ่ม
        </button>
      </div>

      {/* Reset actions */}
      <div className="action-row">
        <button className="action-btn" onClick={resetChecks}>
          <RotateCcw size={14} /> ล้างการเช็ค
        </button>
        <button className="action-btn danger" onClick={resetAll}>
          รีเซ็ตทั้งหมด
        </button>
      </div>
    </div>
  );
}