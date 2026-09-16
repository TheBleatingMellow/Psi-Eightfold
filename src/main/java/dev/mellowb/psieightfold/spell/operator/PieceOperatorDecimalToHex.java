package dev.mellowb.psieightfold.spell.operator;

import dev.mellowb.psieightfold.spell.util.BaseConversion;
import vazkii.psi.api.spell.Spell;
import vazkii.psi.api.spell.SpellContext;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellRuntimeException;
import vazkii.psi.api.spell.param.ParamNumber;
import vazkii.psi.api.spell.piece.PieceOperator;

public final class PieceOperatorDecimalToHex extends PieceOperator {
    private SpellParam<?> value;

    public PieceOperatorDecimalToHex(Spell spell) { super(spell); }

    @Override public void initParams() {
        addParam(value = new ParamNumber("psieightfold.spellparam.value", 0xD2D22A, false, false));
    }

    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        return BaseConversion.decToHex((Number) getNotNullParamValue(context, value));
    }

    @Override public Class<?> getEvaluationType() { return String.class; }
}
