"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  SignOut,
  MapPin,
  CurrencyInr,
  PencilSimple,
  Check,
  Camera,
  CalendarBlank,
  CircleNotch,
} from "@phosphor-icons/react";
import { logout } from "@/features/auth/actions/logout";
import {
  getProfile,
  updateProfile,
  type ProfileData,
} from "@/features/auth/actions/profile";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  isAuthenticated: boolean;
  editable?: boolean;
};

const AVATAR_COUNT = 5;

function AvatarImage({
  avatarId,
  className,
}: {
  avatarId: number;
  className?: string;
}) {
  return (
    <img
      src={`/avatars/${avatarId}.jpg`}
      alt={`Avatar ${avatarId}`}
      className={`${className || ""} rounded-full object-cover object-top`}
    />
  );
}

const SLEEP_OPTIONS = ["Early Bird", "Night Owl", "Flexible"];
const SMOKING_OPTIONS = ["Non Smoker", "Smoker", "Occasionally"];
const DRINKING_OPTIONS = ["Non Drinker", "Social Drinker", "Regular"];
const PET_OPTIONS = ["Pet Friendly", "No Pets", "Have Pets"];
const CLEANLINESS_OPTIONS = ["10/10", "9/10", "8/10", "7/10", "6/10", "5/10"];
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const FOOD_OPTIONS = ["Veg", "Non-Veg", "Eggetarian", "Vegan"];
const INTEREST_OPTIONS = [
  "Gym",
  "Gaming",
  "Movies",
  "Coffee",
  "Reading",
  "Music",
  "Cooking",
  "Travel",
  "Photography",
  "Yoga",
  "Running",
  "Cycling",
  "Art",
  "Dance",
];
const LOOKING_FOR_OPTIONS = [
  "Female Flatmate",
  "Male Flatmate",
  "Budget <₹10k",
  "Budget ₹10-20k",
  "Budget ₹30k>",
  "Move in Next Month",
  "Immediate Move-in",
];

export function ProfileModal({
  isOpen,
  onClose,
  profile,
  isAuthenticated,
  editable = true,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedProfile, setLoadedProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<Partial<ProfileData>>({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setLoading(true);
      getProfile().then(({ data }) => {
        const p = data || profile;
        setLoadedProfile(p);
        setForm({
          full_name: p.full_name || "",
          age: p.age || "",
          area: p.area || "",
          occupation: p.occupation || "",
          gender: p.gender || "",
          budget: p.budget || "",
          about: p.about || "",
          food_preference: p.food_preference || "",
          sleep_schedule: p.sleep_schedule || "",
          smoking: p.smoking || "",
          drinking: p.drinking || "",
          pet_friendly: p.pet_friendly || "",
          cleanliness: p.cleanliness || "",
          interests: p.interests || [],
          looking_for: p.looking_for || [],
          move_in_date: p.move_in_date || "",
          avatar_url: p.avatar_url || "",
        });
        setLoading(false);
      });
    } else if (isOpen) {
      setForm({ full_name: profile.full_name || "" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile(form);
    if (result.error) {
      console.error("Profile save failed:", result.error);
      setSaving(false);
      return;
    }
    setLoadedProfile((prev) => ({ ...(prev || profile), ...form }));
    setSaving(false);
    setEditing(false);
    setShowAvatarPicker(false);
  };

  const displayProfile = loadedProfile || profile;
  const initial = (displayProfile.full_name || "?").charAt(0).toUpperCase();
  const avatarId = parseInt(
    form.avatar_url || displayProfile.avatar_url || "0",
  );
  const hasAvatar = avatarId >= 1 && avatarId <= AVATAR_COUNT;

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    setForm((prev) => {
      const arr = (prev as any)[field] || [];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter((i: string) => i !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl mx-3 sm:mx-4 bg-[#161816] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Loading state */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <CircleNotch size={32} className="text-gta-green animate-spin" />
              <p className="text-white/40 text-sm">Loading profile...</p>
            </div>
          </div>
        ) : (
        <>
        {/* ═══ HEADER — centered ═══ */}
        <div className="overflow-y-auto gta-scrollbar flex-1 flex flex-col">
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5">
          <div className="flex flex-col items-center text-center gap-3">
            {/* Avatar + horizontal slide picker */}
            <div className="flex items-center justify-center gap-3">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-gta-green/10 border-2 border-gta-green/30 flex items-center justify-center overflow-hidden">
                  {hasAvatar ? (
                    <AvatarImage
                      avatarId={avatarId}
                      className="w-full h-full"
                    />
                  ) : (
                    <span className="text-gta-green text-3xl font-bold">
                      {initial}
                    </span>
                  )}
                </div>
                {editing && editable && (
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gta-green flex items-center justify-center shadow-lg"
                  >
                    <Camera size={14} className="text-black" />
                  </button>
                )}
              </div>

              {/* Horizontal avatar picker — slides to the right */}
              {showAvatarPicker && editing && (
                <div className="flex items-center gap-2 bg-[#181A18] rounded-full px-3 py-2 border border-white/5 animate-slide-in-right overflow-x-auto max-w-[calc(100vw-8rem)] sm:max-w-none gta-scrollbar">
                  {Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => {
                          updateField("avatar_url", String(n));
                          setShowAvatarPicker(false);
                        }}
                        className={`w-10 h-10 shrink-0 rounded-full overflow-hidden border-2 transition-all ${
                          form.avatar_url === String(n)
                            ? "border-gta-green scale-110"
                            : "border-transparent hover:border-white/30"
                        }`}
                      >
                        <AvatarImage avatarId={n} className="w-full h-full" />
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Name + Age */}
            <div className="flex items-center gap-2">
              {editing ? (
                <input
                  type="text"
                  value={form.full_name || ""}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  className="text-white font-semibold text-base sm:text-xl bg-[#181A18] rounded-lg px-2 sm:px-3 py-1 border border-white/10 focus:outline-none focus:border-gta-green/40 text-center w-40 sm:w-auto"
                />
              ) : (
                <h2 className="text-white font-semibold text-xl">
                  {form.full_name || "No name"}
                </h2>
              )}
              {editing ? (
                <input
                  type="text"
                  value={form.age || ""}
                  onChange={(e) =>
                    updateField(
                      "age",
                      e.target.value.replace(/[^0-9]/g, "").slice(0, 2),
                    )
                  }
                  placeholder="Age"
                  className="w-12 text-white/60 text-sm bg-[#181A18] rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:border-gta-green/40 text-center"
                />
              ) : form.age ? (
                <span className="text-white/50 text-sm">, {form.age}</span>
              ) : null}
            </div>

            {/* Occupation + Location row */}
            <div className="flex items-center gap-3 text-sm text-white/50">
              {editing ? (
                <input
                  type="text"
                  value={form.occupation || ""}
                  onChange={(e) => updateField("occupation", e.target.value)}
                  placeholder="Occupation"
                  className="text-white/60 text-sm bg-[#181A18] rounded-lg px-3 py-1 border border-white/10 focus:outline-none focus:border-gta-green/40 w-36 text-center"
                />
              ) : (
                <span>{form.occupation || "—"}</span>
              )}
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1 text-xs text-[#8D8D8D]">
                <MapPin size={12} weight="fill" className="text-gta-green/70" />
                {editing ? (
                  <input
                    type="text"
                    value={form.area || ""}
                    onChange={(e) => updateField("area", e.target.value)}
                    placeholder="Area"
                    className="bg-[#181A18] rounded-md px-2 py-0.5 border border-white/10 focus:outline-none focus:border-gta-green/40 text-white/60 w-24 text-xs text-center"
                  />
                ) : (
                  form.area || "—"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ TWO-COLUMN BODY — equal height ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-4 sm:px-5 pb-4 items-stretch">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-3">
            <Card title="About">
              {editing ? (
                <textarea
                  value={form.about || ""}
                  onChange={(e) => updateField("about", e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={2}
                  className="w-full bg-[#1e201e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 border border-white/5 resize-none"
                />
              ) : (
                <p className="text-white/60 text-sm leading-relaxed">
                  {form.about || "No bio yet"}
                </p>
              )}
            </Card>

            <Card title="Details">
              <div className="flex flex-wrap gap-2">
                {editing ? (
                  <>
                    <ChipSelect
                      options={GENDER_OPTIONS}
                      value={form.gender || ""}
                      onChange={(v) => updateField("gender", v)}
                      icon="👤"
                    />
                    <ChipSelect
                      options={FOOD_OPTIONS}
                      value={form.food_preference || ""}
                      onChange={(v) => updateField("food_preference", v)}
                      icon="🍽️"
                    />
                  </>
                ) : (
                  <>
                    {form.gender && <Chip emoji="👤" label={form.gender} />}
                    {form.food_preference && (
                      <Chip emoji="🍽️" label={form.food_preference} />
                    )}
                    {!form.gender && !form.food_preference && (
                      <span className="text-white/30 text-xs">
                        No details added
                      </span>
                    )}
                  </>
                )}
              </div>
            </Card>

            <Card title="Interests" grow>
              <div className="flex flex-wrap gap-2">
                {editing ? (
                  INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleArrayItem("interests", interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        (form.interests || []).includes(interest)
                          ? "bg-gta-green/15 border border-gta-green/40 text-gta-green"
                          : "bg-[#1e201e] border border-white/5 text-[#8D8D8D] hover:border-white/15"
                      }`}
                    >
                      {interest}
                    </button>
                  ))
                ) : (form.interests || []).length > 0 ? (
                  (form.interests || []).map((interest) => (
                    <Chip key={interest} label={interest} />
                  ))
                ) : (
                  <span className="text-white/30 text-xs">
                    No interests added
                  </span>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-3">
            <Card title="Lifestyle" grow>
              <div className="flex flex-wrap gap-2">
                {editing ? (
                  <>
                    <ChipSelect
                      options={SLEEP_OPTIONS}
                      value={form.sleep_schedule || ""}
                      onChange={(v) => updateField("sleep_schedule", v)}
                      icon="🌙"
                    />
                    <ChipSelect
                      options={SMOKING_OPTIONS}
                      value={form.smoking || ""}
                      onChange={(v) => updateField("smoking", v)}
                      icon="🚭"
                    />
                    <ChipSelect
                      options={DRINKING_OPTIONS}
                      value={form.drinking || ""}
                      onChange={(v) => updateField("drinking", v)}
                      icon="🍺"
                    />
                    <ChipSelect
                      options={PET_OPTIONS}
                      value={form.pet_friendly || ""}
                      onChange={(v) => updateField("pet_friendly", v)}
                      icon="🐶"
                    />
                    <ChipSelect
                      options={CLEANLINESS_OPTIONS}
                      value={form.cleanliness || ""}
                      onChange={(v) => updateField("cleanliness", v)}
                      icon="🧹"
                    />
                  </>
                ) : (
                  <>
                    {form.sleep_schedule && (
                      <Chip emoji="🌙" label={form.sleep_schedule} />
                    )}
                    {form.smoking && <Chip emoji="🚭" label={form.smoking} />}
                    {form.drinking && <Chip emoji="🍺" label={form.drinking} />}
                    {form.pet_friendly && (
                      <Chip emoji="🐶" label={form.pet_friendly} />
                    )}
                    {form.cleanliness && (
                      <Chip
                        emoji="🧹"
                        label={`Cleanliness ${form.cleanliness}`}
                      />
                    )}
                    {!form.sleep_schedule &&
                      !form.smoking &&
                      !form.drinking &&
                      !form.pet_friendly &&
                      !form.cleanliness && (
                        <span className="text-white/30 text-xs">
                          No lifestyle info yet
                        </span>
                      )}
                  </>
                )}
              </div>
            </Card>

            <Card title="Looking For">
              <div className="flex flex-wrap gap-2">
                {editing ? (
                  LOOKING_FOR_OPTIONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleArrayItem("looking_for", item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        (form.looking_for || []).includes(item)
                          ? "bg-gta-green/15 border border-gta-green/40 text-gta-green"
                          : "bg-[#1e201e] border border-white/5 text-[#8D8D8D] hover:border-white/15"
                      }`}
                    >
                      {item}
                    </button>
                  ))
                ) : (form.looking_for || []).length > 0 ? (
                  (form.looking_for || []).map((item) => (
                    <Chip key={item} label={item} active />
                  ))
                ) : (
                  <span className="text-white/30 text-xs">Not specified</span>
                )}
              </div>
            </Card>
          </div>
        </div>
        </div>

        {/* ═══ ACTIONS ═══ */}
        </>
        )}
        <div className="px-3 sm:px-5 py-2.5 sm:py-4 shrink-0 flex items-center gap-1.5 sm:gap-3 border-t border-white/5">
          {displayProfile.created_at && (
            <p className="text-[#8D8D8D] text-[10px] mr-auto">
              Member since{" "}
              {new Date(displayProfile.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
          {editable &&
            isAuthenticated &&
            (editing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gta-green/10 border border-gta-green/30 text-gta-green text-xs sm:text-sm font-medium hover:bg-gta-green/20 transition-colors disabled:opacity-50"
              >
                <Check size={14} className="sm:w-4 sm:h-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <PencilSimple size={14} className="sm:w-4 sm:h-4" />
                Edit
              </button>
            ))}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <SignOut size={14} className="sm:w-4 sm:h-4" />
              {loggingOut ? "..." : "Log out"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════ HELPER COMPONENTS ═══════ */

function Card({
  title,
  children,
  grow,
}: {
  title: string;
  children: React.ReactNode;
  grow?: boolean;
}) {
  return (
    <div
      className={`bg-[#181A18] rounded-xl p-4 border border-white/5 ${grow ? "flex-1" : ""}`}
    >
      <h3 className="text-[#8D8D8D] text-[11px] font-semibold uppercase tracking-wider mb-2.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Chip({
  emoji,
  label,
  active,
}: {
  emoji?: string;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
        active
          ? "bg-gta-green/10 border border-gta-green/30 text-gta-green"
          : "bg-[#1e201e] border border-white/5 text-white/70"
      }`}
    >
      {emoji && <span>{emoji}</span>}
      {label}
    </span>
  );
}

function ChipSelect({
  options,
  value,
  onChange,
  icon,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  icon: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt === value ? "" : opt)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            value === opt
              ? "bg-gta-green/15 border border-gta-green/40 text-gta-green"
              : "bg-[#1e201e] border border-white/5 text-[#8D8D8D] hover:border-white/15"
          }`}
        >
          <span>{icon}</span>
          {opt}
        </button>
      ))}
    </div>
  );
}
