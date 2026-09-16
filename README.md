# Psi: Eightfold

Psi: Eightfold is an independent NeoForge addon for [Psi](https://github.com/VazkiiMods/Psi), focused on making spell programming more flexible and expressive.

Eightfold is **not a fork of Psi** and does not bundle Psi classes or assets. Psi is installed separately as a required dependency. Eightfold applies its own compatibility hooks at runtime and ships only Eightfold-owned code and artwork.

## Current target

- Minecraft 1.21.1
- NeoForge 21.1.207+
- Psi 1.21.1-110
- Psionic Utilities 1.21-1.4

## Dependencies

### Required
- Psi 1.21.1-110
- Psionic Utilities 1.21-1.4

### Recommended
- PsiTweaks 1.21.1-0.10.8-hotfix

### Optional
- Pehkui 3.x, enables entity scale pieces

Psi has its own dependencies, including Patchouli.

## Features

- Eight-direction spell connections, including diagonals
- Diagonal click-and-drag routing through Psionic Utilities
- Four isolated Cross Connector channels
- Dynamic Number inputs where Psi previously required constants
- Optional Condition input on Tricks
- Two-column parameter UI for inputs 5 through 8
- Teleport Entity
- Launch Arrow using vanilla Minecraft arrows
- Entity name and scoreboard-tag utilities
- Number base conversion utilities
- CAD color override and per-circle color support
- Improved Conjure Circle look-direction handling
- Optional Pehkui entity scaling
- Optional enhanced PsiTweaks Blaze Ball controls for Position, Direction, Speed, Power, and Size

## Building

This project uses Java 21 and NeoForge ModDevGradle.

```bash
./gradlew build
```

If you do not use a Gradle wrapper, use a Gradle version supported by the configured ModDevGradle release.

The build file pulls the tested Psi 1.21.1-110 artifact from Curse Maven. Optional integrations are runtime hooks, so their classes are not bundled into Eightfold.

## Runtime compatibility approach

Eightfold uses small ASM/coremod hooks against the separately installed mods. These hooks alter behavior at runtime, but the Eightfold JAR does not redistribute classes from Psi, PsiTweaks, Psionic Utilities, or Pehkui.

The current compatibility hooks are intentionally version-scoped. Do not assume compatibility with a different Psi build without testing it first.

## Credits

Created by **MellowB**.

Special thanks to **jolteon my beloved**.

Psi was created by Vazkii and contributors. Psi is a required dependency but is not distributed with this project.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for compatibility credits.

## License

Psi: Eightfold's own code and assets are licensed under the MIT License. Third-party projects remain under their own licenses and are not redistributed by this repository.
