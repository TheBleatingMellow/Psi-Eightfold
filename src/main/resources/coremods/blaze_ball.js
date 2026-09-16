var Opcodes=Java.type('org.objectweb.asm.Opcodes');
var InsnNode=Java.type('org.objectweb.asm.tree.InsnNode');
var VarInsnNode=Java.type('org.objectweb.asm.tree.VarInsnNode');
var TypeInsnNode=Java.type('org.objectweb.asm.tree.TypeInsnNode');
var FieldInsnNode=Java.type('org.objectweb.asm.tree.FieldInsnNode');
var MethodInsnNode=Java.type('org.objectweb.asm.tree.MethodInsnNode');
var JumpInsnNode=Java.type('org.objectweb.asm.tree.JumpInsnNode');
var LabelNode=Java.type('org.objectweb.asm.tree.LabelNode');
var LdcInsnNode=Java.type('org.objectweb.asm.tree.LdcInsnNode');
var FieldNode=Java.type('org.objectweb.asm.tree.FieldNode');
var InsnList=Java.type('org.objectweb.asm.tree.InsnList');
var TryCatchBlockNode=Java.type('org.objectweb.asm.tree.TryCatchBlockNode');

function fm(c,n,d){
  for(var i=0;i<c.methods.size();i++){
    var m=c.methods.get(i);
    if(String(m.name)===n && String(m.desc)===d) return m;
  }
  return null;
}
function hasField(c,n){
  for(var i=0;i<c.fields.size();i++) if(String(c.fields.get(i).name)===n) return true;
  return false;
}
function addParamCode(list, owner, field, kind, key, color){
  list.add(new VarInsnNode(Opcodes.ALOAD,0));
  list.add(new VarInsnNode(Opcodes.ALOAD,0));
  list.add(new TypeInsnNode(Opcodes.NEW,kind));
  list.add(new InsnNode(Opcodes.DUP));
  list.add(new LdcInsnNode(key));
  list.add(new LdcInsnNode(color));
  // All five enhanced Blaze Ball controls are explicit programmable inputs.
  list.add(new InsnNode(Opcodes.ICONST_0));
  list.add(new InsnNode(Opcodes.ICONST_0));
  list.add(new MethodInsnNode(Opcodes.INVOKESPECIAL,kind,'<init>','(Ljava/lang/String;IZZ)V',false));
  list.add(new InsnNode(Opcodes.DUP_X1));
  list.add(new FieldInsnNode(Opcodes.PUTFIELD,owner,field,'Lvazkii/psi/api/spell/SpellParam;'));
  list.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,owner,'addParam','(Lvazkii/psi/api/spell/SpellParam;)V',false));
}

function initializeCoreMod(){
  return {
    'eightfold_psitweaks_enhanced_blaze_ball':{
      target:{type:'CLASS',name:'com.moratan251.psitweaks.common.spells.spellpiece.trick.PieceTrickBlazeBall'},
      transformer:function(c){
        var owner='com/moratan251/psitweaks/common/spells/spellpiece/trick/PieceTrickBlazeBall';
        if(!hasField(c,'position')) c.fields.add(new FieldNode(Opcodes.ACC_PRIVATE,'position','Lvazkii/psi/api/spell/SpellParam;',null,null));
        if(!hasField(c,'direction')) c.fields.add(new FieldNode(Opcodes.ACC_PRIVATE,'direction','Lvazkii/psi/api/spell/SpellParam;',null,null));
        if(!hasField(c,'speed')) c.fields.add(new FieldNode(Opcodes.ACC_PRIVATE,'speed','Lvazkii/psi/api/spell/SpellParam;',null,null));
        if(!hasField(c,'size')) c.fields.add(new FieldNode(Opcodes.ACC_PRIVATE,'size','Lvazkii/psi/api/spell/SpellParam;',null,null));

        // Replace PsiTweaks' one-input UI with the requested five-input programmable form.
        // SpellPiece adds Eightfold's Condition parameter after initParams returns.
        var init=fm(c,'initParams','()V');
        if(init!=null){
          init.instructions.clear();
          init.tryCatchBlocks.clear();
          init.localVariables=null;
          var q=new InsnList();
          addParamCode(q,owner,'position','vazkii/psi/api/spell/param/ParamVector','psi.spellparam.position',2774482);
          addParamCode(q,owner,'direction','vazkii/psi/api/spell/param/ParamVector','psi.spellparam.direction',2805970);
          addParamCode(q,owner,'speed','vazkii/psi/api/spell/param/ParamNumber','psi.spellparam.speed',4117034);
          addParamCode(q,owner,'power','vazkii/psi/api/spell/param/ParamNumber','psi.spellparam.power',13773354);
          addParamCode(q,owner,'size','vazkii/psi/api/spell/param/ParamNumber','psieightfold.spellparam.size',16753920);
          q.add(new InsnNode(Opcodes.RETURN));
          init.instructions.add(q);
          init.maxStack=8;
          init.maxLocals=1;
        }

        // Keep PsiTweaks' own power, damage multipliers, safety checks, particles and sounds.
        // Immediately after its shootFromRotation call, replace position and velocity with
        // Eightfold's Position / Direction / Speed controls and apply Size via our optional
        // Pehkui reflection bridge.
        var ex=fm(c,'execute','(Lvazkii/psi/api/spell/SpellContext;)Ljava/lang/Object;');
        if(ex!=null){
          var hook=null;
          for(var n=ex.instructions.getFirst();n!=null;n=n.getNext()){
            if(n instanceof MethodInsnNode &&
               String(n.owner)==='com/moratan251/psitweaks/common/entities/EntityBlazeBall' &&
               String(n.name)==='shootFromRotation'){
              hook=n;
              break;
            }
          }
          if(hook!=null){
            var p=new InsnList();

            // Vector3 position = getNotNullParamValue(ctx, position)
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new VarInsnNode(Opcodes.ALOAD,1));
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'position','Lvazkii/psi/api/spell/SpellParam;'));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,owner,'getNotNullParamValue','(Lvazkii/psi/api/spell/SpellContext;Lvazkii/psi/api/spell/SpellParam;)Ljava/lang/Object;',false));
            p.add(new TypeInsnNode(Opcodes.CHECKCAST,'vazkii/psi/api/internal/Vector3'));
            p.add(new VarInsnNode(Opcodes.ASTORE,17));

            // blazeBall.setPos(position.x, position.y, position.z)
            p.add(new VarInsnNode(Opcodes.ALOAD,14));
            p.add(new VarInsnNode(Opcodes.ALOAD,17));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/api/internal/Vector3','x','D'));
            p.add(new VarInsnNode(Opcodes.ALOAD,17));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/api/internal/Vector3','y','D'));
            p.add(new VarInsnNode(Opcodes.ALOAD,17));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/api/internal/Vector3','z','D'));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'com/moratan251/psitweaks/common/entities/EntityBlazeBall','setPos','(DDD)V',false));

            // Vector3 direction = getNotNullParamValue(ctx, direction).normalize()
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new VarInsnNode(Opcodes.ALOAD,1));
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'direction','Lvazkii/psi/api/spell/SpellParam;'));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,owner,'getNotNullParamValue','(Lvazkii/psi/api/spell/SpellContext;Lvazkii/psi/api/spell/SpellParam;)Ljava/lang/Object;',false));
            p.add(new TypeInsnNode(Opcodes.CHECKCAST,'vazkii/psi/api/internal/Vector3'));
            // Do not mutate the upstream vector value if it is reused elsewhere in the spell.
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/api/internal/Vector3','copy','()Lvazkii/psi/api/internal/Vector3;',false));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/api/internal/Vector3','normalize','()Lvazkii/psi/api/internal/Vector3;',false));
            p.add(new VarInsnNode(Opcodes.ASTORE,18));

            // double speed = max(0, input)
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new VarInsnNode(Opcodes.ALOAD,1));
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'speed','Lvazkii/psi/api/spell/SpellParam;'));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,owner,'getNotNullParamValue','(Lvazkii/psi/api/spell/SpellContext;Lvazkii/psi/api/spell/SpellParam;)Ljava/lang/Object;',false));
            p.add(new TypeInsnNode(Opcodes.CHECKCAST,'java/lang/Number'));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'java/lang/Number','doubleValue','()D',false));
            p.add(new InsnNode(Opcodes.DCONST_0));
            p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'java/lang/Math','max','(DD)D',false));
            p.add(new VarInsnNode(Opcodes.DSTORE,19));

            // blazeBall.setDeltaMovement(normalize(Direction) * Speed)
            p.add(new VarInsnNode(Opcodes.ALOAD,14));
            p.add(new VarInsnNode(Opcodes.ALOAD,18));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/api/internal/Vector3','x','D'));
            p.add(new VarInsnNode(Opcodes.DLOAD,19));
            p.add(new InsnNode(Opcodes.DMUL));
            p.add(new VarInsnNode(Opcodes.ALOAD,18));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/api/internal/Vector3','y','D'));
            p.add(new VarInsnNode(Opcodes.DLOAD,19));
            p.add(new InsnNode(Opcodes.DMUL));
            p.add(new VarInsnNode(Opcodes.ALOAD,18));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/api/internal/Vector3','z','D'));
            p.add(new VarInsnNode(Opcodes.DLOAD,19));
            p.add(new InsnNode(Opcodes.DMUL));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'com/moratan251/psitweaks/common/entities/EntityBlazeBall','setDeltaMovement','(DDD)V',false));

            // double size = clamp(input, 0.1, 8.0)
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new VarInsnNode(Opcodes.ALOAD,1));
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'size','Lvazkii/psi/api/spell/SpellParam;'));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,owner,'getNotNullParamValue','(Lvazkii/psi/api/spell/SpellContext;Lvazkii/psi/api/spell/SpellParam;)Ljava/lang/Object;',false));
            p.add(new TypeInsnNode(Opcodes.CHECKCAST,'java/lang/Number'));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'java/lang/Number','doubleValue','()D',false));
            p.add(new LdcInsnNode(0.1));
            p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'java/lang/Math','max','(DD)D',false));
            p.add(new LdcInsnNode(8.0));
            p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'java/lang/Math','min','(DD)D',false));
            p.add(new VarInsnNode(Opcodes.DSTORE,21));

            // Size uses the optional Pehkui bridge. If Pehkui is absent or rejects this
            // entity, ignore only scaling instead of breaking Blaze Ball or Eightfold.
            var tryStart=new LabelNode();
            var tryEnd=new LabelNode();
            var handler=new LabelNode();
            var after=new LabelNode();
            p.add(tryStart);
            p.add(new VarInsnNode(Opcodes.ALOAD,14));
            p.add(new VarInsnNode(Opcodes.DLOAD,21));
            p.add(new InsnNode(Opcodes.D2F));
            p.add(new InsnNode(Opcodes.ICONST_0));
            p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'dev/mellowb/psieightfold/spell/util/ReflectOps','setScale','(Ljava/lang/Object;FI)V',false));
            p.add(tryEnd);
            p.add(new JumpInsnNode(Opcodes.GOTO,after));
            p.add(handler);
            p.add(new InsnNode(Opcodes.POP));
            p.add(after);

            ex.instructions.insert(hook,p);
            ex.tryCatchBlocks.add(new TryCatchBlockNode(tryStart,tryEnd,handler,'java/lang/Throwable'));
            if(ex.maxLocals<23) ex.maxLocals=23;
            if(ex.maxStack<16) ex.maxStack=16;
          }
        }
        return c;
      }
    }
  };
}
