package dev.mellowb.psieightfold.spell.util;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

/**
 * Hex color and CAD lookup helpers.
 *
 * Minecraft classes are accessed reflectively so Pehkui/Psi integration code
 * stays isolated from the small spell-piece classes and optional paths can
 * fail gracefully when their target is absent.
 */
public final class ColorOps {
    private static final int RGB_MASK = 0xFFFFFF;

    private ColorOps() {}

    public static int parseHexColor(String input) {
        if (input == null) throw new IllegalArgumentException("null color");
        String s = input.trim();
        if (s.length() >= 2) {
            char first = s.charAt(0);
            char last = s.charAt(s.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                s = s.substring(1, s.length() - 1).trim();
            }
        }
        if (s.startsWith("#")) s = s.substring(1);
        if (s.startsWith("0x") || s.startsWith("0X")) s = s.substring(2);
        if (s.length() == 3) {
            s = "" + s.charAt(0) + s.charAt(0)
                    + s.charAt(1) + s.charAt(1)
                    + s.charAt(2) + s.charAt(2);
        }
        if (s.length() != 6) throw new IllegalArgumentException("Invalid hex color: " + input);
        for (int i = 0; i < 6; i++) {
            if (Character.digit(s.charAt(i), 16) < 0) {
                throw new IllegalArgumentException("Invalid hex color: " + input);
            }
        }
        return Integer.parseInt(s, 16) & RGB_MASK;
    }

    private static Class<?> componentTypeClass() throws Exception {
        return Class.forName("net.minecraft.core.component.DataComponentType");
    }

    private static Object dyedColorType() throws Exception {
        return Class.forName("net.minecraft.core.component.DataComponents")
                .getField("DYED_COLOR").get(null);
    }

    private static Class<?> dyedColorClass() throws Exception {
        return Class.forName("net.minecraft.world.item.component.DyedItemColor");
    }

    private static Object newDyedColor(int rgb) throws Exception {
        Class<?> clazz = dyedColorClass();
        rgb &= RGB_MASK;
        try {
            return clazz.getConstructor(int.class, boolean.class).newInstance(rgb, false);
        } catch (NoSuchMethodException ignored) {
            return clazz.getConstructor(int.class).newInstance(rgb);
        }
    }

    public static Integer getStackColorOverride(Object stack) {
        if (stack == null) return null;
        try {
            Object type = dyedColorType();
            Method get = stack.getClass().getMethod("get", componentTypeClass());
            Object value = get.invoke(stack, type);
            if (value == null) return null;
            Object rgb = value.getClass().getMethod("rgb").invoke(value);
            return ((Number) rgb).intValue() & RGB_MASK;
        } catch (Throwable ignored) {
            return null;
        }
    }

    public static void setStackColorOverride(Object stack, int rgb) throws Exception {
        if (stack == null) throw new IllegalArgumentException("No ItemStack available for color override");
        Object type = dyedColorType();
        Object value = newDyedColor(rgb);
        Method set = stack.getClass().getMethod("set", componentTypeClass(), Object.class);
        set.invoke(stack, type, value);
        Integer check = getStackColorOverride(stack);
        if (check == null || (check & RGB_MASK) != (rgb & RGB_MASK)) {
            throw new IllegalStateException("Eightfold color component was not stored on the ItemStack");
        }
    }

    public static void clearStackColorOverride(Object stack) throws Exception {
        if (stack == null) return;
        Method remove = stack.getClass().getMethod("remove", componentTypeClass());
        remove.invoke(stack, dyedColorType());
    }

    private static Object publicField(Object owner, String name) throws Exception {
        Field field = owner.getClass().getField(name);
        field.setAccessible(true);
        return field.get(owner);
    }

    private static boolean usable(Object stack) {
        if (stack == null) return false;
        try {
            return !Boolean.TRUE.equals(stack.getClass().getMethod("isEmpty").invoke(stack));
        } catch (Throwable ignored) {
            return false;
        }
    }

    private static boolean isCAD(Object stack) {
        if (!usable(stack)) return false;
        try {
            Object item = stack.getClass().getMethod("getItem").invoke(stack);
            return Class.forName("vazkii.psi.api.cad.ICAD").isInstance(item);
        } catch (Throwable ignored) {
            return false;
        }
    }

    private static Object scanInventoryForCAD(Object player) {
        try {
            Object inventory = player.getClass().getMethod("getInventory").invoke(player);
            Method size = inventory.getClass().getMethod("getContainerSize");
            Method get = inventory.getClass().getMethod("getItem", int.class);
            int count = ((Number) size.invoke(inventory)).intValue();
            for (int i = 0; i < count; i++) {
                Object stack = get.invoke(inventory, i);
                if (isCAD(stack)) return stack;
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    private static Object getCastingCAD(Object context) throws Exception {
        try {
            Object tool = publicField(context, "tool");
            if (isCAD(tool)) return tool;
        } catch (Throwable ignored) {
        }

        Object caster = publicField(context, "caster");
        try {
            Object hand = publicField(context, "castFrom");
            if (hand != null) {
                for (Method method : caster.getClass().getMethods()) {
                    if (method.getName().equals("getItemInHand") && method.getParameterCount() == 1) {
                        Object stack = method.invoke(caster, hand);
                        if (isCAD(stack)) return stack;
                    }
                }
            }
        } catch (Throwable ignored) {
        }

        try {
            Class<?> psiApi = Class.forName("vazkii.psi.api.PsiAPI");
            for (Method method : psiApi.getMethods()) {
                if (method.getName().equals("getPlayerCAD")
                        && Modifier.isStatic(method.getModifiers())
                        && method.getParameterCount() == 1) {
                    Object stack = method.invoke(null, caster);
                    if (isCAD(stack)) return stack;
                }
            }
        } catch (Throwable ignored) {
        }

        Object scanned = scanInventoryForCAD(caster);
        if (scanned != null) return scanned;
        throw new IllegalStateException("Could not find a CAD belonging to the spell caster");
    }

    public static void setCADColor(Object context, String color) throws Exception {
        setStackColorOverride(getCastingCAD(context), parseHexColor(color));
    }

    public static void resetCADColor(Object context) throws Exception {
        clearStackColorOverride(getCastingCAD(context));
    }

    /** Legacy helper retained for source compatibility with earlier Eightfold builds. */
    public static Object prepareCircleColorizer(Object cad, Object colorizer, String explicitColor) throws Exception {
        Integer rgb = explicitColor == null ? getStackColorOverride(cad) : parseHexColor(explicitColor);
        if (rgb == null) return colorizer;
        Object copy = colorizer.getClass().getMethod("copy").invoke(colorizer);
        setStackColorOverride(copy, rgb);
        return copy;
    }

    /** Resolve a per-circle RGB value. -1 means use Psi's normal colorizer. */
    public static int resolveCircleColor(Object cad, String explicitColor) {
        if (explicitColor != null) return parseHexColor(explicitColor);
        Integer rgb = getStackColorOverride(cad);
        return rgb == null ? -1 : (rgb & RGB_MASK);
    }

    public static int chooseCircleColor(int eightfoldColor, int psiColor) {
        return eightfoldColor >= 0 ? (eightfoldColor & RGB_MASK) : psiColor;
    }
}
