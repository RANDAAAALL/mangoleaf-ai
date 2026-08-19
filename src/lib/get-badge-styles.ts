// Badge color mapping matching Figma design
export const getBadgeStyles = (diseaseName: string) => {
  const name = diseaseName.toLowerCase();
  if (name.includes("healthy")) {
    return "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]";
  }
  if (name.includes("anthracnose") || name.includes("canker") || name.includes("black")) {
    return "bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]";
  }
  if (name.includes("sooty")) {
    return "bg-[#fce7f3] text-[#9d174d] border-[#fbcfe8]";
  }
  if (name.includes("scab")) {
    return "bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};
