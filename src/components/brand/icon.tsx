import React, { memo } from "react";

export type IconName =
  | "home"
  | "about"
  | "history"
  | "install"
  | "language"
  | "camera"
  | "upload"
  | "gallery"
  | "leaf"
  | "fruit"
  | "check"
  | "close"
  | "scan"
  | "camera-outline"
  | "sparkle"
  | "clipboard-check"
  | "arrow-right"
  | "chevron-right"
  | "chevron-down"
  | "search"
  | "filter"
  | "trash"
  | "android"
  | "phone"
  | "browser"
  | "menu";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  className?: string;
  fill?: string;
  strokeWidth?: number | string;
}

// FontAwesome 6 paths, all on a 640x640 viewBox
const FA_PATHS: Record<string, string> = {
  home: "M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z",
  about:
    "M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z",
  history:
    "M320 64C205.1 64 107.1 133 65.3 231.7L33.9 200.3C24.6 190.9 9.4 190.9 0 200.3C-9.4 209.6 -9.4 224.8 0 234.1L79.9 314.1C89.3 323.4 104.5 323.4 113.9 314.1L193.9 234.1C203.2 224.8 203.2 209.6 193.9 200.3C184.5 190.9 169.3 190.9 160 200.3L127.3 233.1C160.2 161.7 233.6 112 320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C224.8 528 145.2 464 120.4 376.6C115.8 360.3 98.9 350.6 82.6 355.2C66.3 359.8 56.6 376.7 61.2 393C94.7 511.5 202.9 600 320 600C474.6 600 600 474.6 600 320C600 165.4 474.6 64 320 64zM320 192C306.7 192 296 202.7 296 216L296 320C296 326.4 298.5 332.5 303 337L367 401C376.4 410.4 391.6 410.4 400.9 401C410.3 391.6 410.3 376.4 400.9 367L344 310.1L344 216C344 202.7 333.3 192 320 192z",
  install:
    "M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z",
  language:
    "M192 64C209.7 64 224 78.3 224 96L224 128L352 128C369.7 128 384 142.3 384 160C384 177.7 369.7 192 352 192L342.4 192L334 215.1C317.6 260.3 292.9 301.6 261.8 337.1C276 345.9 290.8 353.7 306.2 360.6L356.6 383L418.8 243C423.9 231.4 435.4 224 448 224C460.6 224 472.1 231.4 477.2 243L605.2 531C612.4 547.2 605.1 566.1 589 573.2C572.9 580.3 553.9 573.1 546.8 557L526.8 512L369.3 512L349.3 557C342.1 573.2 323.2 580.4 307.1 573.2C291 566 283.7 547.1 290.9 531L330.7 441.5L280.3 419.1C257.3 408.9 235.3 396.7 214.5 382.7C193.2 399.9 169.9 414.9 145 427.4L110.3 444.6C94.5 452.5 75.3 446.1 67.4 430.3C59.5 414.5 65.9 395.3 81.7 387.4L116.2 370.1C132.5 361.9 148 352.4 162.6 341.8C148.8 329.1 135.8 315.4 123.7 300.9L113.6 288.7C102.3 275.1 104.1 254.9 117.7 243.6C131.3 232.3 151.5 234.1 162.8 247.7L173 259.9C184.5 273.8 197.1 286.7 210.4 298.6C237.9 268.2 259.6 232.5 273.9 193.2L274.4 192L64.1 192C46.3 192 32 177.7 32 160C32 142.3 46.3 128 64 128L160 128L160 96C160 78.3 174.3 64 192 64zM448 334.8L397.7 448L498.3 448L448 334.8z",
  camera:
    "M257.1 96C238.4 96 220.9 105.4 210.5 120.9L184.5 160L128 160C92.7 160 64 188.7 64 224L64 480C64 515.3 92.7 544 128 544L512 544C547.3 544 576 515.3 576 480L576 224C576 188.7 547.3 160 512 160L455.5 160L429.5 120.9C419.1 105.4 401.6 96 382.9 96L257.1 96zM250.4 147.6C251.9 145.4 254.4 144 257.1 144L382.8 144C385.5 144 388 145.3 389.5 147.6L422.7 197.4C427.2 204.1 434.6 208.1 442.7 208.1L512 208.1C520.8 208.1 528 215.3 528 224.1L528 480.1C528 488.9 520.8 496.1 512 496.1L128 496C119.2 496 112 488.8 112 480L112 224C112 215.2 119.2 208 128 208L197.3 208C205.3 208 212.8 204 217.3 197.3L250.5 147.5zM320 448C381.9 448 432 397.9 432 336C432 274.1 381.9 224 320 224C258.1 224 208 274.1 208 336C208 397.9 258.1 448 320 448zM256 336C256 300.7 284.7 272 320 272C355.3 272 384 300.7 384 336C384 371.3 355.3 400 320 400C284.7 400 256 371.3 256 336z",
};

/**
 * Outline icons that share the 24x24 stroke wrapper below. Only the inner shapes
 * differ, so they live in a map instead of one branch each. Every entry inherits
 * stroke="currentColor" and the caller's strokeWidth, so a call site sets colour
 * through the surrounding text colour and weight through the prop. Nothing here
 * hardcodes either.
 */
const STROKE_24_SHAPES: Partial<Record<IconName, React.ReactNode>> = {
  android: (
    <>
      <path d="m7 4-2-3m12 3 2-3M4 11a8 8 0 0116 0v1H4zM6 12v7h12v-7M8 19v3m8-3v3M3 14v4m18-4v4" />
      <path d="M8 8h.01M16 8h.01" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10 5h4m-3 14h2" />
    </>
  ),
  browser: (
    <>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M2 8h20M6 5.5h.01M9 5.5h.01M6 13h12M6 17h8" />
    </>
  ),
  menu: (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  "chevron-right": <path d="m9 5 7 7-7 7" />,
  "chevron-down": <path d="m7 10 5 5 5-5" />,
  search: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="m15 15 6 6" />
    </>
  ),
  filter: (
    <>
      <path d="M4 7h3m4 0h9M4 17h9m4 0h3" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="17" r="2" />
    </>
  ),
  trash: (
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  ),
  // Camera viewfinder. Kept separate from the filled FontAwesome `camera` glyph
  // above, which has a different weight and viewBox.
  "camera-outline": (
    <>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  // Radiating sparkle, used for the on-device AI step.
  sparkle: (
    <>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // Clipboard with a check, used for the results step.
  "clipboard-check": (
    <>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </>
  ),
  // Right-pointing arrow. Rotate it with a class for a vertical flow.
  "arrow-right": (
    <>
      <path d="M5 12h12" />
      <path d="M13 7l5 5-5 5" />
    </>
  ),
};

export const Icon = memo(function Icon({
  name,
  size = 20,
  className = "",
  fill = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) {
  if (name === "scan") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <path d="M2 7V2h5M17 2h5v5M22 17v5h-5M7 22H2v-5" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "leaf" || name === "fruit" || name === "check") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {name === "leaf" ? (
          <>
            <path d="M20 4C12 4 5 7.5 5 14c0 3.5 2.5 6 6 6 6.5 0 9-7 9-16Z" />
            <path d="M4 20c3-4 6-6 11-9" />
          </>
        ) : name === "fruit" ? (
          <>
            <path d="M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
            <path d="M12 7c0-2 1-3.5 3.5-4M14.5 3H18" />
          </>
        ) : (
          <path d="m5 12 4.5 4.5L19 7" />
        )}
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    );
  }

  if (name === "gallery") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }

  const strokeShape = STROKE_24_SHAPES[name];
  if (strokeShape) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {strokeShape}
      </svg>
    );
  }

  const path = FA_PATHS[name] || FA_PATHS.home;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 640 640"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d={path} />
    </svg>
  );
});
