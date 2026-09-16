package dev.mellowb.psieightfold.spell.operator;

import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.spell.Spell;
import vazkii.psi.api.spell.SpellContext;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellRuntimeException;
import vazkii.psi.api.spell.param.ParamEntity;
import vazkii.psi.api.spell.piece.PieceOperator;

public final class PieceOperatorEntityName extends PieceOperator {
    private SpellParam<?> entity;

    public PieceOperatorEntityName(Spell spell) { super(spell); }

    @Override public void initParams() {
        addParam(entity = new ParamEntity("psi.spellparam.target", 0xD22EAA, false, false));
    }

    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            return ReflectOps.entityName(getNotNullParamValue(context, entity));
        } catch (Throwable ignored) {
            throw new SpellRuntimeException("psieightfold.spellerror.runtime");
        }
    }

    @Override public Class<?> getEvaluationType() { return String.class; }
}
