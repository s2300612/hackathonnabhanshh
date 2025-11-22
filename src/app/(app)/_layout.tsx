/* eslint-disable react/no-unstable-nested-components */
import { Link, SplashScreen, Tabs } from 'expo-router';
import React, { useCallback, useEffect } from 'react';

import { Pressable, Text } from '@/components/ui';
import { useAuth } from '@/lib';
import { Ionicons } from '@expo/vector-icons';
import StoresProvider from '@/stores';
import { requestCameraPermission, requestMediaPermission } from "@/lib/camera-permissions";

export default function TabLayout() {
  const { status } = useAuth();
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);
  useEffect(() => {
    if (status !== 'idle') {
      setTimeout(() => {
        hideSplash();
      }, 1000);
    }
  }, [hideSplash, status]);

  useEffect(() => {
    // Ask only what we need up front: camera and write-only export.
    // READ will be requested later only when the user taps "Retry Read".
    requestCameraPermission();
    requestMediaPermission();
  }, []);

  
  return (
    <StoresProvider>
      <Tabs initialRouteName="camera-advanced" screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="album"
        options={{
          title: 'Album',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera-advanced"
        options={{
          title: 'Camera+',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera-settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="details"
        options={{
          title: 'Details',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="photo"
        options={{ href: null }}
      /> {/* hidden photo details screen */}
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      /> {/* hidden - Sign Out moved to camera-settings */}
      <Tabs.Screen
        name="style"
        options={{ href: null }}
      /> {/* hidden - accessed via Album buttons */}
      <Tabs.Screen
        name="process"
        options={{ href: null }}
      /> {/* hidden - accessed via Album buttons */}
      </Tabs>
    </StoresProvider>
  );
}

const CreateNewPostLink = () => {
  return (
    <Link href={"/feed/add-post" as any} asChild>
      <Pressable>
        <Text className="px-3 text-primary-300">Create</Text>
      </Pressable>
    </Link>
  );
};
