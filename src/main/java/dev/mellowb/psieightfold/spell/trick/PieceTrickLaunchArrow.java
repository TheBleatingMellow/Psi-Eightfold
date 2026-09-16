package dev.mellowb.psieightfold.spell.trick;

import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.internal.Vector3;
import vazkii.psi.api.spell.*;
import vazkii.psi.api.spell.param.ParamNumber;
import vazkii.psi.api.spell.param.ParamVector;
import vazkii.psi.api.spell.piece.PieceTrick;

public final class PieceTrickLaunchArrow extends PieceTrick {
    SpellParam<?> pos;
    SpellParam<?> dir;
    SpellParam<?> speed;

    public PieceTrickLaunchArrow(Spell spell) { super(spell); }

    @Override public void initParams() {
        addParam(pos = new ParamVector("psi.spellparam.position", 0x2A55D2, false, false));
        addParam(dir = new ParamVector("psi.spellparam.direction", 0x3ED22A, false, false));
        addParam(speed = new ParamNumber("psieightfold.spellparam.speed", 0xD2D22A, false, false));
    }

    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            Vector3 p = (Vector3) getNotNullParamValue(context, pos);
            Vector3 d = (Vector3) getNotNullParamValue(context, dir);
            double v = ((Number) getNotNullParamValue(context, speed)).doubleValue();
            ReflectOps.launchArrow(context, p.x, p.y, p.z, d.x, d.y, d.z, v);
            return null;
        } catch (Throwable e) {
            throw new SpellRuntimeException("psieightfold.spellerror.runtime");
        }
    }
}
