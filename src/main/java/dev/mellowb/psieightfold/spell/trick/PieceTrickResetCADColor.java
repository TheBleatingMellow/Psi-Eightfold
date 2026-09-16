package dev.mellowb.psieightfold.spell.trick;

import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.spell.*;
import vazkii.psi.api.spell.piece.PieceTrick;

public final class PieceTrickResetCADColor extends PieceTrick {
    public PieceTrickResetCADColor(Spell spell) { super(spell); }
    @Override public void initParams() {}
    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            ReflectOps.resetCADColor(context);
            return null;
        } catch (Throwable e) {
            throw new SpellRuntimeException("psieightfold.spellerror.runtime");
        }
    }
}
