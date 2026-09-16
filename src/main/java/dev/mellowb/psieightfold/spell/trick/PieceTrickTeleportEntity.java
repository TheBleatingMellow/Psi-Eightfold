package dev.mellowb.psieightfold.spell.trick;

import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.internal.Vector3;
import vazkii.psi.api.spell.*;
import vazkii.psi.api.spell.param.ParamEntity;
import vazkii.psi.api.spell.param.ParamVector;
import vazkii.psi.api.spell.piece.PieceTrick;

public final class PieceTrickTeleportEntity extends PieceTrick {
    SpellParam<?> target;
    SpellParam<?> pos;

    public PieceTrickTeleportEntity(Spell spell) { super(spell); }

    @Override public void initParams() {
        addParam(target = new ParamEntity("psi.spellparam.target", 0xD22EAA, false, false));
        addParam(pos = new ParamVector("psi.spellparam.position", 0x2A55D2, false, false));
    }

    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            Object entity = getNotNullParamValue(context, target);
            Vector3 p = (Vector3) getNotNullParamValue(context, pos);
            ReflectOps.setPos(entity, p.x, p.y, p.z);
            return null;
        } catch (SpellRuntimeException e) {
            throw e;
        } catch (Throwable e) {
            throw new SpellRuntimeException("psieightfold.spellerror.runtime");
        }
    }
}
