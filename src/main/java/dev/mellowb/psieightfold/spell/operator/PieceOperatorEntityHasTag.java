package dev.mellowb.psieightfold.spell.operator;

import dev.mellowb.psieightfold.spell.param.ParamString;
import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.spell.Spell;
import vazkii.psi.api.spell.SpellContext;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellRuntimeException;
import vazkii.psi.api.spell.param.ParamEntity;
import vazkii.psi.api.spell.piece.PieceOperator;

public final class PieceOperatorEntityHasTag extends PieceOperator {
    private SpellParam<?> entity;
    private SpellParam<?> tag;

    public PieceOperatorEntityHasTag(Spell spell) { super(spell); }

    @Override public void initParams() {
        addParam(entity = new ParamEntity("psi.spellparam.target", 0xD22EAA, false, false));
        addParam(tag = new ParamString("psieightfold.spellparam.tag", 0x2AD2D2, false, false));
    }

    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            boolean has = ReflectOps.hasTag(getNotNullParamValue(context, entity),
                    (String) getNotNullParamValue(context, tag));
            return Double.valueOf(has ? 1.0 : 0.0);
        } catch (Throwable ignored) {
            throw new SpellRuntimeException("psieightfold.spellerror.runtime");
        }
    }

    @Override public Class<?> getEvaluationType() { return Number.class; }
}
