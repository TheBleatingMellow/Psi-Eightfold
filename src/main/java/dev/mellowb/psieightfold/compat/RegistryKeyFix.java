package dev.mellowb.psieightfold.compat;

import java.lang.reflect.Field;

/** Assigns the normal Psi registry key to connector pieces created directly by drag routing. */
public final class RegistryKeyFix {
    private RegistryKeyFix() {}

    public static void apply(Object piece, String path) {
        if (piece == null || path == null) return;
        try {
            Class<?> rl = Class.forName("net.minecraft.resources.ResourceLocation");
            Object key = rl.getMethod("fromNamespaceAndPath", String.class, String.class)
                    .invoke(null, "psi", path);

            Class<?> type = piece.getClass();
            Field field = null;
            while (type != null) {
                try {
                    field = type.getDeclaredField("registryKey");
                    break;
                } catch (NoSuchFieldException ignored) {
                    type = type.getSuperclass();
                }
            }
            if (field == null) throw new NoSuchFieldException("registryKey");
            field.setAccessible(true);
            field.set(piece, key);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("Could not assign Psi registry key " + path, e);
        }
    }
}
