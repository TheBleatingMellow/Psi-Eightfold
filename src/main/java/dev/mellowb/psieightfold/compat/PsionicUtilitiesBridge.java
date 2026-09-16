package dev.mellowb.psieightfold.compat;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

import vazkii.psi.api.spell.Spell;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellGrid;

/**
 * Replacement for Psionic Utilities' cardinal-only drag chain.
 * The bridge is deliberately isolated so the rest of Eightfold does not link
 * against Psionic Utilities classes at compile time.
 */
public final class PsionicUtilitiesBridge {
    private PsionicUtilitiesBridge() {}

    public static void draw(Object guiMixin, int startX, int startY, int endX, int endY) {
        try {
            Class<?> type = guiMixin.getClass();
            Field spellField = findField(type, "spell");
            spellField.setAccessible(true);
            Spell spell = (Spell) spellField.get(guiMixin);

            if (!inBounds(spell, startX, startY) || !inBounds(spell, endX, endY)) return;

            int x = startX;
            int y = startY;
            while (x != endX || y != endY) {
                int dx = Integer.compare(endX, x);
                int dy = Integer.compare(endY, y);
                int nx = x + dx;
                int ny = y + dy;
                if (!inBounds(spell, nx, ny)) return;
                x = nx;
                y = ny;
                EightfoldConnectorRouter.insert(spell, x, y, sideFromStep(dx, dy));
            }

            setInt(type, guiMixin, "dragX", endX);
            setInt(type, guiMixin, "dragY", endY);
            setStaticInt(type, "selectedX", endX);
            setStaticInt(type, "selectedY", endY);

            Method changed = findMethod(type, "onSpellChanged", boolean.class);
            changed.setAccessible(true);
            changed.invoke(guiMixin, false);
        } catch (Throwable e) {
            throw new RuntimeException("Psi: Eightfold Psionic Utilities routing failed", e);
        }
    }

    private static boolean inBounds(Spell spell, int x, int y) {
        if (spell == null || spell.grid == null || spell.grid.gridData == null) return false;
        SpellGrid grid = spell.grid;
        if (x < 0 || x >= grid.gridData.length || grid.gridData[x] == null) return false;
        return y >= 0 && y < grid.gridData[x].length;
    }

    private static SpellParam.Side sideFromStep(int dx, int dy) {
        if (dx > 0 && dy > 0) return SpellParam.Side.valueOf("TOP_LEFT");
        if (dx > 0 && dy < 0) return SpellParam.Side.valueOf("BOTTOM_LEFT");
        if (dx < 0 && dy > 0) return SpellParam.Side.valueOf("TOP_RIGHT");
        if (dx < 0 && dy < 0) return SpellParam.Side.valueOf("BOTTOM_RIGHT");
        if (dx > 0) return SpellParam.Side.LEFT;
        if (dx < 0) return SpellParam.Side.RIGHT;
        if (dy > 0) return SpellParam.Side.TOP;
        return SpellParam.Side.BOTTOM;
    }

    private static Field findField(Class<?> type, String name) throws Exception {
        for (Class<?> c = type; c != null; c = c.getSuperclass()) {
            try { return c.getDeclaredField(name); }
            catch (NoSuchFieldException ignored) {}
        }
        throw new NoSuchFieldException(name);
    }

    private static Method findMethod(Class<?> type, String name, Class<?>... params) throws Exception {
        for (Class<?> c = type; c != null; c = c.getSuperclass()) {
            try { return c.getDeclaredMethod(name, params); }
            catch (NoSuchMethodException ignored) {}
        }
        throw new NoSuchMethodException(name);
    }

    private static void setInt(Class<?> type, Object owner, String name, int value) throws Exception {
        Field f = findField(type, name);
        f.setAccessible(true);
        f.setInt(owner, value);
    }

    private static void setStaticInt(Class<?> type, String name, int value) throws Exception {
        Field f = findField(type, name);
        f.setAccessible(true);
        f.setInt(null, value);
    }
}
