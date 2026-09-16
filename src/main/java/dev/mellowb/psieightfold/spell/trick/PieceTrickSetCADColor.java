package dev.mellowb.psieightfold.spell.trick;

import dev.mellowb.psieightfold.spell.param.ParamString;
import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.spell.*;
import vazkii.psi.api.spell.piece.PieceTrick;

public final class PieceTrickSetCADColor extends PieceTrick {
    SpellParam<?> color;
    public PieceTrickSetCADColor(Spell spell) { super(spell); }
    @Override public void initParams() {
        addParam(color = new ParamString("psieightfold.spellparam.color", 0xFF55FF, false, false));
    }
    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            ReflectOps.setCADColor(context, (String)getNotNullParamValue(context, color));
            return null;
        } catch (Throwable e) {
            throw new SpellRuntimeException("psieightfold.spellerror.invalid_color");
        }
    }
}
