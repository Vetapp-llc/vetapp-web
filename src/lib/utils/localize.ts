const speciesMap: Record<string, Record<string, string>> = {
  en: {
    "ძაღლი": "Dog",
    "კატა": "Cat",
    "თუთიყუში": "Parrot",
    "კურდღელი": "Rabbit",
    "ზაზუნა": "Hamster",
  },
  ka: {
    Dog: "ძაღლი",
    Cat: "კატა",
    Parrot: "თუთიყუში",
    Rabbit: "კურდღელი",
    Hamster: "ზაზუნა",
  },
};

const sexMap: Record<string, Record<string, string>> = {
  en: {
    "ძუ": "Male",
    "ხვადი": "Female",
    male: "Male",
    female: "Female",
  },
  ka: {
    Male: "ძუ",
    Female: "ხვადი",
    male: "ძუ",
    female: "ხვადი",
  },
};

const procedureTypeMap: Record<string, Record<string, string>> = {
  en: {
    ვაქცინაცია: "Vaccination",
    დეჰელმინთიზაცია: "Deworming",
    ექტოპარაზიტები: "Ectoparasites",
    კონსულტაცია: "Consultation",
    ოპერაცია: "Surgery",
    ლაბორატორია: "Laboratory",
    თერაპია: "Therapy",
    სტომატოლოგია: "Stomatology",
    რადიოლოგია: "Radiology",
    კარდიოლოგია: "Cardiology",
    დერმატოლოგია: "Dermatology",
    ოფთალმოლოგია: "Ophthalmology",
    ტრავმატოლოგია: "Traumatology",
    ტესტი: "Test",
    სხვა: "Other",
  },
  ka: {
    Vaccination: "ვაქცინაცია",
    Deworming: "დეჰელმინთიზაცია",
    Ectoparasites: "ექტოპარაზიტები",
    Consultation: "კონსულტაცია",
    Surgery: "ოპერაცია",
    Laboratory: "ლაბორატორია",
    Therapy: "თერაპია",
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

export function localizeSpeciesValue(value: string, locale: string): string {
  return speciesMap[locale]?.[value] ?? value;
}

export function localizeSex(value: string, locale: string): string {
  return sexMap[locale]?.[value] ?? value;
}

export function localizeProcedureType(value: string, locale: string): string {
  return procedureTypeMap[locale]?.[value] ?? value;
}
