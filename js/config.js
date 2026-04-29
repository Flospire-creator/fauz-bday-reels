// Public config. Safe to commit.
// SUPABASE_ANON_KEY is designed to be exposed to the browser; secrets stay server-side.
window.APP_CONFIG = {
  // Soft password gate. Anyone with this string can use the app.
  // Change to whatever you share in the group chat.
  PASSWORD: "marrakech26",

  // Supabase project values. The publishable key is safe to expose in the browser.
  SUPABASE_URL: "https://ybdbcxxbsjhwesolofzr.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_r7nBYacsdlQyFigg24Gasg_1dP-ddon",

  // Bucket name (must match the one you create in Supabase Storage).
  STORAGE_BUCKET: "uploads",

  // Trip details, stamped into the rendered reels.
  TRIP_TITLE: "Fauz's Birthday",
  TRIP_PLACE: "Marrakech '26",

  // Upload limits.
  MAX_FILES: 8,
  MIN_FILES: 3,
  MAX_FILE_MB: 60,
};
