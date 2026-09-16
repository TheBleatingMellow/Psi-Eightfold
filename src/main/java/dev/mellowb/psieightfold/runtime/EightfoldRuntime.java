package dev.mellowb.psieightfold.runtime;

import java.util.LinkedHashSet;
import java.util.Set;

import vazkii.psi.api.spell.SpellContext;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellPiece;
import vazkii.psi.api.spell.param.ParamNumber;
import vazkii.psi.api.spell.piece.PieceTrick;

/**
 * Runtime hooks owned by Psi: Eightfold.
 *
 * This class deliberately uses only Psi's public/runtime types. It does not
 * contain copied Psi implementation code. Coremods call these helpers from
 * small injection points while the original Psi methods remain intact.
 */
public final class EightfoldRuntime {
    public static final String CONDITION = "psi.spellparam.condition";

    private EightfoldRuntime() {}

    public static void afterInitParams(SpellPiece piece) {
        if (piece instanceof PieceTrick && !piece.params.containsKey(CONDITION)) {
            piece.addParam(new ParamNumber(CONDITION, 0xFFFFFF, true, false));
        }
    }

    public static boolean shouldExecute(SpellPiece piece, SpellContext context) throws vazkii.psi.api.spell.SpellRuntimeException {
        if (!(piece instanceof PieceTrick)) {
            return true;
        }

        SpellParam<?> condition = piece.params.get(CONDITION);
        if (condition == null) {
            return true;
        }

        Object value = piece.getParamValue(context, condition);
        if (!(value instanceof Number number)) {
            return true;
        }

        double v = number.doubleValue();
        return v > -1.0 && v < 1.0;
    }

    /**
     * Metadata calculation cannot know runtime-only number values such as the
     * Loopcast index. Preserve Eightfold's established safe compile fallback.
     */
    public static Object evaluationFallback(SpellParam<?> param, Object value) {
        if (value != null) {
            return value;
        }
        return param instanceof ParamNumber ? Double.valueOf(1.0) : null;
    }

    public static Set<SpellParam.Side> expandSides(Set<SpellParam.Side> original) {
        LinkedHashSet<SpellParam.Side> sides = new LinkedHashSet<>(original);
        addSide(sides, "TOP_LEFT");
        addSide(sides, "TOP_RIGHT");
        addSide(sides, "BOTTOM_LEFT");
        addSide(sides, "BOTTOM_RIGHT");
        return sides;
    }

    private static void addSide(Set<SpellParam.Side> sides, String name) {
        try {
            sides.add(SpellParam.Side.valueOf(name));
        } catch (IllegalArgumentException ignored) {
            // Running without the enum transformer should degrade instead of
            // taking the whole client down during early loading.
        }
    }

    /** Returns null for vanilla sides so Psi's original implementation runs. */
    public static SpellParam.Side mapDiagonal(SpellParam.Side side, int operation) {
        String name = side.name();
        String result = switch (operation) {
            case 0 -> switch (name) { // opposite
                case "TOP_LEFT" -> "BOTTOM_RIGHT";
                case "TOP_RIGHT" -> "BOTTOM_LEFT";
                case "BOTTOM_LEFT" -> "TOP_RIGHT";
                case "BOTTOM_RIGHT" -> "TOP_LEFT";
                default -> null;
            };
            case 1 -> switch (name) { // vertical mirror
                case "TOP_LEFT" -> "BOTTOM_LEFT";
                case "TOP_RIGHT" -> "BOTTOM_RIGHT";
                case "BOTTOM_LEFT" -> "TOP_LEFT";
                case "BOTTOM_RIGHT" -> "TOP_RIGHT";
                default -> null;
            };
            case 2 -> switch (name) { // rotate CW, matching Psi coordinates
                case "TOP_LEFT" -> "BOTTOM_LEFT";
                case "TOP_RIGHT" -> "TOP_LEFT";
                case "BOTTOM_LEFT" -> "BOTTOM_RIGHT";
                case "BOTTOM_RIGHT" -> "TOP_RIGHT";
                default -> null;
            };
            case 3 -> switch (name) { // rotate CCW
                case "TOP_LEFT" -> "TOP_RIGHT";
                case "TOP_RIGHT" -> "BOTTOM_RIGHT";
                case "BOTTOM_LEFT" -> "TOP_LEFT";
                case "BOTTOM_RIGHT" -> "BOTTOM_LEFT";
                default -> null;
            };
            default -> null;
        };
        return result == null ? null : SpellParam.Side.valueOf(result);
    }

    public static boolean isDiagonal(SpellParam.Side side) {
        return side != null && side.ordinal() >= 5;
    }

    /** Parameter widgets 1-4 stay put; 5-8 occupy a second panel to the left. */
    public static int paramX(int vanillaX, int index) {
        return vanillaX - ((index >> 2) * 81);
    }

    public static int paramY(int vanillaY, int index) {
        return vanillaY - ((index >> 2) * 104);
    }

    /** UV origin for the Eightfold 64x64 connector-line sheet. */
    public static float connectorU(SpellParam.Side side) {
        return switch (side.name()) {
            case "RIGHT" -> 0.00f;
            case "LEFT" -> 0.25f;
            case "TOP" -> 0.50f;
            case "BOTTOM" -> 0.75f;
            case "TOP_LEFT" -> 0.00f;
            case "TOP_RIGHT" -> 0.25f;
            case "BOTTOM_LEFT" -> 0.50f;
            case "BOTTOM_RIGHT" -> 0.75f;
            default -> 0.00f;
        };
    }

    public static float connectorV(SpellParam.Side side) {
        return switch (side.name()) {
            case "TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT" -> 0.25f;
            default -> 0.00f;
        };
    }
}
