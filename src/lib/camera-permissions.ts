import { Platform } from "react-native";

import * as MediaLibrary from "expo-media-library";

import { Camera, PermissionResponse } from "expo-camera";
import { cameraStore } from "@/stores";



export type MediaPerm = { canRead: boolean; canWrite: boolean };



export async function requestCameraPermission(): Promise<PermissionResponse> {

  return Camera.requestCameraPermissionsAsync();

}



/**

 * On Android in Expo Go, we must NOT request granular read permissions

 * (images/video/audio) because Expo Go's manifest may not declare AUDIO.

 * We only request WRITE so saves work; reads are guarded.

 */

export async function requestMediaPermission(): Promise<MediaPerm> {

  try {

    if (Platform.OS === "ios") {

      const p = await MediaLibrary.requestPermissionsAsync(); // read+write

      return { canRead: p.granted, canWrite: p.granted };

    }

    // ANDROID: WRITE ONLY (boolean true == writeOnly)

    const p = await MediaLibrary.requestPermissionsAsync(true);

    return { canRead: false, canWrite: !!p.granted };

  } catch {

    return { canRead: false, canWrite: false };

  }

}



/** Return current status without requesting extra scopes */

export async function getMediaPermission(): Promise<MediaPerm> {

  try {

    if (Platform.OS === "ios") {

      const p = await MediaLibrary.getPermissionsAsync();

      return { canRead: p.granted, canWrite: p.granted };

    }

    // In Expo Go we treat read as false; write reflects current grant.

    const p = await MediaLibrary.getPermissionsAsync(true);

    return { canRead: false, canWrite: !!p.granted };

  } catch {

    return { canRead: false, canWrite: false };

  }

}



export const ALBUM = "NabhanCamera";
export const STORAGE_CAMERA_PREFS = "camera.prefs.v1";

export async function pushFallback(uri: string) {
  try {
    cameraStore.pushShot(uri);
  } catch (e) {
    console.warn("pushFallback error", e);
  }
}
