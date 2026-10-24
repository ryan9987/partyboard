# Core demo checklist

## Before implementation is called complete

- [x] Host opens without developer tools. (Browser verified.)
- [x] Host creates a readable room code. (Browser verified.)
- [x] QR code opens the correct controller URL. (Browser verified.)
- [x] Four controllers can join. (Socket integration verified; physical-device proof remains below.)
- [x] Player colors are unique and match the host pieces. (Schema/server/host mapping verified.)
- [x] Host can start the room. (Browser verified.)
- [x] Correct phone displays `Your turn`. (Browser verified.)
- [x] Wrong phone cannot roll. (Server integration verified.)
- [ ] One shake creates exactly one roll.
- [x] Touch Roll button creates exactly one roll. (Browser and integration verified.)
- [x] Dice result is between 1 and 6. (Server verified.)
- [x] Correct piece moves the correct number of tiles. (Browser and integration verified.)
- [x] Movement wraps around the board. (Board/server verified.)
- [x] Turn advances to the next connected player. (Browser and integration verified.)
- [x] Five complete player rotations succeed. (Four-controller socket integration verified.)
- [x] Refreshing a phone restores its player. (Socket integration verified.)
- [x] A duplicate request ID cannot cause a second roll. (Server and socket integration verified.)
- [x] A disconnected active player does not freeze the room forever. (Server verified.)
- [x] Host restart returns every piece to the starting tile. (Server verified.)

## Device matrix

- [ ] Intended presentation laptop and browser
- [ ] At least one iPhone/Safari controller
- [ ] At least one Android/Chrome controller
- [ ] Four simultaneous controllers or a documented substitute
- [ ] Actual venue-style Wi-Fi or phone hotspot
- [ ] Deployed HTTPS environment

## Presentation backup

- [ ] Touch fallback confirmed on every phone
- [ ] Host has a visible restart control
- [ ] Known-good deployed version is tagged
- [ ] Successful demonstration is screen-recorded
- [ ] Charging cables and power adapters are packed
