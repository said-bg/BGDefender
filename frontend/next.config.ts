import type { NextConfig } from "next";
import path from "path";
import {
  courseCoverLocalImagePatterns,
  courseCoverRemoteImagePatterns,
} from "./src/config/courseCoverImageSources";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  images: {
    localPatterns: courseCoverLocalImagePatterns,
    remotePatterns: courseCoverRemoteImagePatterns,
  },
};

export default nextConfig;
