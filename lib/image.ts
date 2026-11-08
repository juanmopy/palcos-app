import heic2any from "heic2any";

const MAX_IMAGE_SIDE = 1600;

export async function prepareReceipt(file: File) {
  let source = file;
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.hei[cf]$/i.test(file.name)
  ) {
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.8,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    source = new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
    });
  }

  if (!source.type.startsWith("image/")) {
    return source;
  }

  const bitmap = await createImageBitmap(source);
  const scale = Math.min(
    1,
    MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8),
  );
  if (!blob) {
    throw new Error("No se pudo preparar el comprobante.");
  }

  return new File([blob], `${source.name.replace(/\.[^.]+$/, "")}.jpg`, {
    type: "image/jpeg",
  });
}
