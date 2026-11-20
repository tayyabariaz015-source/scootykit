export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

export type Province = (typeof PROVINCES)[number];

/** Suggestions only — customers can type any city. */
export const MAJOR_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta",
  "Gujranwala", "Sialkot", "Hyderabad", "Bahawalpur", "Sargodha", "Sukkur", "Abbottabad",
  "Mardan", "Sahiwal", "Gujrat", "Rahim Yar Khan", "Sheikhupura", "Okara", "Jhelum", "Muzaffarabad",
  "Mirpur", "Gilgit", "Skardu", "Larkana", "Nawabshah", "Dera Ghazi Khan", "Kasur",
] as const;
