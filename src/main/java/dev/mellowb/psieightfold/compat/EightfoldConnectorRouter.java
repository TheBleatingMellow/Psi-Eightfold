package dev.mellowb.psieightfold.compat;

import java.util.Map;

import vazkii.psi.api.spell.Spell;
import vazkii.psi.api.spell.SpellGrid;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellPiece;
import vazkii.psi.common.spell.other.PieceConnector;
import vazkii.psi.common.spell.other.PieceCrossConnector;

/** 8-direction, four-channel connector insertion used by drag routing. */
public final class EightfoldConnectorRouter {
    private EightfoldConnectorRouter() {}

    private static SpellParam<?>[] ins(PieceCrossConnector piece) {
        return new SpellParam<?>[] {
                piece.params.get("psi.spellparam.from1"),
                piece.params.get("psi.spellparam.from2"),
                piece.params.get("psi.spellparam.from3"),
                piece.params.get("psi.spellparam.from4")
        };
    }

    private static SpellParam<?>[] outs(PieceCrossConnector piece) {
        return new SpellParam<?>[] {
                piece.params.get("psi.spellparam.to1"),
                piece.params.get("psi.spellparam.to2"),
                piece.params.get("psi.spellparam.to3"),
                piece.params.get("psi.spellparam.to4")
        };
    }

    private static SpellParam.Side get(Map<SpellParam<?>, SpellParam.Side> sides, SpellParam<?> param) {
        if (param == null) return SpellParam.Side.OFF;
        SpellParam.Side side = sides.get(param);
        return side == null ? SpellParam.Side.OFF : side;
    }

    private static void complete(PieceCrossConnector piece, SpellParam.Side side) {
        if (side == null || !side.isEnabled()) return;
        Map<SpellParam<?>, SpellParam.Side> sides = piece.paramSides;
        if (sides.containsValue(side)) return;
        SpellParam<?>[] in = ins(piece);
        SpellParam<?>[] out = outs(piece);
        for (int i = 0; i < 4; i++) {
            if (in[i] != null && out[i] != null && get(sides, in[i]).isEnabled() && !get(sides, out[i]).isEnabled()) {
                sides.put(out[i], side);
                return;
            }
        }
    }

    private static void start(PieceCrossConnector piece, SpellParam.Side side) {
        if (side == null || !side.isEnabled()) return;
        Map<SpellParam<?>, SpellParam.Side> sides = piece.paramSides;
        if (sides.containsValue(side)) return;
        SpellParam<?>[] in = ins(piece);
        SpellParam<?>[] out = outs(piece);
        for (int i = 0; i < 4; i++) {
            if (in[i] != null && out[i] != null && !get(sides, in[i]).isEnabled() && !get(sides, out[i]).isEnabled()) {
                sides.put(in[i], side);
                return;
            }
        }
        for (int i = 0; i < 4; i++) {
            if (in[i] != null && !get(sides, in[i]).isEnabled()) {
                sides.put(in[i], side);
                return;
            }
        }
    }

    public static void insert(Spell spell, int x, int y, SpellParam.Side side) {
        if (spell == null || side == null || !side.isEnabled() || !SpellGrid.exists(x, y)) return;
        SpellGrid grid = spell.grid;

        SpellPiece neighbor = grid.getPieceAtSideSafely(x, y, side);
        if (neighbor instanceof PieceCrossConnector cross) complete(cross, side.getOpposite());

        SpellPiece current = grid.gridData[x][y];
        if (current instanceof PieceCrossConnector cross) {
            start(cross, side);
            return;
        }

        if (current instanceof PieceConnector connector) {
            SpellParam.Side previous = connector.paramSides.get(connector.target);
            if (previous == side) return;

            SpellParam.Side existingInput = SpellParam.Side.OFF;
            for (SpellParam.Side candidate : SpellParam.Side.values()) {
                if (!candidate.isEnabled()) continue;
                SpellPiece other = grid.getPieceAtSideSafely(connector.x, connector.y, candidate);
                if (other == null || !other.isInputSide(candidate.getOpposite())) continue;
                if (existingInput.isEnabled() || candidate == side) return;
                existingInput = candidate;
            }

            PieceCrossConnector cross = new PieceCrossConnector(spell);
            cross.x = x;
            cross.y = y;
            SpellParam<?>[] in = ins(cross);
            SpellParam<?>[] out = outs(cross);
            cross.paramSides.put(in[0], previous);
            cross.paramSides.put(out[0], existingInput);
            cross.paramSides.put(in[1], side);
            grid.gridData[x][y] = cross;
            return;
        }

        if (current != null) return;
        PieceConnector connector = new PieceConnector(spell);
        connector.x = x;
        connector.y = y;
        connector.paramSides.put(connector.target, side);
        grid.gridData[x][y] = connector;
    }
}
