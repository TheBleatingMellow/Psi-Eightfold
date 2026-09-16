package dev.mellowb.psieightfold.registry;

import java.lang.reflect.Method;
import java.util.function.Supplier;

import vazkii.psi.api.spell.SpellPiece;
import vazkii.psi.api.spell.SpellPieceType;

/** Registers only Eightfold-owned spell-piece classes into Psi's spell-piece registry. */
public final class EightfoldRegistrar {
    private EightfoldRegistrar() {}

    public static void registerAll() {
        reg("trick_teleport_entity", "dev.mellowb.psieightfold.spell.trick.PieceTrickTeleportEntity");
        reg("trick_launch_arrow", "dev.mellowb.psieightfold.spell.trick.PieceTrickLaunchArrow");
        reg("trick_set_entity_name", "dev.mellowb.psieightfold.spell.trick.PieceTrickSetEntityName");
        reg("trick_add_entity_tag", "dev.mellowb.psieightfold.spell.trick.PieceTrickAddEntityTag");
        reg("trick_remove_entity_tag", "dev.mellowb.psieightfold.spell.trick.PieceTrickRemoveEntityTag");
        reg("trick_set_cad_color", "dev.mellowb.psieightfold.spell.trick.PieceTrickSetCADColor");
        reg("trick_reset_cad_color", "dev.mellowb.psieightfold.spell.trick.PieceTrickResetCADColor");
        reg("operator_decimal_to_hex", "dev.mellowb.psieightfold.spell.operator.PieceOperatorDecimalToHex");
        reg("operator_hex_to_decimal", "dev.mellowb.psieightfold.spell.operator.PieceOperatorHexToDecimal");
        reg("operator_convert_base", "dev.mellowb.psieightfold.spell.operator.PieceOperatorConvertBase");
        reg("operator_entity_name", "dev.mellowb.psieightfold.spell.operator.PieceOperatorEntityName");
        reg("operator_entity_has_tag", "dev.mellowb.psieightfold.spell.operator.PieceOperatorEntityHasTag");
        reg("operator_entities_with_tag", "dev.mellowb.psieightfold.spell.operator.PieceOperatorEntitiesWithTag");
        reg("operator_entities_with_name", "dev.mellowb.psieightfold.spell.operator.PieceOperatorEntitiesWithName");
        if (exists("virtuoel.pehkui.api.ScaleTypes")) {
            reg("trick_set_entity_scale", "dev.mellowb.psieightfold.spell.trick.PieceTrickSetEntityScale");
            reg("operator_entity_scale", "dev.mellowb.psieightfold.spell.operator.PieceOperatorEntityScale");
        }
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static void reg(String id, String className) {
        try {
            Class<? extends SpellPiece> pieceClass = (Class<? extends SpellPiece>) Class.forName(className);
            SpellPieceType type = SpellPieceType.ofClass(pieceClass);
            Object registry = Class.forName("vazkii.psi.api.PsiAPI").getField("SPELL_PIECE_REGISTRY").get(null);
            Class<?> rlClass = Class.forName("net.minecraft.resources.ResourceLocation");
            Object idObject = rlClass.getMethod("fromNamespaceAndPath", String.class, String.class)
                    .invoke(null, "psieightfold", id);

            Class<?> registries = Class.forName("vazkii.psi.common.registry.PsiRegistries");
            Method register = null;
            for (Method method : registries.getMethods()) {
                if (method.getName().equals("register") && method.getParameterCount() == 3) {
                    register = method;
                    break;
                }
            }
            if (register == null) throw new NoSuchMethodException("PsiRegistries.register");
            Supplier<SpellPieceType> supplier = () -> type;
            register.invoke(null, registry, idObject, supplier);
        } catch (Throwable e) {
            throw new RuntimeException("Failed to register Eightfold spell piece " + id, e);
        }
    }

    private static boolean exists(String className) {
        try { Class.forName(className); return true; }
        catch (Throwable ignored) { return false; }
    }
}
