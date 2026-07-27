# GPS Trail Phase 2B — Time Scrubber Playback

> **Status:** Implemented (session 2026-07-25)  
> **Scope:** Detail Sales Cost Rute GPS Aktual — Play/Pause, speed, slider, truck marker, progress path.

## Done

1. FE-only in `DetailSalesCost.vue`
2. Scrub by point index; speeds 1×/2×/4× (400/200/100 ms)
3. Progress polyline + truck circleMarker on always-on playback layer
4. Full trail muted (opacity 0.35) when playback available
5. Auto-pause at end; scrub pauses play; timer cleared on destroy

## Out of scope

- Lat/lon interpolation between points  
- Auto-pan follow truck  
- Print map SPK  
