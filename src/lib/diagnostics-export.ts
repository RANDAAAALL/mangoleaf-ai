import { isAndroidBuild, nativeRequest } from "@/lib/native-bridge";

/** Android saves through its document picker; browsers keep their normal Blob download. */
export async function downloadDiagnosticLog(text: string) {
  if (isAndroidBuild()) {
    const completed = await nativeRequest<boolean>(
      "diagnostics.export",
      { text },
      120_000,
    );
    if (completed !== true)
      throw new Error("Diagnostic export did not complete.");
    return;
  }
  let url: string | undefined;
  let link: HTMLAnchorElement | undefined;
  try {
    url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    link = document.createElement("a");
    link.href = url;
    link.download = `MangoLeafAI-diagnostics-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
  } finally {
    link?.remove();
    // Give the browser time to consume the download before releasing its URL.
    if (url) {
      const downloadUrl = url;
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    }
  }
}
