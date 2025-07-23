import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // ✅ Ensure recordings folder exists
    const recordingsDir = path.join(process.cwd(), "public/recordings");
    await mkdir(recordingsDir, { recursive: true });

    // ✅ Convert Blob → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ Generate filename
    const fileName = `recording_${Date.now()}.webm`; // still webm since MediaRecorder outputs webm
    const fullFilePath = path.join(recordingsDir, fileName);

    // ✅ Save the file
    await writeFile(fullFilePath, buffer);

    // ✅ Instead of absolute path, return a PUBLIC path
    const publicUrl = `/recordings/${fileName}`;

    return NextResponse.json({ success: true, filePath: publicUrl });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
