// Display translations for the Georgian values stored in the legacy
// database (species, sex, procedure type names). Values are trimmed
// first: legacy rows carry trailing spaces ("ხვადი ").
//
// Sex: ძუ is female, ხვადი is male (vet/addpet2.php, PHP docs). This
// map once had them the other way round.

type Dict = Record<string, string>;

const speciesMap: Record<string, Dict> = {
  en: { "ძაღლი": "Dog", "კატა": "Cat", "სხვა": "Other", "თუთიყუში": "Parrot", "კურდღელი": "Rabbit", "ზაზუნა": "Hamster" },
  ru: { "ძაღლი": "Собака", "კატა": "Кошка", "სხვა": "Другое", "თუთიყუში": "Попугай", "კურდღელი": "Кролик", "ზაზუნა": "Хомяк" },
  ka: { Dog: "ძაღლი", Cat: "კატა", Other: "სხვა", Parrot: "თუთიყუში", Rabbit: "კურდღელი", Hamster: "ზაზუნა" },
};

const sexMap: Record<string, Dict> = {
  en: { "ძუ": "Female", "ხვადი": "Male", female: "Female", male: "Male" },
  ru: { "ძუ": "Самка", "ხვადი": "Самец", female: "Самка", male: "Самец" },
  ka: { Female: "ძუ", Male: "ხვადი", female: "ძუ", male: "ხვადი" },
};

const procedureTypeMap: Record<string, Dict> = {
  en: {
    "ვაქცინაცია": "Vaccination",
    "დეჰელმინთიზაცია": "Deworming",
    "ექტოპარაზიტები": "Ectoparasites",
    "ექტოპარაზიტების პრევენცია": "Ectoparasite prevention",
    "კონსულტაცია": "Consultation",
    "ოპერაცია": "Surgery",
    "ქირურგია": "Surgery",
    "ლაბორატორია": "Laboratory",
    "თერაპია": "Therapy",
    "სტომატოლოგია": "Dentistry",
    "რადიოლოგია": "Radiology",
    "კარდიოლოგია": "Cardiology",
    "დერმატოლოგია": "Dermatology",
    "ოფთალმოლოგია": "Ophthalmology",
    "ტრავმატოლოგია": "Traumatology",
    "ოქსიგენოთერაპია": "Oxygen therapy",
    "ჟანგბადით მკურნალობა": "Oxygen therapy",
    "სტერილიზაცია/კასტრაცია": "Sterilization / castration",
    "მიკროჩიპი": "Microchip",
    "ტესტი": "Test",
    "ანალიზი (ძაღლი)": "Test (dog)",
    "ანალიზი (კატა)": "Test (cat)",
    "ანალიზი (სხვა)": "Test (other)",
    "სხვა პროცედურა": "Other procedure",
    "სხვა": "Other",
  },
  ru: {
    "ვაქცინაცია": "Вакцинация",
    "დეჰელმინთიზაცია": "Дегельминтизация",
    "ექტოპარაზიტები": "Эктопаразиты",
    "ექტოპარაზიტების პრევენცია": "Профилактика эктопаразитов",
    "კონსულტაცია": "Консультация",
    "ოპერაცია": "Хирургия",
    "ქირურგია": "Хирургия",
    "ლაბორატორია": "Лаборатория",
    "თერაპია": "Терапия",
    "სტომატოლოგია": "Стоматология",
    "რადიოლოგია": "Рентгенология",
    "კარდიოლოგია": "Кардиология",
    "დერმატოლოგია": "Дерматология",
    "ოფთალმოლოგია": "Офтальмология",
    "ტრავმატოლოგია": "Травматология",
    "ოქსიგენოთერაპია": "Кислородная терапия",
    "ჟანგბადით მკურნალობა": "Кислородная терапия",
    "სტერილიზაცია/კასტრაცია": "Стерилизация / кастрация",
    "მიკროჩიპი": "Микрочип",
    "ტესტი": "Тест",
    "ანალიზი (ძაღლი)": "Тест (собака)",
    "ანალიზი (კატა)": "Тест (кошка)",
    "ანალიზი (სხვა)": "Тест (другое)",
    "სხვა პროცედურა": "Другая процедура",
    "სხვა": "Другое",
  },
  ka: {
    Vaccination: "ვაქცინაცია",
    Deworming: "დეჰელმინთიზაცია",
    Ectoparasites: "ექტოპარაზიტები",
    Consultation: "კონსულტაცია",
    Surgery: "ქირურგია",
    Laboratory: "ლაბორატორია",
    Therapy: "თერაპია",
    Dentistry: "სტომატოლოგია",
    Stomatology: "სტომატოლოგია",
    Radiology: "რადიოლოგია",
    Cardiology: "კარდიოლოგია",
    Dermatology: "დერმატოლოგია",
    Ophthalmology: "ოფთალმოლოგია",
    Traumatology: "ტრავმატოლოგია",
    Test: "ტესტი",
    Other: "სხვა",
  },
};

function lookup(map: Record<string, Dict>, value: string, locale: string): string {
  const v = (value ?? "").trim();
  return map[locale]?.[v] ?? v;
}

export function localizeSpeciesValue(value: string, locale: string): string {
  return lookup(speciesMap, value, locale);
}

export function localizeSex(value: string, locale: string): string {
  return lookup(sexMap, value, locale);
}

export function localizeProcedureType(value: string, locale: string): string {
  return lookup(procedureTypeMap, value, locale);
}

/** Maps a stored species (ძაღლი / კატა / other) onto the forms' species key. */
export function speciesKey(value: string): "dog" | "cat" | "other" {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "ძაღლი" || v === "dog") return "dog";
  if (v === "კატა" || v === "cat") return "cat";
  return "other";
}
