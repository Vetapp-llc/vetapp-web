"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { apiRequest, todayGeorgia } from "@/lib/api/request";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAllergies, useCertificate, useAppointments, useSlots, useStaff, type CertTreatment,
} from "@/lib/hooks/useClinicFeatures";
import { Button, ConfirmButton, Empty, Field, Modal, Notice, inputClass } from "@/components/ui/kit";

/* ─── Border-crossing certificate (vet/cross.php) ─── */

// The certificate is trilingual by design, whatever the UI language.
const L = {
  title: "სასაზღვრო კვეთის ცნობა / Справка для пересечения границы / Pet border crossing certificate",
  pet: "ცხოველი / Животное / Animal",
  owner: "მფლობელი / Владелец / Owner",
  name: "სახელი / Кличка / Name",
  species: "სახეობა / Вид / Species",
  breed: "ჯიში / Порода / Breed",
  sex: "სქესი / Пол / Sex",
  color: "ფერი / Окрас / Colour",
  born: "დაბადების თარიღი / Дата рождения / Date of birth",
  chip: "მიკროჩიპი / Микрочип / Microchip",
  chipDate: "ჩიპირების თარიღი / Дата чипирования / Implanted",
  neutered: "სტერილიზაცია / Стерилизация / Neutered",
  ownerName: "სახელი / Имя / Name",
  personalId: "პირადი ნომერი / Личный номер / Personal ID",
  phone: "ტელეფონი / Телефон / Phone",
  address: "მისამართი / Адрес / Address",
  rabies: "ცოფის საწინააღმდეგო ვაქცინაცია / Вакцинация против бешенства / Rabies vaccination",
  complex: "კომპლექსური ვაქცინაცია / Комплексная вакцинация / Combined vaccination",
  dehel: "დეჰელმინთიზაცია / Дегельминтизация / Deworming",
  ecto: "ექტოპარაზიტების საწინააღმდეგო / Против эктопаразитов / Ectoparasite treatment",
  date: "თარიღი / Дата / Date",
  vaccine: "პრეპარატი / Препарат / Product",
  batch: "სერია / Серия / Batch",
  valid: "მოქმედებს / Действует до / Valid until",
  none: "—",
};

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <tr className="border-b border-gray-100">
      <th className="w-1/2 py-1 pr-2 text-left text-[11px] font-medium text-gray-500">{k}</th>
      <td className="py-1 text-sm font-semibold">{v?.trim() || L.none}</td>
    </tr>
  );
}

function Treatment({ title, p, product, batch }: { title: string; p: CertTreatment | null; product: (p: CertTreatment) => string; batch?: boolean }) {
  return (
    <div className="mt-3">
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wide">{title}</h4>
      <table className="w-full">
        <tbody>
          <Row k={L.date} v={p?.date} />
          <Row k={L.vaccine} v={p ? product(p) : ""} />
          {batch && <Row k={L.batch} v={p?.ser} />}
          <Row k={L.valid} v={p?.date2 && /^\d{4}-/.test(p.date2) ? p.date2 : ""} />
        </tbody>
      </table>
    </div>
  );
}

const ectoProduct = (p: CertTreatment) =>
  [p.vac1, p.vac, p.vac3, p.vac2, p.vac5, p.vac4, p.vac7, p.vac6].filter((v) => v && v !== "სხვა").join(", ");

export function CertificateModal({ petId, ownerId, onClose }: { petId: string; ownerId?: string; onClose: () => void }) {
  const t = useTranslations("features");
  const { data: c, isLoading, error } = useCertificate(petId, ownerId);
  return (
    <Modal open title={t("certificate")} onClose={onClose} wide zIndex="z-[75]">
      {isLoading && <p className="text-sm">{t("loading")}</p>}
      {error && <Notice>{error.message}</Notice>}
      {c && (
        <div>
          <style>{`@media print { body * { visibility: hidden; } .cert, .cert * { visibility: visible; } .cert { position: absolute; inset: 0; padding: 24px; } }`}</style>
          <div className="cert text-primary-dark">
            <h3 className="mb-3 text-center text-sm font-bold">{L.title}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wide">{L.pet}</h4>
                <table className="w-full"><tbody>
                  <Row k={L.name} v={c.pet.name} />
                  <Row k={L.species} v={c.pet.pet} />
                  <Row k={L.breed} v={c.pet.variety} />
                  <Row k={L.sex} v={c.pet.sex} />
                  <Row k={L.color} v={c.pet.color} />
                  <Row k={L.born} v={c.pet.date} />
                  <Row k={L.chip} v={c.pet.chip} />
                  <Row k={L.chipDate} v={c.pet.chipd} />
                  <Row k={L.neutered} v={[c.pet.cast, c.pet.castdate].filter(Boolean).join(" ")} />
                </tbody></table>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wide">{L.owner}</h4>
                <table className="w-full"><tbody>
                  <Row k={L.ownerName} v={c.owner.name} />
                  <Row k={L.personalId} v={c.owner.personal_id} />
                  <Row k={L.phone} v={c.owner.phone} />
                  <Row k={L.address} v={c.owner.address} />
                </tbody></table>
              </div>
            </div>
            <Treatment title={L.rabies} p={c.rabies} product={(p) => p.vacn} batch />
            <Treatment title={L.complex} p={c.complex} product={(p) => p.vacn} batch />
            <Treatment title={L.dehel} p={c.dehelminization} product={(p) => [p.deh !== "სხვა" ? p.deh : "", p.vac].filter(Boolean).join(" ")} />
            <Treatment title={L.ecto} p={c.ectoparasite} product={ectoProduct} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => window.print()}>{t("print")}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Allergies & diseases (vet/veals.php, addeals.php) ─── */

export function AllergiesPanel({ petId, ownerId }: { petId: string; ownerId?: string }) {
  const t = useTranslations("features");
  const qc = useQueryClient();
  const { data, isLoading, error } = useAllergies(petId, ownerId);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["allergies", petId] });

  const add = async () => {
    setBusy(true);
    setErr(null);
    try {
      const proof = ownerId ? `?owner_id=${encodeURIComponent(ownerId)}` : "";
      await apiRequest("POST", `/allergies${proof}`, { uuid: petId, name: name.trim(), comment: comment.trim() });
      setName("");
      setComment("");
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await apiRequest("DELETE", `/allergies/${id}`);
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    }
  };

  return (
    <div className="space-y-3">
      {(err || error) && <Notice>{err ?? error?.message}</Notice>}
      {isLoading ? (
        <p className="text-sm">{t("loading")}</p>
      ) : !data || data.length === 0 ? (
        <Empty>{t("none")}</Empty>
      ) : (
        <ul className="space-y-2">
          {data.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-primary-dark">{a.name}</p>
                <p className="text-xs text-foreground-muted/60">
                  {a.date}{a.comment ? ` · ${a.comment}` : ""}{!a.mine ? ` · ${t("otherClinic")}` : ""}
                </p>
              </div>
              {a.mine && <ConfirmButton confirmLabel={t("confirmDelete")} onConfirm={() => remove(a.id)}>{t("delete")}</ConfirmButton>}
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label={t("allergyName")}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("comment")}>
          <input className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        <Button onClick={add} disabled={busy || !name.trim()}>{t("add")}</Button>
      </div>
    </div>
  );
}

/* ─── Edit pet (vet/updatepet.php) ─── */

export interface EditablePet {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  color: string;
  birth?: string | null;
  chip: string;
  chipDate?: string;
  cast?: string;
  castDate?: string | null;
  ownerPersonalId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

export function EditPetModal({ pet, onClose, onSaved }: { pet: EditablePet; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("features");
  const trimmed = (v?: string | null) => (v ?? "").trim();
  const [f, setF] = useState({
    name: pet.name, pet: trimmed(pet.species), variety: pet.breed, sex: trimmed(pet.sex), color: pet.color,
    date: pet.birth ?? "", chip: pet.chip, chipd: pet.chipDate ?? "", cast: pet.cast ?? "", castdate: pet.castDate ?? "",
    uuid: pet.ownerPersonalId, first_name: pet.ownerName, phone: pet.ownerPhone, email: pet.ownerEmail,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const isDate = (v: string) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
  const valid = f.name.trim() && f.uuid.trim() && isDate(f.date) && isDate(f.chipd) && isDate(f.castdate);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await apiRequest("PUT", `/pets/${pet.id}`, f);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  };

  const speciesOptions = ["ძაღლი", "კატა", "სხვა"];
  return (
    <Modal open title={t("editPet")} onClose={onClose} wide zIndex="z-[75]">
      <div className="space-y-3">
        {err && <Notice>{err}</Notice>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label={t("name")}><input className={inputClass} value={f.name} onChange={set("name")} /></Field>
          <Field label={t("species")}>
            <select className={inputClass} value={f.pet} onChange={set("pet")}>
              {!speciesOptions.includes(f.pet) && <option value={f.pet}>{f.pet}</option>}
              <option value="ძაღლი">{t("dog")}</option>
              <option value="კატა">{t("cat")}</option>
              <option value="სხვა">{t("otherSpecies")}</option>
            </select>
          </Field>
          <Field label={t("breed")}><input className={inputClass} value={f.variety} onChange={set("variety")} /></Field>
          <Field label={t("sex")}>
            <select className={inputClass} value={f.sex} onChange={set("sex")}>
              <option value="">—</option>
              <option value="ხვადი">{t("male")}</option>
              <option value="ძუ">{t("female")}</option>
            </select>
          </Field>
          <Field label={t("color")}><input className={inputClass} value={f.color} onChange={set("color")} /></Field>
          <Field label={t("birthDate")}><input type="date" className={inputClass} value={f.date} onChange={set("date")} /></Field>
          <Field label={t("chip")}><input className={inputClass} value={f.chip} onChange={set("chip")} /></Field>
          <Field label={t("chipDate")}><input type="date" className={inputClass} value={f.chipd} onChange={set("chipd")} /></Field>
          <Field label={t("neutered")}>
            <select className={inputClass} value={f.cast} onChange={set("cast")}>
              <option value="">—</option>
              <option value="კასტრაცია">კასტრაცია</option>
              <option value="სტერილიზაცია">სტერილიზაცია</option>
            </select>
          </Field>
          <Field label={t("neuteredDate")}><input type="date" className={inputClass} value={f.castdate} onChange={set("castdate")} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-2">
          <Field label={t("ownerId")}><input className={inputClass} value={f.uuid} onChange={set("uuid")} /></Field>
          <Field label={t("ownerName")}><input className={inputClass} value={f.first_name} onChange={set("first_name")} /></Field>
          <Field label={t("phone")}><input className={inputClass} value={f.phone} onChange={set("phone")} /></Field>
          <Field label={t("email")}><input className={inputClass} value={f.email} onChange={set("email")} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={save} disabled={busy || !valid}>{busy ? t("saving") : t("save")}</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Book an appointment (vet/addproceduredate.php, addoperationdate.php + timeslot.php) ─── */

// The procedure list of vet/addproceduredate.php. vet/addoperationdate.php
// wrote the same column from free text; OTHER_PROCEDURE opens that input.
const BOOKABLE_PROCEDURES = [
  "კონსულტაცია", "ვაქცინაცია", "ტესტი", "ლაბორატორია", "რადიოლოგია", "სტომატოლოგია",
  "დეჰელმინთიზაცია", "ექტოპარაზიტების პრევენცია", "სტერილიზაცია/კასტრაცია", "ქირურგია",
  "თერაპია", "ოფთალმოლოგია", "ტრავმატოლოგია", "კარდიოლოგია", "ოქსიგენოთერაპია",
  "დერმატოლოგია", "სხვა პროცედურა",
];
const OTHER_PROCEDURE = "__other__";

export function BookAppointmentModal({
  petId, petName, ownerId, onClose, onBooked,
}: {
  petId?: string;
  petName?: string;
  ownerId?: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const t = useTranslations("features");
  const { data: staff } = useStaff();
  const [date, setDate] = useState(todayGeorgia());
  const [vet, setVet] = useState("");
  const [time, setTime] = useState("");
  const [choice, setChoice] = useState("");
  const [customName, setCustomName] = useState("");
  const tpname = choice === OTHER_PROCEDURE ? customName : choice;
  const [price, setPrice] = useState("");
  const [koment, setKoment] = useState("");
  const [pname, setPname] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data: slots, isFetching: slotsLoading } = useSlots(date, vet);

  const book = async () => {
    setBusy(true);
    setErr(null);
    try {
      await apiRequest("POST", "/appointments", {
        uuid: petId || undefined, owner: ownerId || undefined, pname: petId ? undefined : pname.trim(),
        date, time: time || undefined, vetname: vet || undefined, tpname: tpname.trim(), price: price.trim(), koment,
      });
      qc.invalidateQueries({ queryKey: ["slots"] });
      onBooked();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title={`${t("bookAppointment")}${petName ? ` — ${petName}` : ""}`} onClose={onClose} wide zIndex="z-[75]">
      <div className="space-y-3">
        {err && <Notice>{err}</Notice>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!petId && (
            <Field label={t("patientDescription")} className="sm:col-span-2">
              <input className={inputClass} value={pname} onChange={(e) => setPname(e.target.value)} />
            </Field>
          )}
          <Field label={t("procedure")}>
            <select className={inputClass} value={choice} onChange={(e) => setChoice(e.target.value)}>
              <option value="">—</option>
              {BOOKABLE_PROCEDURES.map((p) => <option key={p} value={p}>{p}</option>)}
              <option value={OTHER_PROCEDURE}>{t("otherProcedure")}</option>
            </select>
            {choice === OTHER_PROCEDURE && (
              <input className={inputClass} placeholder={t("operationName")} value={customName} onChange={(e) => setCustomName(e.target.value)} />
            )}
          </Field>
          <Field label={t("price")}><input className={inputClass} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          <Field label={t("date")}><input type="date" className={inputClass} min={todayGeorgia()} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} /></Field>
          <Field label={t("vet")}>
            <select className={inputClass} value={vet} onChange={(e) => { setVet(e.target.value); setTime(""); }}>
              <option value="">{t("you")}</option>
              {(staff ?? []).map((s) => <option key={s.id} value={String(s.id)}>{s.first_name}</option>)}
            </select>
          </Field>
          <Field label={t("comment")} className="sm:col-span-2"><input className={inputClass} value={koment} onChange={(e) => setKoment(e.target.value)} /></Field>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/60">{t("time")}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button onClick={() => setTime("")} className={`rounded-lg px-2.5 py-1 text-xs cursor-pointer ${time === "" ? "bg-primary text-white" : "bg-gray-100"}`}>{t("noTime")}</button>
            {(slots ?? []).map((s) => (
              <button
                key={s.time}
                disabled={!s.available || slotsLoading}
                title={s.available ? "" : t("slotTaken")}
                onClick={() => setTime(s.time)}
                className={`rounded-lg px-2.5 py-1 text-xs cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300 disabled:line-through ${time === s.time ? "bg-primary text-white" : "bg-gray-100"}`}
              >
                {s.time}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={book} disabled={busy || !tpname.trim() || !date || (!petId && !pname.trim())}>{busy ? t("saving") : t("book")}</Button>
        </div>
      </div>
    </Modal>
  );
}

export function PetAppointments({ petId, petName, ownerId }: { petId: string; petName: string; ownerId?: string }) {
  const t = useTranslations("features");
  const qc = useQueryClient();
  const { data, isLoading } = useAppointments(todayGeorgia(), "", petId);
  const [booking, setBooking] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["appointments"] });
  const [err, setErr] = useState<string | null>(null);
  const cancel = async (id: number) => {
    setErr(null);
    try {
      await apiRequest("DELETE", `/appointments/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    }
    refresh();
    qc.invalidateQueries({ queryKey: ["slots"] });
  };
  return (
    <div className="space-y-3">
      {err && <Notice>{err}</Notice>}
      <div className="flex justify-end"><Button small onClick={() => setBooking(true)}>{t("bookAppointment")}</Button></div>
      {isLoading ? (
        <p className="text-sm">{t("loading")}</p>
      ) : !data || data.data.length === 0 ? (
        <Empty>{t("none")}</Empty>
      ) : (
        <ul className="space-y-2">
          {data.data.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-sm">
              <span><b>{a.date}</b> {a.time || t("noTime")} · {a.tpname}{a.price ? ` · ${a.price} ₾` : ""}</span>
              <ConfirmButton confirmLabel={t("confirmDelete")} onConfirm={() => cancel(a.id)}>{t("cancelAppointment")}</ConfirmButton>
            </li>
          ))}
        </ul>
      )}
      {booking && <BookAppointmentModal petId={petId} petName={petName} ownerId={ownerId} onClose={() => setBooking(false)} onBooked={() => { setBooking(false); refresh(); }} />}
    </div>
  );
}
