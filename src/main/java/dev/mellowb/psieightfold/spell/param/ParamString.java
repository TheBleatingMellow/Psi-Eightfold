package dev.mellowb.psieightfold.spell.param;

import vazkii.psi.api.spell.param.ParamSpecific;

public final class ParamString extends ParamSpecific<String> {
    public ParamString(String name, int color, boolean canDisable, boolean constant) {
        super(name, color, canDisable, constant);
    }

    @Override
    protected Class<String> getRequiredType() {
        return String.class;
    }
}
