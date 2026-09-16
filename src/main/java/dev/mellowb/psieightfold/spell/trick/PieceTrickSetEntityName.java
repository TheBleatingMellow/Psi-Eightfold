package dev.mellowb.psieightfold.spell.trick;

import dev.mellowb.psieightfold.spell.param.ParamString;
import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.spell.*;
import vazkii.psi.api.spell.param.ParamEntity;
import vazkii.psi.api.spell.piece.PieceTrick;

public final class PieceTrickSetEntityName extends PieceTrick {
    SpellParam<?> entity;
    SpellParam<?> text;
    public PieceTrickSetEntityName(Spell spell) { super(spell); }
    @Override public void initParams() {
        addParam(entity = new ParamEntity("psi.spellparam.target", 0xD22EAA, false, false));
        addParam(text = new ParamString("psieightfold.spellparam.name", 0x2AD2D2, false, false));
    }
    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            ReflectOps.setEntityName(getNotNullParamValue(context, entity), (String)getNotNullParamValue(context, text));
            return null;
        } catch (Throwable e) {
            throw new SpellRuntimeException("psieightfold.spellerror.runtime");
        }
    }
}
