package dev.mellowb.psieightfold.spell.operator;

import dev.mellowb.psieightfold.spell.param.ParamString;
import dev.mellowb.psieightfold.spell.util.BaseConversion;
import vazkii.psi.api.spell.Spell;
import vazkii.psi.api.spell.SpellContext;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellRuntimeException;
import vazkii.psi.api.spell.param.ParamNumber;
import vazkii.psi.api.spell.piece.PieceOperator;

public final class PieceOperatorConvertBase extends PieceOperator {
    private SpellParam<?> value;
    private SpellParam<?> fromBase;
    private SpellParam<?> toBase;

    public PieceOperatorConvertBase(Spell spell) { super(spell); }

    @Override public void initParams() {
        addParam(value = new ParamString("psieightfold.spellparam.value", 0x2AD2D2, false, false));
        addParam(fromBase = new ParamNumber("psieightfold.spellparam.from_base", 0xD2D22A, false, false));
        addParam(toBase = new ParamNumber("psieightfold.spellparam.to_base", 0xD2D22A, false, false));
    }

    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            String v = (String) getNotNullParamValue(context, value);
            int from = ((Number) getNotNullParamValue(context, fromBase)).intValue();
            int to = ((Number) getNotNullParamValue(context, toBase)).intValue();
            return BaseConversion.convert(v, from, to);
        } catch (Throwable ignored) {
            throw new SpellRuntimeException("psieightfold.spellerror.invalid_base");
        }
    }

    @Override public Class<?> getEvaluationType() { return String.class; }
}
