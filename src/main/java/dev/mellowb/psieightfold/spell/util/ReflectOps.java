package dev.mellowb.psieightfold.spell.util;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Set;

/** Small reflection bridge for Minecraft and optional-mod operations. */
public final class ReflectOps {
    private ReflectOps() {}

    public static Object call(Object target, String name, Object... args) throws Exception {
        for (Method method : target.getClass().getMethods()) {
            if (!method.getName().equals(name) || method.getParameterCount() != args.length) continue;
            try {
                method.setAccessible(true);
                return method.invoke(target, args);
            } catch (IllegalArgumentException ignored) {
                // Same-name overload with incompatible argument types.
            }
        }
        throw new NoSuchMethodException(target.getClass() + "." + name);
    }

    public static Object callStatic(String className, String name, Object... args) throws Exception {
        Class<?> type = Class.forName(className);
        for (Method method : type.getMethods()) {
            if (!method.getName().equals(name)
                    || !Modifier.isStatic(method.getModifiers())
                    || method.getParameterCount() != args.length) continue;
            try {
                return method.invoke(null, args);
            } catch (IllegalArgumentException ignored) {
            }
        }
        throw new NoSuchMethodException(className + "." + name);
    }

    public static Object getStatic(String className, String fieldName) throws Exception {
        return Class.forName(className).getField(fieldName).get(null);
    }

    public static Object getField(Object owner, String fieldName) throws Exception {
        return owner.getClass().getField(fieldName).get(owner);
    }

    public static void setField(Object owner, String fieldName, Object value) throws Exception {
        owner.getClass().getField(fieldName).set(owner, value);
    }

    public static String entityName(Object entity) throws Exception {
        return String.valueOf(call(call(entity, "getName"), "getString"));
    }

    public static void setEntityName(Object entity, String name) throws Exception {
        Object component = callStatic("net.minecraft.network.chat.Component", "literal", name);
        call(entity, "setCustomName", component);
    }

    @SuppressWarnings("unchecked")
    public static boolean hasTag(Object entity, String tag) throws Exception {
        return ((Set<Object>) call(entity, "getTags")).contains(tag);
    }

    public static void addTag(Object entity, String tag) throws Exception {
        call(entity, "addTag", tag);
    }

    public static void removeTag(Object entity, String tag) throws Exception {
        call(entity, "removeTag", tag);
    }

    public static void setPos(Object entity, double x, double y, double z) throws Exception {
        call(entity, "setPos", x, y, z);
    }

    public static void launchArrow(Object context, double x, double y, double z,
            double dx, double dy, double dz, double speed) throws Exception {
        Object caster = getField(context, "caster");
        Object level = call(caster, "level");
        Object arrowType = getStatic("net.minecraft.world.entity.EntityType", "ARROW");
        Object arrow = call(arrowType, "create", level);
        if (arrow == null) return;

        call(arrow, "setOwner", caster);
        call(arrow, "setPos", x, y, z);

        // Prevent a spell from becoming a free-arrow item generator.
        try {
            Class<?> pickupClass = Class.forName("net.minecraft.world.entity.projectile.AbstractArrow$Pickup");
            @SuppressWarnings({"rawtypes", "unchecked"})
            Object disallowed = Enum.valueOf((Class<? extends Enum>) pickupClass.asSubclass(Enum.class), "DISALLOWED");
            Field pickup = arrow.getClass().getSuperclass().getField("pickup");
            pickup.set(arrow, disallowed);
        } catch (Throwable ignored) {
        }

        double length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length < 1.0e-9) return;
        call(arrow, "shoot", dx / length, dy / length, dz / length, (float) speed, 0.0f);
        call(level, "addFreshEntity", arrow);
    }

    public static void setScale(Object entity, float scale, int transitionTicks) throws Exception {
        Object base = getStatic("virtuoel.pehkui.api.ScaleTypes", "BASE");
        Object data = call(base, "getScaleData", entity);
        call(data, "setScaleTickDelay", transitionTicks);
        if (transitionTicks <= 0) call(data, "setScale", scale);
        else call(data, "setTargetScale", scale);
    }

    public static double getScale(Object entity) throws Exception {
        Object base = getStatic("virtuoel.pehkui.api.ScaleTypes", "BASE");
        Object data = call(base, "getScaleData", entity);
        return ((Number) call(data, "getScale")).doubleValue();
    }

    public static int parseHexColor(String value) { return ColorOps.parseHexColor(value); }
    public static Integer getStackColorOverride(Object stack) { return ColorOps.getStackColorOverride(stack); }
    public static void setStackColorOverride(Object stack, int rgb) throws Exception { ColorOps.setStackColorOverride(stack, rgb); }
    public static void clearStackColorOverride(Object stack) throws Exception { ColorOps.clearStackColorOverride(stack); }
    public static void setCADColor(Object context, String value) throws Exception { ColorOps.setCADColor(context, value); }
    public static void resetCADColor(Object context) throws Exception { ColorOps.resetCADColor(context); }
    public static Object prepareCircleColorizer(Object cad, Object colorizer, String value) throws Exception {
        return ColorOps.prepareCircleColorizer(cad, colorizer, value);
    }
}
