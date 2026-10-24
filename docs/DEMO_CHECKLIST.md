# Core demo checklist

## Before implementation is called complete

- [ ] Host opens without developer tools.
- [ ] Host creates a readable room code.
- [ ] QR code opens the correct controller URL.
- [ ] Four controllers can join.
- [ ] Player colors are unique and match the host pieces.
- [ ] Host can start the room.
- [ ] Correct phone displays `Your turn`.
- [ ] Wrong phone cannot roll.
- [ ] One shake creates exactly one roll.
- [ ] Touch Roll button creates exactly one roll.
- [ ] Dice result is between 1 and 6.
- [ ] Correct piece moves the correct number of tiles.
- [ ] Movement wraps around the board.
- [ ] Turn advances to the next connected player.
- [ ] Five complete player rotations succeed.
- [ ] Refreshing a phone restores its player.
- [ ] A duplicate request ID cannot cause a second roll.
- [ ] A disconnected active player does not freeze the room forever.
- [ ] Host restart returns every piece to the starting tile.

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
