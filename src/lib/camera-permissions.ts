import { Platform } from "react-native";

import * as MediaLibrary from "expo-media-library";

import { Camera, PermissionResponse } from "expo-camera";

export type MediaPerm = { canRead: boolean; canWrite: boolean };

export async function requestCameraPermission(): Promise<PermissionResponse> {
  return Camera.requestCameraPermissionsAsync();
}

export async function requestMediaPermission(): Promise<MediaPerm> {
  // iOS: one dialog covers read+write. Android + Expo Go: passing true requests write only.
  if (Platform.OS === "ios") {
    const p = await MediaLibrary.requestPermissionsAsync();
    return { canRead: p.granted, canWrite: p.granted };
  }
  const p = await MediaLibrary.requestPermissionsAsync(true);
  return { canRead: p.granted, canWrite: p.granted };
}

export const ALBUM = "NabhanCamera";
export const STORAGE_CAMERA_PREFS = "camera.prefs.v1";

