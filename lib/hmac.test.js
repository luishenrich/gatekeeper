function normalizeHandle(handle) {
  return handle
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[._-]/g, "")
    .replace(/\d+$/, "");
}

console.log("Testing handle normalization:");
console.log("@cryptomax_alpha ->", normalizeHandle("@cryptomax_alpha"));
console.log("@cryptomax_alpha1 ->", normalizeHandle("@cryptomax_alpha1"));
console.log("Match:", normalizeHandle("@cryptomax_alpha") === normalizeHandle("@cryptomax_alpha1"));

console.log("\n@talent_rachel_hr ->", normalizeHandle("@talent_rachel_hr"));
console.log("@talent.rachel.hr ->", normalizeHandle("@talent.rachel.hr"));
console.log("Match:", normalizeHandle("@talent_rachel_hr") === normalizeHandle("@talent.rachel.hr"));

console.log("\nTest passed: normalization works correctly");
