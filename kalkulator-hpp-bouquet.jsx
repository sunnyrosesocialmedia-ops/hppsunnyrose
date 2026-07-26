import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Flower2, Plus, Minus, Trash2, Save, Search, X, TrendingUp,
  TrendingDown, Package, Leaf, ClipboardList, Tags, Calculator,
  Copy, AlertCircle, CheckCircle2, RotateCcw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Default price list (seeded from supplier price sheet — fully editable)
// ---------------------------------------------------------------------------
const seedItems = (rows, category, unit) =>
  rows.map(([name, price], i) => ({
    id: `${category}-${i}`,
    name,
    category,
    unit,
    price,
  }));

const FLOWERS_STEM = seedItems(
  [
    ["Ambring", 1500], ["Amimajus", 2500], ["Anthurium (red/white/green)", 20000],
    ["Aster", 5500], ["Aster dyed", 11000], ["Baby Rose", 9500],
    ["Calimero", 5500], ["Calla Lily", 7000], ["Callistepus", 9000],
    ["Canpanula (bunga lonceng)", 13000], ["Carnation import / dianthus", 35000],
    ["Carnation spray", 5750], ["Delphinium", 14000], ["Didiscus", 13000],
    ["Garbera lokal", 4500], ["Garbera premium", 8500], ["Gompie", 5500],
    ["Gompie dyed", 8500], ["Hydrangea (biru/hijau)", 9000], ["Kamilem", 3500],
    ["Kenikir", 2500], ["Krisan pom-pom", 5500], ["Krisan standar", 5500],
    ["Lily Cassablanca", 95000], ["Lily lokal", 10000], ["Lysianthus", 19000],
    ["Matahari Holland", 23000], ["Matahari lokal", 8000],
    ["Matricaria / Daisy lokal", 15000], ["Mathiola double", 13000],
    ["Mimosa", 1750], ["Molucella", 9000], ["Mawar Holland", 6250],
    ["Mawar Holland (premium)", 8750], ["Nigella", 13000], ["Orlaya", 11000],
    ["Panicum", 11000], ["Peony", 170000], ["Peony Mum / Zhen Yang", 25000],
    ["Pikok putih", 3000], ["Pikok ungu / biru", 3000], ["Scabiosa", 13000],
    ["Snap Dragon", 9000], ["Sedap Malam", 10000], ["Snowball / Sunnyball", 9000],
    ["Tulip white/pink soft", 42500], ["Tulip (premium)", 67500],
  ],
  "bunga",
  "tangkai"
);

const FLOWERS_IKAT = seedItems(
  [
    ["Baby's Breath / Gypsophila", 24500], ["Caspea kering", 10750],
    ["Eucalyptus", 15000], ["LL / Pakis", 3000], ["Ruskus", 2500],
    ["Smilax", 3500], ["Thlaspi", 7250],
  ],
  "bunga",
  "ikat"
);

const PENDUKUNG = seedItems(
  [
    ["Craft Paper", 3000], ["Craft Paper Koran", 2000], ["Hologram Wrap", 3500],
    ["Kapas", 500], ["Kertas Tisu", 1000], ["Logo + Streples", 1000],
    ["Paperbag", 5000], ["Pita", 500], ["Plastik Kiloan", 500],
    ["Plastik Kiloan Jumbo", 2500], ["Selopen Bening", 1500],
    ["Selopen (Sydney-type)", 5000], ["Solasi", 500],
    ["Spray Bunga (pengawet)", 5000], ["Sterofoam", 2000],
    ["Stik Ucapan", 1500], ["Totebag", 3000], ["Tube", 1500],
    ["Ucapan (kartu)", 500], ["Ucapan Print", 2000],
  ],
  "pendukung",
  "pcs"
);

const PENDUKUNG_KHUSUS = [
  { id: "pendukung-honeycomb", name: "Honeycomb Paper", category: "pendukung", unit: "cm", price: 10000 },
  { id: "pendukung-oasis", name: "Oasis Basah", category: "pendukung", unit: "blok", price: 10000 },
];

const DEFAULT_ITEMS = [...FLOWERS_STEM, ...FLOWERS_IKAT, ...PENDUKUNG, ...PENDUKUNG_KHUSUS];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const rupiah = (n) => {
  const v = Number.isFinite(n) ? n : 0;
  return "Rp" + Math.round(v).toLocaleString("id-ID");
};

const newId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const marginTier = (pct) => {
  if (!Number.isFinite(pct)) return { key: "n-a", label: "—", color: "var(--muted)", bg: "var(--cream)" };
  if (pct >= 45) return { key: "good", label: "Margin Sehat", color: "var(--good)", bg: "var(--good-bg)" };
  if (pct >= 30) return { key: "mid", label: "Perlu Perhatian", color: "var(--mid)", bg: "var(--mid-bg)" };
  return { key: "warn", label: "Berisiko", color: "var(--warn)", bg: "var(--warn-bg)" };
};

const emptyDraft = () => ({
  name: "",
  size: "S",
  items: [],
  packagingExtra: 0,
  laborPct: 10,
  pricingMode: "target", // 'target' | 'known'
  targetMargin: 45,
  sellingPrice: 0,
});

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [tab, setTab] = useState("kalkulator");
  const [priceList, setPriceList] = useState(DEFAULT_ITEMS);
  const [savedBouquets, setSavedBouquets] = useState([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [pickerCategory, setPickerCategory] = useState("bunga");
  const [pickerQuery, setPickerQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [ready, setReady] = useState(false);

  // ---- load persisted state ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list = DEFAULT_ITEMS;
      try {
        const res = await window.storage.get("price-list", false);
        if (res && res.value) list = JSON.parse(res.value);
      } catch {
        try { await window.storage.set("price-list", JSON.stringify(DEFAULT_ITEMS), false); } catch {}
      }
      let bouquets = [];
      try {
        const res = await window.storage.get("bouquets", false);
        if (res && res.value) bouquets = JSON.parse(res.value);
      } catch {}
      if (!cancelled) {
        setPriceList(list);
        setSavedBouquets(bouquets);
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const showToast = useCallback((msg, kind = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const persistPriceList = useCallback(async (list) => {
    setPriceList(list);
    try { await window.storage.set("price-list", JSON.stringify(list), false); }
    catch { showToast("Gagal menyimpan daftar harga.", "warn"); }
  }, [showToast]);

  const persistBouquets = useCallback(async (list) => {
    setSavedBouquets(list);
    try { await window.storage.set("bouquets", JSON.stringify(list), false); }
    catch { showToast("Gagal menyimpan resep.", "warn"); }
  }, [showToast]);

  // ---- calculator derived values ----
  const subtotalBahan = useMemo(
    () => draft.items.reduce((sum, it) => sum + it.qty * it.price, 0),
    [draft.items]
  );
  const laborCost = useMemo(
    () => subtotalBahan * (Number(draft.laborPct) || 0) / 100,
    [subtotalBahan, draft.laborPct]
  );
  const totalHPP = subtotalBahan + (Number(draft.packagingExtra) || 0) + laborCost;

  const suggestedPrice = useMemo(() => {
    const m = Number(draft.targetMargin);
    if (!Number.isFinite(m) || m >= 100 || totalHPP <= 0) return 0;
    return Math.ceil((totalHPP / (1 - m / 100)) / 500) * 500;
  }, [totalHPP, draft.targetMargin]);

  const effectiveSellingPrice = draft.pricingMode === "target"
    ? suggestedPrice
    : (Number(draft.sellingPrice) || 0);

  const marginRp = effectiveSellingPrice - totalHPP;
  const marginPct = effectiveSellingPrice > 0 ? (marginRp / effectiveSellingPrice) * 100 : NaN;
  const tier = marginTier(marginPct);

  // ---- recipe item ops ----
  const addItemToRecipe = (priceItem) => {
    setDraft((d) => {
      const existing = d.items.find((it) => it.refId === priceItem.id);
      if (existing) {
        return { ...d, items: d.items.map((it) => it.refId === priceItem.id ? { ...it, qty: it.qty + 1 } : it) };
      }
      return {
        ...d,
        items: [...d.items, {
          id: newId(), refId: priceItem.id, name: priceItem.name,
          unit: priceItem.unit, price: priceItem.price, qty: 1,
        }],
      };
    });
  };

  const updateRecipeItem = (id, patch) => {
    setDraft((d) => ({ ...d, items: d.items.map((it) => it.id === id ? { ...it, ...patch } : it) }));
  };

  const removeRecipeItem = (id) => {
    setDraft((d) => ({ ...d, items: d.items.filter((it) => it.id !== id) }));
  };

  const addCustomItem = (name, unit, price, qty) => {
    if (!name.trim() || price <= 0 || qty <= 0) return;
    setDraft((d) => ({
      ...d,
      items: [...d.items, { id: newId(), refId: null, name: name.trim(), unit, price, qty }],
    }));
  };

  const resetDraft = () => setDraft(emptyDraft());

  const saveBouquet = () => {
    if (!draft.name.trim()) { showToast("Beri nama resep dulu ya.", "warn"); return; }
    if (draft.items.length === 0) { showToast("Tambahkan minimal 1 bahan.", "warn"); return; }
    const record = {
      id: newId(),
      name: draft.name.trim(),
      size: draft.size,
      items: draft.items,
      packagingExtra: Number(draft.packagingExtra) || 0,
      laborPct: Number(draft.laborPct) || 0,
      totalHPP,
      sellingPrice: effectiveSellingPrice,
      marginRp,
      marginPct,
      createdAt: new Date().toISOString(),
    };
    persistBouquets([record, ...savedBouquets]);
    showToast(`Resep "${record.name}" tersimpan.`, "ok");
  };

  const deleteBouquet = (id) => {
    persistBouquets(savedBouquets.filter((b) => b.id !== id));
  };

  const duplicateIntoCalculator = (b) => {
    setDraft({
      name: b.name + " (salinan)",
      size: b.size,
      items: b.items.map((it) => ({ ...it, id: newId() })),
      packagingExtra: b.packagingExtra,
      laborPct: b.laborPct,
      pricingMode: "known",
      targetMargin: 45,
      sellingPrice: b.sellingPrice,
    });
    setTab("kalkulator");
    showToast("Resep dimuat ke kalkulator.", "ok");
  };

  // ---- price list ops ----
  const updatePriceItem = (id, price) => {
    persistPriceList(priceList.map((p) => p.id === id ? { ...p, price } : p));
  };
  const deletePriceItem = (id) => {
    persistPriceList(priceList.filter((p) => p.id !== id));
  };
  const addPriceItem = (name, category, unit, price) => {
    if (!name.trim() || price <= 0) return;
    persistPriceList([...priceList, { id: newId(), name: name.trim(), category, unit, price }]);
  };

  // ---- filtered picker list ----
  const filteredPicker = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return priceList
      .filter((p) => p.category === pickerCategory)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [priceList, pickerCategory, pickerQuery]);

  const avgMargin = savedBouquets.length
    ? savedBouquets.reduce((s, b) => s + (Number.isFinite(b.marginPct) ? b.marginPct : 0), 0) / savedBouquets.length
    : 0;

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

        :root {
          --berry: #6D2E46;
          --berry-dark: #4E2033;
          --rose: #A26769;
          --cream: #F3ECE1;
          --cream-deep: #E7DCC9;
          --ink: #2B1B22;
          --muted: #8B7A80;
          --line: #E7DCCE;
          --good: #3F7857;
          --good-bg: #E9F2EC;
          --mid: #A8752B;
          --mid-bg: #FBF1DF;
          --warn: #B24B3D;
          --warn-bg: #FBECE8;
          --white: #FFFFFF;
        }

        .app-root * { box-sizing: border-box; }
        .app-root {
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--ink);
          background: var(--white);
          min-height: 100vh;
          padding: 0;
        }
        .header {
          position: relative;
          overflow: hidden;
          background: var(--berry);
          padding: 28px 28px 22px;
          color: var(--white);
        }
        .header::before, .header::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .header::before { width: 220px; height: 220px; top: -110px; right: -40px; }
        .header::after { width: 140px; height: 140px; bottom: -90px; right: 140px; background: rgba(255,255,255,0.05); }
        .header-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; max-width: 1180px; margin: 0 auto; }
        .header-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(255,255,255,0.14);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .header-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; line-height: 1.15; }
        .header-sub { font-size: 12.5px; color: rgba(255,255,255,0.75); margin-top: 2px; }

        .tabs {
          display: flex; gap: 4px; max-width: 1180px; margin: 16px auto 0; padding: 0 28px;
          position: relative; z-index: 1; overflow-x: auto;
        }
        .tab-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 10px 10px 0 0;
          font-size: 13.5px; font-weight: 600; white-space: nowrap;
          background: transparent; border: none; cursor: pointer;
          color: rgba(255,255,255,0.68);
          transition: background 0.15s, color 0.15s;
        }
        .tab-btn:hover { color: var(--white); background: rgba(255,255,255,0.08); }
        .tab-btn.active { background: var(--white); color: var(--berry); }

        .main { max-width: 1180px; margin: 0 auto; padding: 24px 28px 60px; }

        .layout { display: grid; grid-template-columns: 1fr 360px; gap: 20px; align-items: start; }
        @media (max-width: 880px) { .layout { grid-template-columns: 1fr; } }

        .card {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 18px;
        }
        .card + .card { margin-top: 16px; }
        .card-title {
          font-family: 'Fraunces', serif; font-weight: 600; font-size: 15.5px;
          color: var(--berry); margin: 0 0 14px; display: flex; align-items: center; gap: 8px;
        }

        .field-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
        .field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 120px; }
        .field label { font-size: 11.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }

        .input, .select {
          font-family: 'Inter', sans-serif;
          border: 1px solid var(--line);
          border-radius: 9px;
          padding: 8px 10px;
          font-size: 13.5px;
          color: var(--ink);
          background: var(--white);
          width: 100%;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus, .select:focus { border-color: var(--rose); }

        .btn {
          display: inline-flex; align-items: center; gap: 6px; justify-content: center;
          border-radius: 9px; border: 1px solid transparent;
          font-size: 13px; font-weight: 600; padding: 9px 14px;
          cursor: pointer; transition: opacity 0.15s, background 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .btn:active { transform: translateY(1px); }
        .btn-primary { background: var(--berry); color: var(--white); }
        .btn-primary:hover { background: var(--berry-dark); }
        .btn-ghost { background: var(--cream); color: var(--berry); }
        .btn-ghost:hover { background: var(--cream-deep); }
        .btn-danger-ghost { background: var(--warn-bg); color: var(--warn); }
        .btn-danger-ghost:hover { opacity: 0.8; }
        .btn-sm { padding: 6px 10px; font-size: 12px; }
        .btn-icon { padding: 7px; }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .picker-tabs { display: flex; gap: 6px; margin-bottom: 10px; }
        .picker-tab {
          flex: 1; padding: 8px 10px; border-radius: 9px; border: 1px solid var(--line);
          background: var(--white); font-size: 12.5px; font-weight: 600; color: var(--muted);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .picker-tab.active { background: var(--cream); color: var(--berry); border-color: var(--rose); }

        .search-box { position: relative; margin-bottom: 10px; }
        .search-box svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--muted); }
        .search-box input { padding-left: 32px; }

        .item-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 8px; max-height: 260px; overflow-y: auto; padding-right: 2px;
        }
        .item-chip {
          border: 1px solid var(--line); border-radius: 10px; padding: 9px 10px;
          background: var(--white); cursor: pointer; text-align: left;
          transition: border-color 0.12s, background 0.12s;
        }
        .item-chip:hover { border-color: var(--rose); background: var(--cream); }
        .item-chip-name { font-size: 12.5px; font-weight: 600; color: var(--ink); line-height: 1.25; }
        .item-chip-price { font-size: 11.5px; color: var(--muted); margin-top: 3px; }

        table.recipe { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.recipe th {
          text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;
          color: var(--muted); font-weight: 600; padding: 6px 8px; border-bottom: 1px solid var(--line);
        }
        table.recipe td { padding: 7px 8px; border-bottom: 1px solid var(--line); vertical-align: middle; }
        table.recipe input.qty-input { width: 62px; padding: 5px 6px; }
        .empty-state {
          padding: 26px 14px; text-align: center; color: var(--muted); font-size: 13px;
        }

        .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13.5px; }
        .summary-row.total { border-top: 1px solid var(--line); margin-top: 6px; padding-top: 10px; font-weight: 700; font-size: 14.5px; }
        .summary-label { color: var(--muted); }

        .mode-switch { display: flex; background: var(--cream); border-radius: 9px; padding: 3px; margin-bottom: 12px; }
        .mode-switch button {
          flex: 1; border: none; background: transparent; padding: 7px 8px; border-radius: 7px;
          font-size: 12px; font-weight: 600; color: var(--muted); cursor: pointer;
        }
        .mode-switch button.active { background: var(--white); color: var(--berry); box-shadow: 0 1px 2px rgba(0,0,0,0.06); }

        .result-card { border-radius: 12px; padding: 16px; margin-top: 4px; }
        .result-pct { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 700; line-height: 1; }
        .result-label { font-size: 12px; font-weight: 600; margin-top: 4px; }
        .result-sub { font-size: 12px; color: var(--muted); margin-top: 8px; }

        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .stat-card { background: var(--cream); border-radius: 12px; padding: 14px; }
        .stat-num { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: var(--berry); }
        .stat-label { font-size: 11px; color: var(--muted); margin-top: 3px; }

        table.data { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.data th {
          text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;
          color: var(--white); background: var(--berry); font-weight: 600; padding: 9px 10px;
        }
        table.data th:first-child { border-radius: 8px 0 0 8px; }
        table.data th:last-child { border-radius: 0 8px 8px 0; }
        table.data td { padding: 9px 10px; border-bottom: 1px solid var(--line); }
        table.data tr:hover td { background: var(--cream); }

        .badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; }

        .toast {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: var(--ink); color: var(--white); padding: 10px 18px; border-radius: 10px;
          font-size: 13px; display: flex; align-items: center; gap: 8px; z-index: 50;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .toast.warn { background: var(--warn); }

        .form-inline { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end; }
        .form-inline .field { min-width: 100px; }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; }
      `}</style>

      {/* HEADER */}
      <div className="header">
        <div className="header-inner">
          <div className="header-icon"><Flower2 size={22} /></div>
          <div>
            <div className="header-title">Kalkulator HPP Bouquet</div>
            <div className="header-sub">Hitung HPP, tetapkan margin, dan kelola resep bouquet kamu</div>
          </div>
        </div>
        <div className="tabs">
          <button className={`tab-btn ${tab === "kalkulator" ? "active" : ""}`} onClick={() => setTab("kalkulator")}>
            <Calculator size={15} /> Kalkulator
          </button>
          <button className={`tab-btn ${tab === "tersimpan" ? "active" : ""}`} onClick={() => setTab("tersimpan")}>
            <ClipboardList size={15} /> Resep Tersimpan {savedBouquets.length > 0 && `(${savedBouquets.length})`}
          </button>
          <button className={`tab-btn ${tab === "harga" ? "active" : ""}`} onClick={() => setTab("harga")}>
            <Tags size={15} /> Daftar Harga
          </button>
        </div>
      </div>

      <div className="main">
        {tab === "kalkulator" && (
          <KalkulatorTab
            draft={draft} setDraft={setDraft}
            pickerCategory={pickerCategory} setPickerCategory={setPickerCategory}
            pickerQuery={pickerQuery} setPickerQuery={setPickerQuery}
            filteredPicker={filteredPicker}
            addItemToRecipe={addItemToRecipe}
            updateRecipeItem={updateRecipeItem}
            removeRecipeItem={removeRecipeItem}
            addCustomItem={addCustomItem}
            subtotalBahan={subtotalBahan}
            laborCost={laborCost}
            totalHPP={totalHPP}
            suggestedPrice={suggestedPrice}
            effectiveSellingPrice={effectiveSellingPrice}
            marginRp={marginRp}
            marginPct={marginPct}
            tier={tier}
            saveBouquet={saveBouquet}
            resetDraft={resetDraft}
          />
        )}

        {tab === "tersimpan" && (
          <TersimpanTab
            savedBouquets={savedBouquets}
            avgMargin={avgMargin}
            deleteBouquet={deleteBouquet}
            duplicateIntoCalculator={duplicateIntoCalculator}
          />
        )}

        {tab === "harga" && (
          <HargaTab
            priceList={priceList}
            updatePriceItem={updatePriceItem}
            deletePriceItem={deletePriceItem}
            addPriceItem={addPriceItem}
          />
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.kind === "warn" ? "warn" : ""}`}>
          {toast.kind === "warn" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kalkulator Tab
// ---------------------------------------------------------------------------
function KalkulatorTab({
  draft, setDraft, pickerCategory, setPickerCategory, pickerQuery, setPickerQuery,
  filteredPicker, addItemToRecipe, updateRecipeItem, removeRecipeItem, addCustomItem,
  subtotalBahan, laborCost, totalHPP, suggestedPrice, effectiveSellingPrice,
  marginRp, marginPct, tier, saveBouquet, resetDraft,
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cUnit, setCUnit] = useState("pcs");
  const [cPrice, setCPrice] = useState("");
  const [cQty, setCQty] = useState("1");

  const handleAddCustom = () => {
    addCustomItem(cName, cUnit, Number(cPrice) || 0, Number(cQty) || 0);
    setCName(""); setCPrice(""); setCQty("1"); setCustomOpen(false);
  };

  return (
    <div className="layout">
      {/* LEFT: recipe builder */}
      <div>
        <div className="card">
          <div className="card-title"><Flower2 size={16} /> Detail Resep</div>
          <div className="field-row">
            <div className="field" style={{ flex: 2 }}>
              <label>Nama Bouquet</label>
              <input className="input" placeholder="mis. Hydrangea Asymetrical"
                value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Size</label>
              <select className="select" value={draft.size}
                onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}>
                <option>S</option><option>M</option><option>L</option><option>XL</option><option>Custom</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Leaf size={16} /> Pilih Bahan</div>
          <div className="picker-tabs">
            <button className={`picker-tab ${pickerCategory === "bunga" ? "active" : ""}`} onClick={() => setPickerCategory("bunga")}>
              <Leaf size={13} /> Bunga & Daun
            </button>
            <button className={`picker-tab ${pickerCategory === "pendukung" ? "active" : ""}`} onClick={() => setPickerCategory("pendukung")}>
              <Package size={13} /> Bahan Pendukung
            </button>
          </div>
          <div className="search-box">
            <Search size={14} />
            <input className="input" placeholder="Cari bahan..." value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} />
          </div>
          <div className="item-grid">
            {filteredPicker.map((p) => (
              <button key={p.id} className="item-chip" onClick={() => addItemToRecipe(p)}>
                <div className="item-chip-name">{p.name}</div>
                <div className="item-chip-price">{rupiah(p.price)} / {p.unit}</div>
              </button>
            ))}
            {filteredPicker.length === 0 && (
              <div className="empty-state" style={{ gridColumn: "1 / -1" }}>Tidak ada bahan yang cocok.</div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            {!customOpen ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setCustomOpen(true)}>
                <Plus size={14} /> Bahan custom (di luar daftar)
              </button>
            ) : (
              <div className="form-inline card" style={{ background: "var(--cream)", border: "none" }}>
                <div className="field">
                  <label>Nama</label>
                  <input className="input" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="mis. Pita satin gold" />
                </div>
                <div className="field" style={{ maxWidth: 90 }}>
                  <label>Satuan</label>
                  <input className="input" value={cUnit} onChange={(e) => setCUnit(e.target.value)} />
                </div>
                <div className="field" style={{ maxWidth: 110 }}>
                  <label>Harga (Rp)</label>
                  <input className="input" type="number" value={cPrice} onChange={(e) => setCPrice(e.target.value)} />
                </div>
                <div className="field" style={{ maxWidth: 80 }}>
                  <label>Qty</label>
                  <input className="input" type="number" value={cQty} onChange={(e) => setCQty(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleAddCustom}>Tambah</button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCustomOpen(false)}><X size={14} /></button>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><ClipboardList size={16} /> Komposisi Resep</div>
          {draft.items.length === 0 ? (
            <div className="empty-state">Belum ada bahan. Klik bahan di atas untuk menambahkan.</div>
          ) : (
            <table className="recipe">
              <thead>
                <tr><th>Bahan</th><th>Qty</th><th>Harga Satuan</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {draft.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.name}<div style={{ fontSize: 11, color: "var(--muted)" }}>{it.unit}</div></td>
                    <td>
                      <input className="input qty-input" type="number" step="0.1" min="0" value={it.qty}
                        onChange={(e) => updateRecipeItem(it.id, { qty: Number(e.target.value) || 0 })} />
                    </td>
                    <td>
                      <input className="input qty-input" style={{ width: 88 }} type="number" step="100" min="0" value={it.price}
                        onChange={(e) => updateRecipeItem(it.id, { price: Number(e.target.value) || 0 })} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{rupiah(it.qty * it.price)}</td>
                    <td>
                      <button className="btn btn-danger-ghost btn-icon btn-sm" onClick={() => removeRecipeItem(it.id)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT: cost summary */}
      <div style={{ position: "sticky", top: 16 }}>
        <div className="card">
          <div className="card-title"><Calculator size={16} /> Ringkasan Biaya</div>

          <div className="field-row">
            <div className="field">
              <label>Biaya Tambahan Lain (Rp)</label>
              <input className="input" type="number" step="1000" min="0" value={draft.packagingExtra}
                onChange={(e) => setDraft((d) => ({ ...d, packagingExtra: e.target.value }))}
                placeholder="mis. transport, listrik" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Tenaga Kerja / Overhead (%)</label>
              <input className="input" type="number" step="1" min="0" max="100" value={draft.laborPct}
                onChange={(e) => setDraft((d) => ({ ...d, laborPct: e.target.value }))} />
            </div>
          </div>

          <div className="summary-row"><span className="summary-label">Subtotal Bahan</span><span>{rupiah(subtotalBahan)}</span></div>
          <div className="summary-row"><span className="summary-label">Biaya Tambahan</span><span>{rupiah(Number(draft.packagingExtra) || 0)}</span></div>
          <div className="summary-row"><span className="summary-label">Tenaga Kerja / Overhead</span><span>{rupiah(laborCost)}</span></div>
          <div className="summary-row total"><span>Total HPP</span><span>{rupiah(totalHPP)}</span></div>
        </div>

        <div className="card">
          <div className="card-title"><TrendingUp size={16} /> Harga Jual & Margin</div>
          <div className="mode-switch">
            <button className={draft.pricingMode === "target" ? "active" : ""} onClick={() => setDraft((d) => ({ ...d, pricingMode: "target" }))}>
              Target Margin
            </button>
            <button className={draft.pricingMode === "known" ? "active" : ""} onClick={() => setDraft((d) => ({ ...d, pricingMode: "known" }))}>
              Harga Jual Manual
            </button>
          </div>

          {draft.pricingMode === "target" ? (
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Target Margin Kotor (%)</label>
              <input className="input" type="number" step="1" min="0" max="95" value={draft.targetMargin}
                onChange={(e) => setDraft((d) => ({ ...d, targetMargin: e.target.value }))} />
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Saran harga jual: <strong style={{ color: "var(--berry)" }}>{rupiah(suggestedPrice)}</strong>
              </div>
            </div>
          ) : (
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Harga Jual (Rp)</label>
              <input className="input" type="number" step="500" min="0" value={draft.sellingPrice}
                onChange={(e) => setDraft((d) => ({ ...d, sellingPrice: e.target.value }))} />
            </div>
          )}

          <div className="result-card" style={{ background: tier.bg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div className="result-pct" style={{ color: tier.color }}>
                  {Number.isFinite(marginPct) ? `${marginPct.toFixed(0)}%` : "—"}
                </div>
                <div className="result-label" style={{ color: tier.color }}>{tier.label}</div>
              </div>
              {Number.isFinite(marginPct) && (marginPct >= 45 ? <TrendingUp size={26} color={tier.color} /> : <TrendingDown size={26} color={tier.color} />)}
            </div>
            <div className="result-sub">
              Margin: <strong>{rupiah(marginRp)}</strong> dari harga jual {rupiah(effectiveSellingPrice)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveBouquet}>
              <Save size={14} /> Simpan Resep
            </button>
            <button className="btn btn-ghost btn-icon" onClick={resetDraft} title="Mulai resep baru">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tersimpan Tab
// ---------------------------------------------------------------------------
function TersimpanTab({ savedBouquets, avgMargin, deleteBouquet, duplicateIntoCalculator }) {
  if (savedBouquets.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <ClipboardList size={28} style={{ marginBottom: 8, color: "var(--muted)" }} />
          <div>Belum ada resep tersimpan. Buat resep di tab Kalkulator lalu klik "Simpan Resep".</div>
        </div>
      </div>
    );
  }

  const best = savedBouquets.reduce((a, b) => (b.marginPct > a.marginPct ? b : a));
  const worst = savedBouquets.reduce((a, b) => (b.marginPct < a.marginPct ? b : a));

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{savedBouquets.length}</div>
          <div className="stat-label">Resep tersimpan</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{avgMargin.toFixed(0)}%</div>
          <div className="stat-label">Rata-rata margin</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ fontSize: 16, lineHeight: 1.3 }}>
            {best.name} <span style={{ color: "var(--good)" }}>({best.marginPct.toFixed(0)}%)</span>
          </div>
          <div className="stat-label">Margin tertinggi</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><ClipboardList size={16} /> Semua Resep</div>
        <div style={{ overflowX: "auto" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Nama</th><th>Size</th><th>HPP</th><th>Harga Jual</th><th>Margin</th><th>%</th><th></th>
              </tr>
            </thead>
            <tbody>
              {savedBouquets.map((b) => {
                const t = marginTier(b.marginPct);
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td>{b.size}</td>
                    <td>{rupiah(b.totalHPP)}</td>
                    <td>{rupiah(b.sellingPrice)}</td>
                    <td>{rupiah(b.marginRp)}</td>
                    <td><span className="badge" style={{ color: t.color, background: t.bg }}>{b.marginPct.toFixed(0)}%</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Duplikat ke kalkulator" onClick={() => duplicateIntoCalculator(b)}>
                          <Copy size={13} />
                        </button>
                        <button className="btn btn-danger-ghost btn-sm btn-icon" title="Hapus" onClick={() => deleteBouquet(b.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Harga (price list) Tab
// ---------------------------------------------------------------------------
function HargaTab({ priceList, updatePriceItem, deletePriceItem, addPriceItem }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [fName, setFName] = useState("");
  const [fCat, setFCat] = useState("bunga");
  const [fUnit, setFUnit] = useState("tangkai");
  const [fPrice, setFPrice] = useState("");

  const filtered = priceList
    .filter((p) => cat === "semua" || p.category === cat)
    .filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAdd = () => {
    addPriceItem(fName, fCat, fUnit, Number(fPrice) || 0);
    setFName(""); setFPrice(""); setFormOpen(false);
  };

  return (
    <div className="card">
      <div className="card-title"><Tags size={16} /> Daftar Harga Bahan</div>
      <div className="field-row">
        <div className="search-box field" style={{ flex: 2, marginBottom: 0 }}>
          <Search size={14} />
          <input className="input" placeholder="Cari bahan..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="semua">Semua Kategori</option>
            <option value="bunga">Bunga & Daun</option>
            <option value="pendukung">Bahan Pendukung</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setFormOpen((v) => !v)}>
          <Plus size={14} /> Bahan Baru
        </button>
      </div>

      {formOpen && (
        <div className="form-inline card" style={{ background: "var(--cream)", border: "none", marginBottom: 14 }}>
          <div className="field" style={{ flex: 2 }}>
            <label>Nama Bahan</label>
            <input className="input" value={fName} onChange={(e) => setFName(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 150 }}>
            <label>Kategori</label>
            <select className="select" value={fCat} onChange={(e) => setFCat(e.target.value)}>
              <option value="bunga">Bunga & Daun</option>
              <option value="pendukung">Bahan Pendukung</option>
            </select>
          </div>
          <div className="field" style={{ maxWidth: 100 }}>
            <label>Satuan</label>
            <input className="input" value={fUnit} onChange={(e) => setFUnit(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 120 }}>
            <label>Harga (Rp)</label>
            <input className="input" type="number" value={fPrice} onChange={(e) => setFPrice(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleAdd}>Simpan</button>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="data">
          <thead>
            <tr><th>Nama Bahan</th><th>Kategori</th><th>Satuan</th><th>Harga</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: "var(--muted)" }}>{p.category === "bunga" ? "Bunga & Daun" : "Bahan Pendukung"}</td>
                <td style={{ color: "var(--muted)" }}>{p.unit}</td>
                <td>
                  <input className="input" style={{ width: 110 }} type="number" step="100" value={p.price}
                    onChange={(e) => updatePriceItem(p.id, Number(e.target.value) || 0)} />
                </td>
                <td>
                  <button className="btn btn-danger-ghost btn-sm btn-icon" onClick={() => deletePriceItem(p.id)}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="empty-state">Tidak ada bahan yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
