"use client";

import { useMemo, useState } from "react";
import { getImagePlaceholder } from "../lib/get-image-src.js";

export default function ProjectImage({ src = "", alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);
  const placeholder = getImagePlaceholder();
  const imageSrc = useMemo(() => (failed || !src ? placeholder : src), [failed, placeholder, src]);

  return (
    <img
      className={className}
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
