import { getImageSrc } from "./get-image-src.js";

export function resolveProjectImage(project = {}) {
  return getImageSrc(project, "");
}
