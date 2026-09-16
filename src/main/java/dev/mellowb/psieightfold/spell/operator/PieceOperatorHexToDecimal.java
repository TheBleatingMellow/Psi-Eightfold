package dev.mellowb.psieightfold.spell.operator;

import dev.mellowb.psieightfold.spell.param.ParamString;
import dev.mellowb.psieightfold.spell.util.BaseConversion;
import vazkii.psi.api.spell.Spell;
import vazkii.psi.api.spell.SpellContext;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellRuntimeException;
import vazkii.psi.api.spell.piece.PieceOperator;

public final class PieceOperatorHexToDecimal extends PieceOperator {
    private SpellParam<?> value;

    public PieceOperatorHexToDecimal(Spell spell) { super(spell); }

    @Override public void initParams() {
        addParam(value = new ParamString("psieightfold.spellparam.value", 0x2AD2D2, false, false));
    }

    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            return Double.valueOf(BaseConversion.hexToDec((String) getNotNullParamValue(context, value)));
        } catch (Throwable ignored) {
            throw new SpellRuntimeException("psieightfold.spellerror.invalid_number");
        }
    }

    @Override public Class<?> getEvaluationType() { return Number.class; }
}
