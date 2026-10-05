// Green for healthy, red for any disease, grey for anything else, which in
// practice is the Uncertain result.
export const getBadgeStyles = (diseaseName: string) => {
  const name = diseaseName.toLowerCase();
  if (name.includes("healthy")) {
    return "bg-[#15803d] text-[#F9F6EE] border-[#15803d]";
  }
  if (
    name.includes("anthracnose") ||
    name.includes("canker") ||
    name.includes("black") ||
    name.includes("sooty") ||
    name.includes("scab")
  ) {
    return "bg-rose-700 text-white border-rose-700";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};
