# Camera+ Manual Test Checklist



## Permissions

- [ ] First run, grant Camera + Photos permissions when prompted.

- [ ] Deny Photos read permission (Android/Expo Go) and confirm Album shows fallback banner.

- [ ] Re-open app after changing permissions in system settings; tap "Retry read" and confirm device album loads (if OS allows).



## Capture & Edit

- [ ] Open Camera+, take a photo (ensure capture button is visible and tappable).

- [ ] Photo appears in Album (fallback list or device album depending on permission).

- [ ] Pick any photo, switch between `none | night | thermal | tint`.

- [ ] Adjust strength slider; preview updates instantly.



## Export

- [ ] Tap Export; spinner shows; success toast appears within 12s.

- [ ] A copy is saved to gallery (and to album "NabhanCamera" when read permission is available).

- [ ] Export timeout produces a friendly error and spinner stops.



## History

- [ ] After editing, visit Details → entry appears with effect/strength/timestamp.

- [ ] Long-press deletes a single history record.

- [ ] History persists after app restart.



## Robustness

- [ ] No duplicate key warnings in lists.

- [ ] Album screen does not spam alerts on mount; shows non-blocking info instead.

- [ ] Editor "Back" returns to Album (not Index).

