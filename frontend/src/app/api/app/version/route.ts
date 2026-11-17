import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    latestVersion: "1.1.0",
    latestVersionCode: 2,
    minSupportedVersion: "1.0.0",
    downloadUrl: "/downloads/sokolink.apk",
    apkFileName: "sokolink.apk",
    releasedAt: "2026-11-17",
    releaseNotes: [
      "Added Kenyan SME KYC verification & seller compliance",
      "Enhanced security & protected merchant product posting",
      "Upgraded rider dispatch and delivery tracking",
      "Modernized marketplace navigation & checkout experience",
    ],
  });
}
