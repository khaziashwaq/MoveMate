"use client";

import { useState } from "react";

type Props = {
  onClose: () => void;
};

const CATEGORIES = [
  { key: "ROOM", label: "Room", icon: "🏠" },
  { key: "FLATMATE", label: "Flatmate", icon: "🤝" },
  { key: "FURNITURE", label: "Furniture", icon: "🪑" },
  { key: "REPLACEMENT", label: "Lease Transfer", icon: "🔄" },
] as const;

export function ListingForm({ onClose }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    address: "",
    landmark: "",
    rent: "",
    deposit: "",
    brokerage: "",
    availableFrom: "",
    furnished: false,
    features: [""],
    flatmateInfo: "",
    preferences: "",
    contact: "",
  });

  const update = (field: string, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));
  };

  const updateFeature = (index: number, value: string) => {
    setForm((prev) => {
      const features = [...prev.features];
      features[index] = value;
      return { ...prev, features };
    });
  };

  const removeFeature = (index: number) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const canProceed = () => {
    if (step === 1) return form.category !== "";
    if (step === 2)
      return form.title.trim() !== "" && form.description.trim() !== "";
    if (step === 3)
      return form.address.trim() !== "" && form.rent.trim() !== "";
    return true;
  };

  const handleSubmit = () => {
    // For now just close - would integrate with backend
    alert("Listing submitted! (Demo mode)");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] mx-4 bg-[#161816] border border-white/5 rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-white font-semibold text-base">
              Got Space/Stuff?
            </h2>
            <p className="text-[#8D8D8D] text-xs mt-0.5">Step {step} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gta-green transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto gta-scrollbar px-6 py-5 space-y-5">
          {step === 1 && (
            <StepCategory
              value={form.category}
              onChange={(v) => update("category", v)}
            />
          )}
          {step === 2 && (
            <StepDetails
              form={form}
              update={update}
              addFeature={addFeature}
              updateFeature={updateFeature}
              removeFeature={removeFeature}
            />
          )}
          {step === 3 && <StepLocation form={form} update={update} />}
          {step === 4 && <StepContact form={form} update={update} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 shrink-0">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2 rounded-[12px] text-sm text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
          >
            {step > 1 ? "Back" : "Cancel"}
          </button>
          <button
            onClick={() => (step < 4 ? setStep(step + 1) : handleSubmit())}
            disabled={!canProceed()}
            className="px-5 py-2 rounded-[12px] text-sm font-medium bg-gta-green text-black hover:bg-gta-green/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {step < 4 ? "Continue" : "Submit Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════ Step 1: Category ═══════ */
function StepCategory({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="text-white font-medium text-sm mb-1">
        What are you listing?
      </h3>
      <p className="text-[#8D8D8D] text-xs mb-4">
        Choose the category that best describes your listing.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-[18px] border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${
              value === cat.key
                ? "bg-[#181A18] border-gta-green/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                : "bg-[#181A18] border-white/5 hover:border-white/10"
            }`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span
              className={`text-xs font-medium ${
                value === cat.key ? "text-gta-green" : "text-white/70"
              }`}
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════ Step 2: Details ═══════ */
function StepDetails({
  form,
  update,
  addFeature,
  updateFeature,
  removeFeature,
}: {
  form: {
    title: string;
    description: string;
    features: string[];
    furnished: boolean;
  };
  update: (field: string, value: string | boolean | string[]) => void;
  addFeature: () => void;
  updateFeature: (i: number, v: string) => void;
  removeFeature: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-white text-xs font-medium mb-1.5 block">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Female Single Occupancy in 2BHK"
          className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
        />
      </div>

      <div>
        <label className="text-white text-xs font-medium mb-1.5 block">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Describe your listing in detail..."
          rows={3}
          className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-white text-xs font-medium">Features</label>
          <button
            onClick={addFeature}
            className="text-gta-green text-xs hover:text-gta-green/80 transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {form.features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={f}
                onChange={(e) => updateFeature(i, e.target.value)}
                placeholder={`Feature ${i + 1}`}
                className="flex-1 bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
              />
              {form.features.length > 1 && (
                <button
                  onClick={() => removeFeature(i)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          className={`w-10 h-5 rounded-full transition-colors relative ${
            form.furnished ? "bg-gta-green/30" : "bg-white/10"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
              form.furnished ? "left-5 bg-gta-green" : "left-0.5 bg-[#8D8D8D]"
            }`}
          />
        </div>
        <span className="text-white text-xs font-medium">Furnished</span>
      </label>
    </div>
  );
}

/* ═══════ Step 3: Location & Pricing ═══════ */
function StepLocation({
  form,
  update,
}: {
  form: {
    address: string;
    landmark: string;
    rent: string;
    deposit: string;
    brokerage: string;
    availableFrom: string;
  };
  update: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-white text-xs font-medium mb-1.5 block">
          Address
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="Full address of the listing"
          className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
        />
      </div>

      <div>
        <label className="text-white text-xs font-medium mb-1.5 block">
          Landmark <span className="text-[#8D8D8D]">(optional)</span>
        </label>
        <input
          type="text"
          value={form.landmark}
          onChange={(e) => update("landmark", e.target.value)}
          placeholder="Near any recognizable landmark"
          className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Rent / Price
          </label>
          <input
            type="text"
            value={form.rent}
            onChange={(e) => update("rent", e.target.value)}
            placeholder="₹10,000/month"
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Deposit <span className="text-[#8D8D8D]">(opt)</span>
          </label>
          <input
            type="text"
            value={form.deposit}
            onChange={(e) => update("deposit", e.target.value)}
            placeholder="₹20,000"
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Brokerage <span className="text-[#8D8D8D]">(opt)</span>
          </label>
          <input
            type="text"
            value={form.brokerage}
            onChange={(e) => update("brokerage", e.target.value)}
            placeholder="No brokerage"
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Available from
          </label>
          <input
            type="text"
            value={form.availableFrom}
            onChange={(e) => update("availableFrom", e.target.value)}
            placeholder="1st July"
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════ Step 4: Contact & Preferences ═══════ */
function StepContact({
  form,
  update,
}: {
  form: {
    contact: string;
    flatmateInfo: string;
    preferences: string;
  };
  update: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-white text-xs font-medium mb-1.5 block">
          Contact info
        </label>
        <input
          type="text"
          value={form.contact}
          onChange={(e) => update("contact", e.target.value)}
          placeholder="Phone number or email"
          className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
        />
      </div>

      <div>
        <label className="text-white text-xs font-medium mb-1.5 block">
          Flatmate info <span className="text-[#8D8D8D]">(optional)</span>
        </label>
        <input
          type="text"
          value={form.flatmateInfo}
          onChange={(e) => update("flatmateInfo", e.target.value)}
          placeholder="e.g. Female working professional"
          className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
        />
      </div>

      <div>
        <label className="text-white text-xs font-medium mb-1.5 block">
          Preferences <span className="text-[#8D8D8D]">(optional)</span>
        </label>
        <textarea
          value={form.preferences}
          onChange={(e) => update("preferences", e.target.value)}
          placeholder="e.g. Vegetarian, No smoking"
          rows={2}
          className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors resize-none"
        />
      </div>

      {/* Preview summary */}
      <div className="mt-4 p-4 rounded-[18px] bg-[#181A18] border border-white/5">
        <p className="text-gta-green text-xs font-medium mb-2">Preview</p>
        <p className="text-white text-sm font-medium">
          {form.flatmateInfo || "Your listing"}
        </p>
        <p className="text-[#8D8D8D] text-xs mt-1">
          {form.preferences || "No preferences set"}
        </p>
        <p className="text-[#8D8D8D] text-xs mt-1">
          Contact: {form.contact || "—"}
        </p>
      </div>
    </div>
  );
}
