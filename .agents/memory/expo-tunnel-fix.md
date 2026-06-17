---
name: Expo Tunnel Underscore Fix
description: Android fails to connect to Expo tunnel when subdomain has underscores
---

## Rule
Set `EXPO_TUNNEL_SUBDOMAIN=zentramapp` in the `dev` script of `artifacts/hilla-connect-v2/package.json`.

## Why
The auto-generated tunnel URL `a5cr_zc-anonymous-8080.exp.direct` contains underscores which violate STD 3 ASCII rules. Android's DNS resolver rejects the URL with "Invalid input to toASCII". Custom subdomain `zentramapp` produces `zentramapp.ngrok.io` which is a valid hostname.

## How to apply
The dev script already has this fix applied. If it reverts, add `EXPO_TUNNEL_SUBDOMAIN=zentramapp` before `pnpm exec expo start`.
