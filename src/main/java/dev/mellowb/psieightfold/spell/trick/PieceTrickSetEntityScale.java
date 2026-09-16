package dev.mellowb.psieightfold.spell.trick;

import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.spell.*;
import vazkii.psi.api.spell.param.ParamEntity;
import vazkii.psi.api.spell.param.ParamNumber;
import vazkii.psi.api.spell.piece.PieceTrick;

public final class PieceTrickSetEntityScale extends PieceTrick {
    SpellParam<?> entity;
    SpellParam<?> scale;
    SpellParam<?> transition;
    public PieceTrickSetEntityScale(Spell spell) { super(spell); }
    @Override public void initParams() {
        addParam(entity = new ParamEntity("psi.spellparam.target", 0xD22EAA, false, false));
        addParam(scale = new ParamNumber("psieightfold.spellparam.scale", 0xD2D22A, false, false));
        addParam(transition = new ParamNumber("psieightfold.spellparam.transition", 0x2AD2D2, true, false));
    }
    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            Object e = getNotNullParamValue(context, entity);
            float s = ((Number)getNotNullParamValue(context, scale)).floatValue();
            Number t = (Number)getParamValue(context, transition);
            ReflectOps.setScale(e, s, t == null ? 0 : t.intValue());
            return null;
        } catch (Throwable e) {
            throw new SpellRuntimeException("psieightfold.spellerror.pehkui");
        }
    }
}
