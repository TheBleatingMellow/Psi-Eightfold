# Release Audit

Target: Psi: Eightfold 0.1.0-alpha.1 for Minecraft 1.21.1 / NeoForge.

## Packaging audit

The release candidate was checked for bundled third-party namespaces. It contains none of the following:

- `vazkii/`
- `gdavid/`
- `com/moratan251/`
- `virtuoel/`
- `assets/psi/`
- `assets/psionicutilities/`
- `assets/psitweaks/`
- `data/psi/`
- `data/psionicutilities/`
- `data/psitweaks/`

All shipped Java classes are under `dev/mellowb/psieightfold/`. All shipped textures are under `assets/psieightfold/`.

## Script checks

All five coremod scripts pass JavaScript syntax validation:

- `coremods/eightfold.js`
- `coremods/psionicutilities.js`
- `coremods/color.js`
- `coremods/circle_orientation.js`
- `coremods/blaze_ball.js`

## Target checks

Every class and method descriptor targeted by the release hooks was checked against the exact tested JARs:

- Psi 1.21.1-110
- Psionic Utilities 1.21-1.4
- PsiTweaks 1.21.1-0.10.8-hotfix

The checked targets were present.

## Limitations

Static validation cannot prove that a Minecraft mod has zero runtime bugs. The exact release JAR should still be smoke-tested in a real NeoForge client before public upload.
