package dev.mellowb.psieightfold.spell.operator;

import java.util.ArrayList;
import java.util.List;

import net.minecraft.world.entity.Entity;

import dev.mellowb.psieightfold.spell.param.ParamString;
import dev.mellowb.psieightfold.spell.util.ReflectOps;
import vazkii.psi.api.spell.Spell;
import vazkii.psi.api.spell.SpellContext;
import vazkii.psi.api.spell.SpellParam;
import vazkii.psi.api.spell.SpellRuntimeException;
import vazkii.psi.api.spell.param.ParamEntityListWrapper;
import vazkii.psi.api.spell.piece.PieceOperator;
import vazkii.psi.api.spell.wrapper.EntityListWrapper;

public final class PieceOperatorEntitiesWithTag extends PieceOperator {
    private SpellParam<?> list;
    private SpellParam<?> tag;

    public PieceOperatorEntitiesWithTag(Spell spell) { super(spell); }

    @Override public void initParams() {
        addParam(list = new ParamEntityListWrapper("psi.spellparam.list", 0xD22EAA, false, false));
        addParam(tag = new ParamString("psieightfold.spellparam.tag", 0x2AD2D2, false, false));
    }

    @Override public Object execute(SpellContext context) throws SpellRuntimeException {
        try {
            EntityListWrapper source = (EntityListWrapper) getNotNullParamValue(context, list);
            String wanted = (String) getNotNullParamValue(context, tag);
            List<Entity> result = new ArrayList<>();
            for (Entity entity : source) {
                if (ReflectOps.hasTag(entity, wanted)) result.add(entity);
            }
            return EntityListWrapper.make(result);
        } catch (Throwable ignored) {
            throw new SpellRuntimeException("psieightfold.spellerror.runtime");
        }
    }

    @Override public Class<?> getEvaluationType() { return EntityListWrapper.class; }
}
