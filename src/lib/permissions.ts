import { Platform } from "react-native";

import * as MediaLibrary from "expo-media-library";

import { Camera } from "expo-camera";



export type MediaPerm = { read: boolean; write: boolean };



export async function ensureCameraPermission(): Promise<boolean> {

  const res = await Camera.requestCameraPermissionsAsync();

  return !!res.granted;

}



/**

 * Ask for Photos permission (write capability for export).

 * On iOS this shows the single Photos dialog.

 * On Android/Expo Go, this requests what's available.

 */

export async function askPhotoWriteOnly(): Promise<boolean> {

  const res = await MediaLibrary.requestPermissionsAsync();

  return !!res.granted;

}



/** Ask for full Photos READ (user may still deny). */

export async function askPhotoRead(): Promise<boolean> {

  const res = await MediaLibrary.requestPermissionsAsync();

  return !!res.granted;

}



/** Current permission snapshot without requesting AUDIO or VIDEO scopes. */

export async function getPhotoPerm(): Promise<MediaPerm> {

  try {

    const p = await MediaLibrary.getPermissionsAsync(); // no options -> no AUDIO

    // When accessPrivileges === "none" we treat as no READ

    const read = !!p.granted && p.accessPrivileges !== "none";

    const write = !!p.granted; // write is implied when Photos granted

    return { read, write };

  } catch {

    return { read: false, write: false };

  }

}

