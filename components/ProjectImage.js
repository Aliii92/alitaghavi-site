"use client";
import Image from "next/image";
import { useState } from "react";
import { getImagePlaceholder } from "../lib/get-image-src.js";
export default function ProjectImage({ src = "", alt = "", className = "" }) {
  const [failedSrc, setFailedSrc] = useState("");
  const imageSrc = !src || failedSrc === src ? getImagePlaceholder() : src;
  return <Image className={className} src={imageSrc} alt={alt} width={900} height={600}
    sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
    unoptimized={!imageSrc.startsWith("/")} onError={() => setFailedSrc(src)} />;
}
