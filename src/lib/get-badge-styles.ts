// Badge color mapping matching Figma design
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
    return "bg-[#FF2C2C] text-[#F9F6EE] border-[#FF2C2C]";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};
