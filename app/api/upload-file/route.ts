import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs"; // Ensure Node.js runtime for file uploads

// Helper function to determine resource type based on file type
function getResourceType(fileType: string): string {
  if (fileType.startsWith("image/")) {
    return "image";
  } else if (
    fileType.includes("pdf") ||
    fileType.includes("document") ||
    fileType.includes("text")
  ) {
    return "raw";
  } else if (fileType.includes("video")) {
    return "video";
  } else if (fileType.includes("audio")) {
    return "video"; // Cloudinary uses 'video' for audio files
  } else {
    return "raw"; // Default to raw for other file types
  }
}

// Helper function to get file extension
function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

// Helper function to generate the correct URL for different resource types
function generateFileUrl(result: any, resourceType: string): string {
  if (resourceType === "raw") {
    // For raw files, use the secure_url or generate a direct download URL
    return result.secure_url || result.url;
  } else {
    // For images and videos, use the standard URL
    return result.secure_url || result.url;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine resource type and format
    const resourceType = getResourceType(file.type);
    const fileExtension = getFileExtension(file.name);

    console.log("Uploading file:", {
      name: file.name,
      type: file.type,
      size: file.size,
      resourceType,
      extension: fileExtension,
    });

    // Prepare upload options based on file type
    const uploadOptions: any = {
      resource_type: resourceType,
      public_id: `chat-files/${Date.now()}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`,
      // Ensure files are publicly accessible
      access_mode: "public",
      // For raw files, we need to specify the format explicitly
      format: fileExtension || "pdf",
    };

    // Add specific options for different file types
    if (resourceType === "image") {
      uploadOptions.format = fileExtension || "auto";
      // Remove format override for images since we set it above
      delete uploadOptions.format;
    } else if (resourceType === "raw") {
      // For raw files, ensure they're accessible and properly formatted
      uploadOptions.asset_folder = "documents";
      uploadOptions.format = fileExtension || "pdf";
      // Force public access for raw files
      uploadOptions.access_mode = "public";
      // Add flags to ensure proper handling
      uploadOptions.flags = "attachment";
    } else if (resourceType === "video") {
      uploadOptions.format = fileExtension || "mp4";
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("Upload successful:", result);
            resolve(result);
          }
        })
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      result: uploadResult,
      fileUrl: generateFileUrl(uploadResult, resourceType),
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        resourceType,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
