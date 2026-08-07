import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// --- Sub-Component: Scene 1 - The Problem Hook (0 - 7s) ---
function Scene1Problem() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 180, 210], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 210], [0.95, 1.05]);

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${scale})`,
        backgroundColor: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 72, marginBottom: 20 }}>🌾 🥭 🍂</div>
      <div
        style={{
          fontSize: 24,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#f43f5e",
          fontWeight: 800,
          marginBottom: 16,
        }}
      >
        The Agricultural Challenge
      </div>
      <h1
        style={{
          fontSize: 56,
          fontWeight: 900,
          textAlign: "center",
          maxWidth: 1100,
          lineHeight: 1.2,
          color: "#ffffff",
        }}
      >
        Mango Leaf Diseases Destroy Up To <span style={{ color: "#f43f5e" }}>40%</span> of Annual Harvests
      </h1>
      <p
        style={{
          fontSize: 28,
          color: "#94a3b8",
          marginTop: 24,
          maxWidth: 900,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Remote farms lack immediate agricultural expert access and internet connectivity.
      </p>
    </AbsoluteFill>
  );
}

// --- Sub-Component: Scene 2 - Introducing MangoLeaf AI (7 - 16s) ---
function Scene2Introduction() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [0, 20, 240, 270], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          transform: `scale(${titleSpring})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 20,
            padding: "8px 24px",
            borderRadius: 999,
            border: "1px solid #14b8a6",
            color: "#2dd4bf",
            backgroundColor: "rgba(20, 184, 166, 0.1)",
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Introducing Capstone Innovation
        </div>
        <h1
          style={{
            fontSize: 84,
            fontWeight: 900,
            background: "linear-gradient(to right, #34d399, #2dd4bf, #38bdf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          MangoLeaf AI
        </h1>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#cbd5e1" }}>
          Offline-First Smart Diagnostic PWA
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 32,
          marginTop: 64,
          opacity: interpolate(frame, [30, 60], [0, 1]),
        }}
      >
        <div
          style={{
            padding: "24px 36px",
            borderRadius: 24,
            background: "#0f172a",
            border: "1px solid #1e293b",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡ 0ms</div>
          <div style={{ fontSize: 18, color: "#94a3b8" }}>Cloud Latency</div>
        </div>
        <div
          style={{
            padding: "24px 36px",
            borderRadius: 24,
            background: "#0f172a",
            border: "1px solid #1e293b",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>📶 100%</div>
          <div style={{ fontSize: 18, color: "#94a3b8" }}>Offline Capable</div>
        </div>
        <div
          style={{
            padding: "24px 36px",
            borderRadius: 24,
            background: "#0f172a",
            border: "1px solid #1e293b",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎯 98.4%</div>
          <div style={{ fontSize: 18, color: "#94a3b8" }}>Model Accuracy</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// --- Sub-Component: Scene 3 - On-Device AI Architecture (16 - 27s) ---
function Scene3Architecture() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 300, 330], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scanPulse = (frame % 30) / 30;

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        gap: 80,
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {/* Mock Phone Container */}
      <div
        style={{
          width: 360,
          height: 640,
          borderRadius: 40,
          border: "4px solid #334155",
          backgroundColor: "#090d16",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(20, 184, 166, 0.25)",
        }}
      >
        <div
          style={{
            width: 140,
            height: 24,
            backgroundColor: "#1e293b",
            borderRadius: 12,
            position: "absolute",
            top: 16,
          }}
        />

        {/* Pulse Scanner Ring */}
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: "3px solid #2dd4bf",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transform: `scale(${1 + scanPulse * 0.1})`,
          }}
        >
          <span style={{ fontSize: 64 }}>🍃</span>
        </div>

        <div
          style={{
            marginTop: 32,
            padding: "8px 20px",
            background: "rgba(45, 212, 191, 0.15)",
            border: "1px solid #2dd4bf",
            borderRadius: 16,
            color: "#2dd4bf",
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Diagnosis: Anthracnose (98%)
        </div>
      </div>

      {/* Tech Breakdown Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 650 }}>
        <h2 style={{ fontSize: 44, fontWeight: 900, margin: 0, color: "#38bdf8" }}>
          On-Device WebGL TensorFlow.js
        </h2>

        <div style={{ fontSize: 22, color: "#cbd5e1", lineHeight: 1.6 }}>
          • <strong>MobileNetV3 Architecture:</strong> Fine-tuned with two-stage transfer learning for high-accuracy crop diagnosis.
        </div>

        <div style={{ fontSize: 22, color: "#cbd5e1", lineHeight: 1.6 }}>
          • <strong>Hardware Accelerated:</strong> Executes directly on the smartphone GPU using compiled WebGL shaders.
        </div>

        <div style={{ fontSize: 22, color: "#cbd5e1", lineHeight: 1.6 }}>
          • <strong>Canvas Pre-Downscaling:</strong> Ultra-fast 224x224 processing prevents mobile memory strain.
        </div>
      </div>
    </AbsoluteFill>
  );
}

// --- Sub-Component: Scene 4 - Offline Sync & Guidelines (27 - 35s) ---
function Scene4SyncAndGuidelines() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 220, 240], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ fontSize: 52, fontWeight: 900, marginBottom: 48, color: "#f1f5f9" }}>
        Built for Local Farming Ecosystems
      </h2>

      <div style={{ display: "flex", gap: 48 }}>
        <div
          style={{
            width: 480,
            padding: 40,
            borderRadius: 32,
            background: "#0f172a",
            border: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 48 }}>🌐 ↔️ 📲</div>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: "#34d399", margin: 0 }}>
            Auto Offline-Online Sync
          </h3>
          <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
            Diagnostic logs save to local IndexedDB when offline and auto-sync to Supabase cloud storage when internet reconnects.
          </p>
        </div>

        <div
          style={{
            width: 480,
            padding: 40,
            borderRadius: 32,
            background: "#0f172a",
            border: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 48 }}>🗣️ 🇵🇭</div>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: "#38bdf8", margin: 0 }}>
            Bilingual Treatment Care
          </h3>
          <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
            Includes certified BAFS treatment action plans available in both English and Bisaya for local accessibility.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// --- Sub-Component: Scene 5 - Call to Action & Capstone Credits (35 - 40s) ---
function Scene5Outro() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 80, marginBottom: 16 }}>🥭</div>
      <h1
        style={{
          fontSize: 72,
          fontWeight: 900,
          background: "linear-gradient(to right, #34d399, #2dd4bf, #38bdf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: 0,
        }}
      >
        MangoLeaf AI
      </h1>
      <p style={{ fontSize: 26, color: "#94a3b8", marginTop: 16, marginBottom: 40 }}>
        Empowering Mango Farmers with On-Device Artificial Intelligence
      </p>

      <div
        style={{
          padding: "16px 36px",
          borderRadius: 999,
          background: "linear-gradient(to right, #10b981, #14b8a6)",
          color: "#020617",
          fontWeight: 900,
          fontSize: 22,
        }}
      >
        Capstone Project Presentation 2026
      </div>
    </AbsoluteFill>
  );
}

// --- Main Remotion Composition (40 seconds @ 30 FPS = 1200 frames) ---
export function MangoLeafPromo() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      {/* Scene 1: Problem Statement (0s - 7s = 210 frames) */}
      <Sequence from={1} durationInFrames={126}>
        <Scene1Problem />
      </Sequence>
      {/* Scene 2: Product Introduction (7s - 16s = 270 frames) */}
      <Sequence from={126} durationInFrames={126}>
        <Scene2Introduction />
      </Sequence>
      {/* Scene 3: On-Device AI Architecture (16s - 27s = 330 frames) */}
      <Sequence from={255} durationInFrames={139}>
        <Scene3Architecture />
      </Sequence>
      {/* Scene 4: Offline Sync & Guidelines (27s - 35s = 240 frames) */}
      <Sequence from={393} durationInFrames={133}>
        <Scene4SyncAndGuidelines />
      </Sequence>
      {/* Scene 5: Outro & Call to Action (35s - 40s = 150 frames) */}
      <Sequence from={525} durationInFrames={140}>
        <Scene5Outro />
      </Sequence>
    </AbsoluteFill>
  );
}
